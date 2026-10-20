import { chatService } from '../chatService';
import { supabase } from '../../../lib/supabase';

describe('chatService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMessages', () => {
    it('fetches messages ordered by created_at and maps sender profiles', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          pool_id: 'pool-1',
          sender_id: 'user-1',
          body: 'Hey everyone, I will wait at Campus Gate 1',
          kind: 'user',
          created_at: '2026-10-21T10:00:00Z',
          sender: { full_name: 'Aarav Sharma', avatar_url: null },
        },
        {
          id: 'msg-2',
          pool_id: 'pool-1',
          sender_id: null,
          body: 'Pool is now booked: Uber Premier (HR26 DK 1234)',
          kind: 'system',
          created_at: '2026-10-21T10:05:00Z',
          sender: null,
        },
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockResolvedValueOnce({ data: mockRows, error: null });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const messages = await chatService.fetchMessages('pool-1');

      expect(supabase.from).toHaveBeenCalledWith('pool_messages');
      expect(messages).toHaveLength(2);
      expect(messages[0].senderName).toBe('Aarav Sharma');
      expect(messages[0].kind).toBe('user');
      expect(messages[1].senderName).toBe('System');
      expect(messages[1].kind).toBe('system');
    });

    it('returns empty array when error occurs', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB error' } }),
      });

      const messages = await chatService.fetchMessages('pool-1');
      expect(messages).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('rejects empty or whitespace-only messages', async () => {
      const res = await chatService.sendMessage('pool-1', '   ');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('inserts user message and returns optimistic shape', async () => {
      const mockCreated = {
        id: 'msg-new',
        pool_id: 'pool-1',
        sender_id: 'user-1',
        body: 'Leaving hostel now',
        kind: 'user',
        created_at: '2026-10-21T10:10:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockCreated, error: null }),
      });

      const res = await chatService.sendMessage('pool-1', 'Leaving hostel now', 'user-1');

      expect(res.success).toBe(true);
      expect(res.message?.body).toBe('Leaving hostel now');
      expect(res.message?.senderName).toBe('You');
    });

    it('handles database insert errors', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Forbidden' } }),
      });

      const res = await chatService.sendMessage('pool-1', 'Hello', 'user-1');
      expect(res.success).toBe(false);
    });
  });

  describe('subscribeToMessages', () => {
    it('creates channel and returns cleanup function', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };
      (supabase.channel as jest.Mock).mockReturnValueOnce(mockChannel);

      const callback = jest.fn();
      const unsubscribe = chatService.subscribeToMessages('pool-1', callback);

      expect(supabase.channel).toHaveBeenCalledWith('pool-messages:pool-1');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();

      unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });
});
