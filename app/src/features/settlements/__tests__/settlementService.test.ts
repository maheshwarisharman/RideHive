import { settlementService } from '../settlementService';
import { supabase } from '../../../lib/supabase';

describe('settlementService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUpiUrl', () => {
    it('generates standard NPCI UPI payment URL with 2 decimal rupee amount', () => {
      const url = settlementService.generateUpiUrl({
        upiId: 'host@oksbi',
        payeeName: 'Aarav Sharma',
        amountPaise: 16250, // ₹162.50
        transactionNote: 'Cab share to IGI Airport',
      });

      expect(url).toBe(
        'upi://pay?pa=host@oksbi&pn=Aarav%20Sharma&am=162.50&cu=INR&tn=Cab%20share%20to%20IGI%20Airport'
      );
    });

    it('falls back to default transaction note if not provided', () => {
      const url = settlementService.generateUpiUrl({
        upiId: 'test@upi',
        payeeName: 'Rider',
        amountPaise: 5000,
      });

      expect(url).toContain('tn=RideHive%20Cab%20Settlement');
      expect(url).toContain('am=50.00');
    });
  });

  describe('completePool', () => {
    it('calls complete_pool RPC with final fare in paise', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const res = await settlementService.completePool('pool-1', 65000);

      expect(supabase.rpc).toHaveBeenCalledWith('complete_pool', {
        p_pool_id: 'pool-1',
        p_final_fare_paise: 65000,
      });
      expect(res.success).toBe(true);
    });

    it('handles RPC errors gracefully', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Not authorized' },
      });

      const res = await settlementService.completePool('pool-1', 65000);
      expect(res.success).toBe(false);
      expect(res.error.message).toBe('Not authorized');
    });
  });

  describe('markSettlementPaid', () => {
    it('calls mark_settlement_paid RPC', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const res = await settlementService.markSettlementPaid('pool-1');
      expect(supabase.rpc).toHaveBeenCalledWith('mark_settlement_paid', {
        p_pool_id: 'pool-1',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('confirmSettlement', () => {
    it('calls confirm_settlement RPC with payer id', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const res = await settlementService.confirmSettlement('pool-1', 'user-2');
      expect(supabase.rpc).toHaveBeenCalledWith('confirm_settlement', {
        p_pool_id: 'pool-1',
        p_payer_id: 'user-2',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('fetchPoolSettlements', () => {
    it('fetches and maps settlement rows', async () => {
      const mockRows = [
        {
          id: 'settle-1',
          pool_id: 'pool-1',
          payer_id: 'user-2',
          amount_paise: 16250,
          status: 'pending',
          marked_paid_at: null,
          confirmed_at: null,
          created_at: '2026-10-21T10:00:00Z',
          payer: { full_name: 'Priya Verma', avatar_url: null },
          pool: {
            destination_name: 'IGI Airport T3',
            host_id: 'user-1',
            host: { full_name: 'Host User' },
          },
        },
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: mockRows, error: null }),
      });

      const settlements = await settlementService.fetchPoolSettlements('pool-1');
      expect(settlements).toHaveLength(1);
      expect(settlements[0].payerName).toBe('Priya Verma');
      expect(settlements[0].amountPaise).toBe(16250);
      expect(settlements[0].destinationName).toBe('IGI Airport T3');
    });
  });
});
