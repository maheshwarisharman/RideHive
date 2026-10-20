import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';

export interface FareEstimate {
  minPaise: number;
  maxPaise: number;
  estimatedPaise: number;
  perPersonPaise: number;
}

export interface CreatePoolPayload {
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destLat: number;
  destLng: number;
  destinationPlaceId?: string | null;
  departsAt: Date;
  flexibilityMinutes: number;
  totalSeats: number;
  joinMode: 'instant' | 'approval';
  note?: string;
  routePolyline?: string | null;
  routeDistanceM?: number;
  routeDurationS?: number;
}

export const poolService = {
  /**
   * Calculate fare estimate in integer paise based on route distance
   */
  calculateFareEstimate(distanceMeters: number, totalSeats: number = 4): FareEstimate {
    const distKm = Math.max(distanceMeters / 1000, 1);
    const basePaise = config.fare.baseFarePaise;
    const perKmPaise = config.fare.perKmPaise;

    const rawTotal = Math.round(basePaise + distKm * perKmPaise);
    // Allow +/- variance for traffic & surge
    const minPaise = Math.round(rawTotal * 0.9);
    const maxPaise = Math.round(rawTotal * 1.15);
    const perPersonPaise = Math.round(rawTotal / Math.max(totalSeats, 1));

    return {
      minPaise,
      maxPaise,
      estimatedPaise: rawTotal,
      perPersonPaise,
    };
  },

  /**
   * Liquidity guard: check if pools already exist for this route and window
   */
  async checkLiquidityMatches(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    departsAt: Date,
    flexibilityMinutes: number = 30
  ): Promise<any[]> {
    try {
      const windowStart = new Date(departsAt.getTime() - flexibilityMinutes * 60 * 1000).toISOString();
      const windowEnd = new Date(departsAt.getTime() + flexibilityMinutes * 60 * 1000).toISOString();

      const { data, error } = await (supabase.rpc as any)('search_pools', {
        p_origin_lat: originLat,
        p_origin_lng: originLng,
        p_dest_lat: destLat,
        p_dest_lng: destLng,
        p_window_start: windowStart,
        p_window_end: windowEnd,
        p_seats_needed: 1,
      });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  /**
   * Create pool via security definer RPC
   */
  async createPool(payload: CreatePoolPayload): Promise<{ poolId: string | null; error: Error | null }> {
    try {
      const fare = poolService.calculateFareEstimate(
        payload.routeDistanceM || 25000,
        payload.totalSeats
      );

      const { data, error } = await (supabase.rpc as any)('create_pool', {
        p_origin_name: payload.originName,
        p_origin_lat: payload.originLat,
        p_origin_lng: payload.originLng,
        p_destination_name: payload.destinationName,
        p_dest_lat: payload.destLat,
        p_dest_lng: payload.destLng,
        p_destination_place_id: payload.destinationPlaceId || null,
        p_departs_at: payload.departsAt.toISOString(),
        p_flexibility_minutes: payload.flexibilityMinutes,
        p_total_seats: payload.totalSeats,
        p_join_mode: payload.joinMode,
        p_note: payload.note || null,
        p_estimated_fare_min: fare.minPaise,
        p_estimated_fare_max: fare.maxPaise,
        p_route_polyline: payload.routePolyline || null,
        p_route_distance_m: payload.routeDistanceM || null,
        p_route_duration_s: payload.routeDurationS || null,
      });

      if (error) return { poolId: null, error };
      return { poolId: data as string, error: null };
    } catch (err: any) {
      return { poolId: null, error: err };
    }
  },
};
