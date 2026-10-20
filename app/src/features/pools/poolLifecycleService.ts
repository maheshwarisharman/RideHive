import { supabase } from '../../lib/supabase';

export interface PoolMemberInfo {
  id: string;
  userId: string;
  role: 'host' | 'member';
  status: 'pending' | 'confirmed' | 'left' | 'removed';
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  upiId?: string | null;
}

export interface DetailedPool {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  hostRatingAvg: number;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destLat: number;
  destLng: number;
  destinationPlaceId?: string | null;
  routePolyline?: string | null;
  routeDistanceM?: number;
  routeDurationS?: number;
  departsAt: string;
  flexibilityMinutes: number;
  totalSeats: number;
  seatsTaken: number;
  joinMode: 'instant' | 'approval';
  status: 'open' | 'closed' | 'booked' | 'completed' | 'cancelled' | 'expired';
  note?: string | null;
  estimatedFareMin: number;
  estimatedFareMax: number;
  finalFare?: number | null;
  cabProvider?: string | null;
  cabVehicleNumber?: string | null;
  cabNote?: string | null;
  members: PoolMemberInfo[];
  myRole?: 'host' | 'member' | null;
  myStatus?: 'pending' | 'confirmed' | 'left' | 'removed' | null;
}

export const poolLifecycleService = {
  /**
   * Fetch complete pool details, members, and user state
   */
  async fetchPoolDetails(poolId: string, currentUserId?: string): Promise<DetailedPool | null> {
    try {
      const { data: pool, error } = await (supabase.from('pools') as any)
        .select(`
          *,
          host:profiles!pools_host_id_fkey(full_name, avatar_url, rating_avg)
        `)
        .eq('id', poolId)
        .single();

      if (error || !pool) return null;

      // Fetch confirmed & pending members
      const { data: membersData } = await (supabase.from('pool_members') as any)
        .select(`
          id,
          user_id,
          role,
          status,
          user:profiles!pool_members_user_id_fkey(full_name, avatar_url)
        `)
        .eq('pool_id', poolId)
        .in('status', ['confirmed', 'pending']);

      const members: PoolMemberInfo[] = (membersData || []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        status: m.status,
        name: m.user?.full_name || 'Rider',
        avatarUrl: m.user?.avatar_url,
      }));

      // Check current user's role
      const myMembership = currentUserId ? members.find((m) => m.userId === currentUserId) : null;

      // Extract coordinates from PostGIS geography or stored lat/lng
      let originLat = configCampusDefault(0);
      let originLng = configCampusDefault(1);
      let destLat = 28.55616;
      let destLng = 77.08638;

      if (pool.origin_latitude) originLat = pool.origin_latitude;
      if (pool.origin_longitude) originLng = pool.origin_longitude;
      if (pool.destination_latitude) destLat = pool.destination_latitude;
      if (pool.destination_longitude) destLng = pool.destination_longitude;

      return {
        id: pool.id,
        hostId: pool.host_id,
        hostName: pool.host?.full_name || 'Host',
        hostAvatarUrl: pool.host?.avatar_url,
        hostRatingAvg: Number(pool.host?.rating_avg) || 5.0,
        originName: pool.origin_name,
        originLat,
        originLng,
        destinationName: pool.destination_name,
        destLat,
        destLng,
        destinationPlaceId: pool.destination_place_id,
        routePolyline: pool.route_polyline,
        routeDistanceM: pool.route_distance_m,
        routeDurationS: pool.route_duration_s,
        departsAt: pool.departs_at,
        flexibilityMinutes: pool.flexibility_minutes,
        totalSeats: pool.total_seats,
        seatsTaken: pool.seats_taken,
        joinMode: pool.join_mode,
        status: pool.status,
        note: pool.note,
        estimatedFareMin: pool.estimated_fare_min,
        estimatedFareMax: pool.estimated_fare_max,
        finalFare: pool.final_fare,
        cabProvider: pool.cab_provider,
        cabVehicleNumber: pool.cab_vehicle_number,
        cabNote: pool.cab_note,
        members,
        myRole: myMembership?.role || (currentUserId === pool.host_id ? 'host' : null),
        myStatus: myMembership?.status || null,
      };
    } catch {
      return null;
    }
  },

  /**
   * Concurrency-safe join pool RPC
   */
  async joinPool(poolId: string): Promise<{ success: boolean; status?: string; message?: string; error?: Error | null }> {
    try {
      const { data, error } = await (supabase.rpc as any)('join_pool', {
        p_pool_id: poolId,
      });

      if (error) return { success: false, error, message: error.message };
      return { success: true, status: data?.status, message: data?.message };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Concurrency-safe leave pool RPC
   */
  async leavePool(poolId: string): Promise<{ success: boolean; error?: Error | null }> {
    try {
      const { data, error } = await (supabase.rpc as any)('leave_pool', {
        p_pool_id: poolId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Host approves pending join request
   */
  async approveMember(poolId: string, targetUserId: string): Promise<{ success: boolean; error?: Error | null }> {
    try {
      const { error } = await (supabase.rpc as any)('approve_member', {
        p_pool_id: poolId,
        p_target_user_id: targetUserId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Host closes joining
   */
  async closePool(poolId: string): Promise<{ success: boolean; error?: Error | null }> {
    try {
      const { error } = await (supabase.rpc as any)('close_pool', {
        p_pool_id: poolId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Host marks cab as booked with provider & vehicle number
   */
  async markBooked(
    poolId: string,
    provider: string,
    vehicleNumber?: string,
    note?: string
  ): Promise<{ success: boolean; error?: Error | null }> {
    try {
      const { error } = await (supabase.rpc as any)('mark_booked', {
        p_pool_id: poolId,
        p_provider: provider,
        p_vehicle_number: vehicleNumber || null,
        p_note: note || null,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Host cancels pool
   */
  async cancelPool(poolId: string): Promise<{ success: boolean; error?: Error | null }> {
    try {
      const { error } = await (supabase.rpc as any)('cancel_pool', {
        p_pool_id: poolId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Fetch member contacts (accessible only to confirmed members)
   */
  async fetchMemberContacts(poolId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase.rpc as any)('get_pool_member_contacts', {
        p_pool_id: poolId,
      });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },
};

function configCampusDefault(idx: number): number {
  return idx === 0 ? 28.24765 : 76.81395;
}
