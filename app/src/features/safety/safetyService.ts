import { supabase } from '../../lib/supabase';

export interface RatingParams {
  poolId: string;
  toUserId: string;
  score: number; // 1 to 5
  tags?: string[];
  comments?: string;
}

export interface ReportParams {
  reportedUserId: string;
  poolId?: string;
  reason: string;
  details?: string;
}

export interface BlockedUserItem {
  id: string;
  blockedUserId: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  pool_updates: boolean;
  chat_messages: boolean;
  departure_reminders: boolean;
  ride_alerts: boolean;
  payment_updates: boolean;
}

export const safetyService = {
  /**
   * Submit post-ride rating (1 to 5 stars)
   */
  async submitRating(
    params: RatingParams
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('ratings') as any).insert({
        pool_id: params.poolId,
        from_user_id: user.id,
        to_user_id: params.toUserId,
        score: Math.min(5, Math.max(1, params.score)),
        tags: params.tags || [],
        comments: params.comments || null,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Submit trust & safety report against a user
   */
  async reportUser(
    params: ReportParams
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('reports') as any).insert({
        reporter_id: user.id,
        reported_user_id: params.reportedUserId,
        pool_id: params.poolId || null,
        reason: params.reason,
        details: params.details || null,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Block a user so their pools no longer appear in search results
   */
  async blockUser(blockedUserId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('blocks') as any).insert({
        blocker_id: user.id,
        blocked_user_id: blockedUserId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockedUserId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('blocks') as any)
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_user_id', blockedUserId);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Fetch all users blocked by the active user
   */
  async fetchBlockedUsers(): Promise<BlockedUserItem[]> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return [];

      const { data, error } = await (supabase.from('blocks') as any)
        .select(`
          id,
          blocked_user_id,
          created_at,
          blocked:profiles!blocks_blocked_user_id_fkey(full_name, avatar_url)
        `)
        .eq('blocker_id', user.id);

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        blockedUserId: row.blocked_user_id,
        fullName: row.blocked?.full_name || 'Blocked User',
        avatarUrl: row.blocked?.avatar_url || null,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch notification preferences
   */
  async fetchNotificationPrefs(): Promise<NotificationPrefs> {
    const defaultPrefs: NotificationPrefs = {
      pool_updates: true,
      chat_messages: true,
      departure_reminders: true,
      ride_alerts: true,
      payment_updates: true,
    };

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return defaultPrefs;

      const { data, error } = await (supabase.from('notification_prefs') as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return defaultPrefs;

      return {
        pool_updates: data.pool_updates ?? true,
        chat_messages: data.chat_messages ?? true,
        departure_reminders: data.departure_reminders ?? true,
        ride_alerts: data.ride_alerts ?? true,
        payment_updates: data.payment_updates ?? true,
      };
    } catch {
      return defaultPrefs;
    }
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPrefs(
    prefs: Partial<NotificationPrefs>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      const { error } = await (supabase.from('notification_prefs') as any).upsert(
        {
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Update user coordination details (phone, UPI, etc.)
   */
  async updateCoordinationDetails(params: {
    phone?: string;
    upiId?: string;
  }): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      if (params.upiId !== undefined) {
        await (supabase.from('profiles') as any)
          .update({ upi_id: params.upiId.trim() || null })
          .eq('id', user.id);
      }

      if (params.phone !== undefined) {
        await (supabase.from('profile_private') as any).upsert(
          {
            id: user.id,
            phone: params.phone.trim() || null,
          },
          { onConflict: 'id' }
        );
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Delete account permanently
   */
  async deleteAccount(): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return { success: false, error: new Error('User not authenticated') };

      // Anonymize public profile
      await (supabase.from('profiles') as any)
        .update({
          full_name: 'Deleted User',
          avatar_url: null,
          upi_id: null,
        })
        .eq('id', user.id);

      // Delete private info and tokens
      await (supabase.from('profile_private') as any).delete().eq('id', user.id);
      await (supabase.from('device_tokens') as any).delete().eq('user_id', user.id);

      // Sign out
      await supabase.auth.signOut();
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },
};
