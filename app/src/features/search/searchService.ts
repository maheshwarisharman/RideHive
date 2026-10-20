import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';

export interface PoolSearchResult {
  id: string;
  host_id: string;
  host_name: string;
  host_avatar_url: string | null;
  host_rating_avg: number;
  origin_name: string;
  destination_name: string;
  departs_at: string;
  flexibility_minutes: number;
  total_seats: number;
  seats_taken: number;
  seats_left: number;
  status: string;
  join_mode: string;
  estimated_fare_per_person: number;
  time_diff_minutes: number;
  dest_distance_m: number;
}

export interface SearchParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  windowStart: Date;
  windowEnd: Date;
  seatsNeeded?: number;
  userId?: string | null;
}

export const searchService = {
  /**
   * Search pools using PostGIS search_pools RPC
   */
  async searchPools(params: SearchParams): Promise<PoolSearchResult[]> {
    try {
      const { data, error } = await (supabase.rpc as any)('search_pools', {
        p_origin_lat: params.originLat,
        p_origin_lng: params.originLng,
        p_dest_lat: params.destLat,
        p_dest_lng: params.destLng,
        p_window_start: params.windowStart.toISOString(),
        p_window_end: params.windowEnd.toISOString(),
        p_seats_needed: params.seatsNeeded || 1,
        p_user_id: params.userId || null,
      });

      if (error || !data) return [];
      return data as PoolSearchResult[];
    } catch {
      return [];
    }
  },

  /**
   * Fetch pools departing soon (next 6 hours) from campus
   */
  async fetchLeavingSoonPools(limit: number = 5): Promise<any[]> {
    try {
      const now = new Date().toISOString();
      const sixHoursLater = new Date(Date.now() + 6 * 3600 * 1000).toISOString();

      const { data, error } = await supabase
        .from('pools')
        .select(`
          id,
          origin_name,
          destination_name,
          departs_at,
          flexibility_minutes,
          total_seats,
          seats_taken,
          status,
          join_mode,
          estimated_fare_min,
          host:profiles!pools_host_id_fkey(full_name, avatar_url, rating_avg)
        `)
        .eq('status', 'open')
        .gte('departs_at', now)
        .lte('departs_at', sixHoursLater)
        .order('departs_at', { ascending: true })
        .limit(limit);

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  /**
   * Fetch user's next upcoming ride
   */
  async fetchNextRide(userId: string): Promise<any | null> {
    try {
      const { data, error } = await (supabase.from('pool_members') as any)
        .select(`
          role,
          status,
          pool:pools(
            id,
            origin_name,
            destination_name,
            departs_at,
            total_seats,
            seats_taken,
            status,
            join_mode,
            cab_provider,
            cab_vehicle_number,
            host:profiles!pools_host_id_fkey(full_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data || !(data as any).pool) return null;
      const pool = (data as any).pool as any;

      if (['open', 'closed', 'booked'].includes(pool.status)) {
        return {
          ...pool,
          myRole: (data as any).role,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Create ride alert when search has no results
   */
  async createRideAlert(
    userId: string,
    originName: string,
    originLat: number,
    originLng: number,
    destName: string,
    destLat: number,
    destLng: number,
    windowStart: Date,
    windowEnd: Date,
    seats: number = 1
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const originGeog = `SRID=4326;POINT(${originLng} ${originLat})`;
      const destGeog = `SRID=4326;POINT(${destLng} ${destLat})`;

      const { error } = await (supabase.from('ride_alerts') as any).insert({
        user_id: userId,
        origin_name: originName,
        origin_geog: originGeog as any,
        destination_name: destName,
        destination_geog: destGeog as any,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        seats,
        active: true,
      });

      if (error) return { success: false, error };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },
};
