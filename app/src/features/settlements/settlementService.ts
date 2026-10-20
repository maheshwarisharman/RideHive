import { supabase } from '../../lib/supabase';

export interface SettlementItem {
  id: string;
  poolId: string;
  payerId: string;
  payerName: string;
  payerAvatarUrl?: string | null;
  amountPaise: number;
  status: 'pending' | 'marked_paid' | 'confirmed';
  markedPaidAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  destinationName?: string;
  hostId?: string;
  hostName?: string;
  hostUpiId?: string | null;
}

export interface UserLedgerSummary {
  youOwePaise: number;
  owedToYouPaise: number;
  pendingToPay: SettlementItem[];
  pendingToReceive: SettlementItem[];
}

export const settlementService = {
  /**
   * Complete pool and trigger backend remainder-paise fare distribution
   */
  async completePool(
    poolId: string,
    finalFarePaise: number
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data, error } = await (supabase.rpc as any)('complete_pool', {
        p_pool_id: poolId,
        p_final_fare_paise: finalFarePaise,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Fetch all settlements for a specific pool
   */
  async fetchPoolSettlements(poolId: string): Promise<SettlementItem[]> {
    try {
      const { data, error } = await (supabase.from('settlements') as any)
        .select(`
          id,
          pool_id,
          payer_id,
          amount_paise,
          status,
          marked_paid_at,
          confirmed_at,
          created_at,
          payer:profiles!settlements_payer_id_fkey(full_name, avatar_url),
          pool:pools!settlements_pool_id_fkey(
            destination_name,
            host_id,
            host:profiles!pools_host_id_fkey(full_name)
          )
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        poolId: row.pool_id,
        payerId: row.payer_id,
        payerName: row.payer?.full_name || 'Member',
        payerAvatarUrl: row.payer?.avatar_url || null,
        amountPaise: row.amount_paise,
        status: row.status,
        markedPaidAt: row.marked_paid_at,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        destinationName: row.pool?.destination_name,
        hostId: row.pool?.host_id,
        hostName: row.pool?.host?.full_name,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Payer marks settlement as paid via UPI
   */
  async markSettlementPaid(poolId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await (supabase.rpc as any)('mark_settlement_paid', {
        p_pool_id: poolId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Host confirms receipt of settlement payment
   */
  async confirmSettlement(
    poolId: string,
    payerId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await (supabase.rpc as any)('confirm_settlement', {
        p_pool_id: poolId,
        p_payer_id: payerId,
      });

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Fetch aggregate ledger for active user:
   * 1. You owe (where user is payer and status != confirmed)
   * 2. Owed to you (where user is pool host and status != confirmed)
   */
  async fetchUserLedger(userId: string): Promise<UserLedgerSummary> {
    try {
      // 1. Where user is payer
      const { data: payRows } = await (supabase.from('settlements') as any)
        .select(`
          id,
          pool_id,
          payer_id,
          amount_paise,
          status,
          marked_paid_at,
          confirmed_at,
          created_at,
          pool:pools!settlements_pool_id_fkey(
            destination_name,
            host_id,
            host:profiles!pools_host_id_fkey(full_name)
          )
        `)
        .eq('payer_id', userId)
        .in('status', ['pending', 'marked_paid']);

      // 2. Where user is host
      const { data: hostPools } = await (supabase.from('pools') as any)
        .select('id')
        .eq('host_id', userId);

      let receiveRows: any[] = [];
      if (hostPools && hostPools.length > 0) {
        const poolIds = hostPools.map((p: any) => p.id);
        const { data: recData } = await (supabase.from('settlements') as any)
          .select(`
            id,
            pool_id,
            payer_id,
            amount_paise,
            status,
            marked_paid_at,
            confirmed_at,
            created_at,
            payer:profiles!settlements_payer_id_fkey(full_name, avatar_url),
            pool:pools!settlements_pool_id_fkey(
              destination_name,
              host_id
            )
          `)
          .in('pool_id', poolIds)
          .in('status', ['pending', 'marked_paid']);

        if (recData) receiveRows = recData;
      }

      const pendingToPay: SettlementItem[] = (payRows || []).map((row: any) => ({
        id: row.id,
        poolId: row.pool_id,
        payerId: row.payer_id,
        payerName: 'You',
        amountPaise: row.amount_paise,
        status: row.status,
        markedPaidAt: row.marked_paid_at,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        destinationName: row.pool?.destination_name,
        hostId: row.pool?.host_id,
        hostName: row.pool?.host?.full_name,
      }));

      const pendingToReceive: SettlementItem[] = receiveRows.map((row: any) => ({
        id: row.id,
        poolId: row.pool_id,
        payerId: row.payer_id,
        payerName: row.payer?.full_name || 'Member',
        payerAvatarUrl: row.payer?.avatar_url || null,
        amountPaise: row.amount_paise,
        status: row.status,
        markedPaidAt: row.marked_paid_at,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        destinationName: row.pool?.destination_name,
        hostId: row.pool?.host_id,
      }));

      const youOwePaise = pendingToPay.reduce((acc, curr) => acc + curr.amountPaise, 0);
      const owedToYouPaise = pendingToReceive.reduce((acc, curr) => acc + curr.amountPaise, 0);

      return {
        youOwePaise,
        owedToYouPaise,
        pendingToPay,
        pendingToReceive,
      };
    } catch {
      return {
        youOwePaise: 0,
        owedToYouPaise: 0,
        pendingToPay: [],
        pendingToReceive: [],
      };
    }
  },

  /**
   * Generates a standard NPCI upi://pay deep link
   */
  generateUpiUrl(params: {
    upiId: string;
    payeeName: string;
    amountPaise: number;
    transactionNote?: string;
  }): string {
    const rupees = (params.amountPaise / 100).toFixed(2);
    const encodedName = encodeURIComponent(params.payeeName.trim());
    const encodedNote = encodeURIComponent(
      (params.transactionNote || 'RideHive Cab Settlement').trim()
    );

    return `upi://pay?pa=${params.upiId.trim()}&pn=${encodedName}&am=${rupees}&cu=INR&tn=${encodedNote}`;
  },
};
