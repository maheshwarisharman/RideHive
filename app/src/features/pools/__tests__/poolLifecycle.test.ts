import { poolLifecycleService } from '../poolLifecycleService';
import { supabase } from '../../../lib/supabase';

describe('poolLifecycleService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('joinPool', () => {
    it('calls join_pool RPC and handles success', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true, status: 'confirmed', message: 'Joined successfully' },
        error: null,
      });

      const res = await poolLifecycleService.joinPool('pool-123');
      expect(supabase.rpc).toHaveBeenCalledWith('join_pool', { p_pool_id: 'pool-123' });
      expect(res.success).toBe(true);
      expect(res.status).toBe('confirmed');
    });

    it('returns error message if RPC fails', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Pool is already full' },
      });

      const res = await poolLifecycleService.joinPool('pool-123');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Pool is already full');
    });
  });

  describe('leavePool', () => {
    it('calls leave_pool RPC and returns success', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: 'Left pool successfully' },
        error: null,
      });

      const res = await poolLifecycleService.leavePool('pool-123');
      expect(supabase.rpc).toHaveBeenCalledWith('leave_pool', { p_pool_id: 'pool-123' });
      expect(res.success).toBe(true);
    });
  });

  describe('approveMember', () => {
    it('calls approve_member RPC with memberId', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await poolLifecycleService.approveMember('pool-123', 'user-456');
      expect(supabase.rpc).toHaveBeenCalledWith('approve_member', {
        p_pool_id: 'pool-123',
        p_target_user_id: 'user-456',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('closePool', () => {
    it('calls close_pool RPC', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await poolLifecycleService.closePool('pool-123');
      expect(supabase.rpc).toHaveBeenCalledWith('close_pool', { p_pool_id: 'pool-123' });
      expect(res.success).toBe(true);
    });
  });

  describe('markBooked', () => {
    it('calls mark_booked RPC with provider and vehicle details', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await poolLifecycleService.markBooked(
        'pool-123',
        'Uber',
        'HR26 DK 1234',
        'White Dzire'
      );

      expect(supabase.rpc).toHaveBeenCalledWith('mark_booked', {
        p_pool_id: 'pool-123',
        p_provider: 'Uber',
        p_vehicle_number: 'HR26 DK 1234',
        p_note: 'White Dzire',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('cancelPool', () => {
    it('calls cancel_pool RPC', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await poolLifecycleService.cancelPool('pool-123');
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_pool', {
        p_pool_id: 'pool-123',
      });
      expect(res.success).toBe(true);
    });
  });
});
