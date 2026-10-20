import { notificationsService } from '../notificationsService';
import { supabase } from '../../../lib/supabase';

describe('notificationsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('fetches notifications ordered by created_at DESC', async () => {
      const mockNotifs = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          type: 'ride_completed',
          payload: { pool_id: 'pool-1', amount_paise: 16250 },
          read_at: null,
          created_at: '2026-10-21T11:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: mockNotifs, error: null }),
      });

      const res = await notificationsService.fetchNotifications('user-1');
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(res).toHaveLength(1);
      expect(res[0].type).toBe('ride_completed');
      expect(res[0].payload.amount_paise).toBe(16250);
    });

    it('returns empty array on error', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } }),
      });

      const res = await notificationsService.fetchNotifications('user-1');
      expect(res).toEqual([]);
    });
  });

  describe('markNotificationRead', () => {
    it('updates read_at timestamp for single notification', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const success = await notificationsService.markNotificationRead('notif-1');
      expect(success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('markAllNotificationsRead', () => {
    it('updates all unread notifications for user', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const success = await notificationsService.markAllNotificationsRead('user-1');
      expect(success).toBe(true);
    });
  });

  describe('ride alerts', () => {
    it('fetches active ride alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          destination_name: 'IGI Airport T3',
          earliest_departure: '2026-10-21T08:00:00Z',
          latest_departure: '2026-10-21T12:00:00Z',
          active: true,
          created_at: '2026-10-20T10:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: mockAlerts, error: null }),
      });

      const res = await notificationsService.fetchActiveRideAlerts('user-1');
      expect(res).toHaveLength(1);
      expect(res[0].destinationName).toBe('IGI Airport T3');
    });

    it('toggles ride alert status', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const success = await notificationsService.toggleRideAlert('alert-1', false);
      expect(success).toBe(true);
    });

    it('deletes ride alert', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const success = await notificationsService.deleteRideAlert('alert-1');
      expect(success).toBe(true);
    });
  });
});
