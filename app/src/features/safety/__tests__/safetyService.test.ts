import { safetyService } from '../safetyService';
import { supabase } from '../../../lib/supabase';

describe('safetyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitRating', () => {
    it('inserts rating into ratings table with clamped score', async () => {
      (supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-rater' } },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: insertMock,
      });

      const res = await safetyService.submitRating({
        poolId: 'pool-1',
        toUserId: 'user-rated',
        score: 5,
        tags: ['Punctual', 'Polite'],
      });

      expect(supabase.from).toHaveBeenCalledWith('ratings');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 5,
          from_user_id: 'user-rater',
          to_user_id: 'user-rated',
          pool_id: 'pool-1',
        })
      );
      expect(res.success).toBe(true);
    });
  });

  describe('reportUser', () => {
    it('inserts report with reason and details', async () => {
      (supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'reporter-1' } },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: insertMock,
      });

      const res = await safetyService.reportUser({
        reportedUserId: 'bad-user',
        poolId: 'pool-1',
        reason: 'No-show / Ghosted ride',
        details: 'Waited 20 minutes',
      });

      expect(supabase.from).toHaveBeenCalledWith('reports');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          reporter_id: 'reporter-1',
          reported_user_id: 'bad-user',
          reason: 'No-show / Ghosted ride',
        })
      );
      expect(res.success).toBe(true);
    });
  });

  describe('blockUser & unblockUser', () => {
    it('inserts into blocks table on blockUser', async () => {
      (supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: insertMock,
      });

      const res = await safetyService.blockUser('blocked-user');
      expect(supabase.from).toHaveBeenCalledWith('blocks');
      expect(res.success).toBe(true);
    });

    it('deletes from blocks table on unblockUser', async () => {
      (supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const eqSecondMock = jest.fn().mockResolvedValueOnce({ error: null });
      const eqFirstMock = jest.fn().mockReturnValue({ eq: eqSecondMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqFirstMock });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: deleteMock,
      });

      const res = await safetyService.unblockUser('blocked-user');
      expect(supabase.from).toHaveBeenCalledWith('blocks');
      expect(res.success).toBe(true);
    });
  });

  describe('updateCoordinationDetails', () => {
    it('updates upi_id in profiles and phone in profile_private', async () => {
      (supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });
      const privateUpsertMock = jest.fn().mockResolvedValueOnce({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ update: profileUpdateMock })
        .mockReturnValueOnce({ upsert: privateUpsertMock });

      const res = await safetyService.updateCoordinationDetails({
        upiId: 'test@upi',
        phone: '+919999988888',
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('profile_private');
      expect(res.success).toBe(true);
    });
  });
});
