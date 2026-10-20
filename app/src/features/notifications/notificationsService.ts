import { supabase } from '../../lib/supabase';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export interface RideAlertItem {
  id: string;
  destinationName: string;
  earliestDeparture: string;
  latestDeparture: string;
  active: boolean;
  createdAt: string;
}

export interface ActivePoolChatSummary {
  poolId: string;
  destinationName: string;
  departsAt: string;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  seatsTaken: number;
  totalSeats: number;
}

export const notificationsService = {
  /**
   * Register push device token
   */
  async registerPushToken(
    token: string,
    deviceType: 'ios' | 'android' | 'web'
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('device_tokens') as any).upsert(
        {
          user_id: user.id,
          token,
          device_type: deviceType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, token' }
      );

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Fetch in-app notifications
   */
  async fetchNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const { data, error } = await (supabase.from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        payload: row.payload || {},
        readAt: row.read_at,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Mark single notification as read
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read for user
   */
  async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetch active ride alerts
   */
  async fetchActiveRideAlerts(userId: string): Promise<RideAlertItem[]> {
    try {
      const { data, error } = await (supabase.from('ride_alerts') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        destinationName: row.destination_name,
        earliestDeparture: row.earliest_departure,
        latestDeparture: row.latest_departure,
        active: row.active,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Delete or toggle ride alert
   */
  async toggleRideAlert(alertId: string, active: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase.from('ride_alerts') as any)
        .update({ active })
        .eq('id', alertId);

      return !error;
    } catch {
      return false;
    }
  },

  async deleteRideAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('ride_alerts') as any)
        .delete()
        .eq('id', alertId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetch user's active pool chats for the Messages tab
   */
  async fetchUserActiveChats(userId: string): Promise<ActivePoolChatSummary[]> {
    try {
      const { data, error } = await (supabase.from('pool_members') as any)
        .select(`
          pool_id,
          pool:pools!pool_members_pool_id_fkey(
            id,
            destination_name,
            departs_at,
            status,
            seats_taken,
            total_seats
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (error || !data) return [];

      const poolSummaries: ActivePoolChatSummary[] = [];

      for (const item of data) {
        const p = item.pool;
        if (!p) continue;

        // Fetch last message for each pool
        const { data: lastMsg } = await (supabase.from('pool_messages') as any)
          .select('body, created_at')
          .eq('pool_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        poolSummaries.push({
          poolId: p.id,
          destinationName: p.destination_name,
          departsAt: p.departs_at,
          lastMessage: lastMsg?.body || 'No messages yet',
          lastMessageTime: lastMsg?.created_at || p.departs_at,
          seatsTaken: p.seats_taken,
          totalSeats: p.total_seats,
        });
      }

      return poolSummaries;
    } catch {
      return [];
    }
  },

  /**
   * Subscribe to realtime notifications for active user
   */
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notif: NotificationItem) => void
  ): () => void {
    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row) {
            onNewNotification({
              id: row.id,
              userId: row.user_id,
              type: row.type,
              payload: row.payload || {},
              readAt: row.read_at,
              createdAt: row.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
