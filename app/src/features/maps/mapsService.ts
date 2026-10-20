import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';

export interface LocationItem {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  placeId?: string | null;
  type?: string;
  isCampus?: boolean;
}

export interface RouteResult {
  polyline: string | null;
  coordinates: { latitude: number; longitude: number }[];
  distanceM: number;
  durationS: number;
  fallback?: boolean;
}

export const mapsService = {
  /**
   * Fetch curated destinations from Supabase locations table
   */
  async fetchCuratedLocations(): Promise<LocationItem[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('is_campus', { ascending: false });

      if (error || !data) return [];

      return data.map((loc: any) => {
        // Point is PostGIS geography string or coordinates
        let lat = config.campus.latitude;
        let lng = config.campus.longitude;

        if (loc.latitude !== undefined && loc.longitude !== undefined) {
          lat = loc.latitude;
          lng = loc.longitude;
        }

        return {
          id: loc.id,
          name: loc.name,
          latitude: lat,
          longitude: lng,
          placeId: loc.place_id,
          type: loc.type,
          isCampus: loc.is_campus,
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Search places via Edge Function autocomplete with curated fallback
   */
  async searchPlaces(
    input: string,
    sessionToken?: string
  ): Promise<{ placeId: string; description: string; mainText: string; secondaryText: string }[]> {
    if (!input || input.trim().length === 0) return [];

    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: { input, sessionToken },
      });

      if (!error && data?.predictions && data.predictions.length > 0) {
        return data.predictions;
      }
    } catch {
      // Fall through to local curated match
    }

    // Local fallback matching curated names
    const curated = await mapsService.fetchCuratedLocations();
    const query = input.toLowerCase();
    return curated
      .filter((loc) => loc.name.toLowerCase().includes(query))
      .map((loc) => ({
        placeId: loc.id || loc.name,
        description: loc.name,
        mainText: loc.name,
        secondaryText: loc.type ? `${loc.type.toUpperCase()} · Curated hub` : 'Curated hub',
      }));
  },

  /**
   * Fetch place details via Edge Function
   */
  async getPlaceDetails(
    placeId: string,
    sessionToken?: string
  ): Promise<LocationItem | null> {
    try {
      const { data, error } = await supabase.functions.invoke('place-details', {
        body: { placeId, sessionToken },
      });

      if (!error && data?.latitude && data?.longitude) {
        return {
          name: data.name || data.formattedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          placeId,
        };
      }
    } catch {
      // Fallback
    }

    // Check if placeId is a curated location
    const curated = await mapsService.fetchCuratedLocations();
    const match = curated.find((c) => c.id === placeId || c.name === placeId);
    if (match) return match;

    return null;
  },

  /**
   * Calculate route and polyline via Edge Function
   */
  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteResult> {
    try {
      const { data, error } = await supabase.functions.invoke('route', {
        body: { originLat, originLng, destLat, destLng },
      });

      if (!error && data?.distanceM) {
        const coordinates = data.polyline
          ? mapsService.decodePolyline(data.polyline)
          : [
              { latitude: originLat, longitude: originLng },
              { latitude: destLat, longitude: destLng },
            ];

        return {
          polyline: data.polyline,
          coordinates,
          distanceM: data.distanceM,
          durationS: data.durationS,
          fallback: data.fallback,
        };
      }
    } catch {
      // Fallback haversine
    }

    // Direct line approximation
    const distM = mapsService.haversineDistance(originLat, originLng, destLat, destLng);
    return {
      polyline: null,
      coordinates: [
        { latitude: originLat, longitude: originLng },
        { latitude: destLat, longitude: destLng },
      ],
      distanceM: distM,
      durationS: Math.round(distM / 11),
      fallback: true,
    };
  },

  /**
   * Haversine distance in meters
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  /**
   * Decode Google polyline string into lat/lng array
   */
  decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  },
};
