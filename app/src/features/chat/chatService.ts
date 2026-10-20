import { supabase } from '../../lib/supabase';

export interface ChatMessage {
  id: string;
  poolId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl?: string | null;
  body: string;
  kind: 'user' | 'system';
  createdAt: string;
  isPending?: boolean;
  failed?: boolean;
}

export const chatService = {
  /**
   * Fetch historical messages for a given pool
   */
  async fetchMessages(poolId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await (supabase.from('pool_messages') as any)
        .select(`
          id,
          pool_id,
          sender_id,
          body,
          kind,
          created_at,
          sender:profiles!pool_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        poolId: row.pool_id,
        senderId: row.sender_id,
        senderName: row.sender?.full_name || (row.kind === 'system' ? 'System' : 'Unknown'),
        senderAvatarUrl: row.sender?.avatar_url || null,
        body: row.body,
        kind: row.kind as 'user' | 'system',
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Send a new message to the pool
   */
  async sendMessage(
    poolId: string,
    body: string,
    senderId?: string
  ): Promise<{ success: boolean; message?: ChatMessage; error?: any }> {
    const trimmed = body.trim();
    if (!trimmed) {
      return { success: false, error: new Error('Message cannot be empty') };
    }

    try {
      const payload: { pool_id: string; body: string; kind: 'user'; sender_id?: string } = {
        pool_id: poolId,
        body: trimmed,
        kind: 'user',
      };
      if (senderId) {
        payload.sender_id = senderId;
      }

      const { data, error } = await (supabase.from('pool_messages') as any)
        .insert(payload)
        .select(`
          id,
          pool_id,
          sender_id,
          body,
          kind,
          created_at
        `)
        .single();

      if (error || !data) {
        return { success: false, error };
      }

      return {
        success: true,
        message: {
          id: data.id,
          poolId: data.pool_id,
          senderId: data.sender_id,
          senderName: 'You',
          body: data.body,
          kind: data.kind,
          createdAt: data.created_at,
        },
      };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Subscribe to Realtime pool messages
   */
  subscribeToMessages(
    poolId: string,
    onNewMessage: (msg: ChatMessage) => void
  ): () => void {
    const channelName = `pool-messages:${poolId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pool_messages',
          filter: `pool_id=eq.${poolId}`,
        },
        async (payload: any) => {
          const row = payload.new;
          if (!row) return;

          let senderName: string = row.kind === 'system' ? 'System' : 'Member';
          let senderAvatarUrl: string | null = null;

          if (row.sender_id) {
            try {
              const { data: profile } = await (supabase.from('profiles') as any)
                .select('full_name, avatar_url')
                .eq('id', row.sender_id)
                .single();

              if (profile) {
                senderName = profile.full_name;
                senderAvatarUrl = profile.avatar_url;
              }
            } catch {
              // Non-blocking fallback
            }
          }

          onNewMessage({
            id: row.id,
            poolId: row.pool_id,
            senderId: row.sender_id,
            senderName,
            senderAvatarUrl,
            body: row.body,
            kind: row.kind,
            createdAt: row.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
