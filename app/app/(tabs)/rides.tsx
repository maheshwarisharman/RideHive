import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Clock, ChevronRight, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  SegmentedControl,
  Card,
  StatusBadge,
  SeatIndicator,
  EmptyState,
  Button,
} from '../../src/components/ui';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { formatPaise, formatRideTime } from '../../src/lib/formatters';
import { useAuthStore } from '../../src/features/auth/authStore';
import {
  settlementService,
  UserLedgerSummary,
  SettlementItem,
} from '../../src/features/settlements/settlementService';
import { supabase } from '../../src/lib/supabase';

type RideTab = 'upcoming' | 'hosting' | 'past';

interface RideSummary {
  id: string;
  destinationName: string;
  originName: string;
  departsAt: string;
  status: 'open' | 'closed' | 'booked' | 'completed' | 'cancelled';
  seatsTaken: number;
  totalSeats: number;
  estimatedFareMin: number;
  estimatedFareMax: number;
  finalFare?: number | null;
  role: 'host' | 'member';
}

export default function RidesScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [selectedTab, setSelectedTab] = useState<RideTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [ledger, setLedger] = useState<UserLedgerSummary>({
    youOwePaise: 0,
    owedToYouPaise: 0,
    pendingToPay: [],
    pendingToReceive: [],
  });

  const [upcomingRides, setUpcomingRides] = useState<RideSummary[]>([]);
  const [hostingRides, setHostingRides] = useState<RideSummary[]>([]);
  const [pastRides, setPastRides] = useState<RideSummary[]>([]);

  const loadAllRides = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Fetch user ledger
      const ledgerData = await settlementService.fetchUserLedger(user.id);
      setLedger(ledgerData);

      // 2. Fetch hosting rides
      const { data: hostData } = await (supabase.from('pools') as any)
        .select(`
          id,
          origin_name,
          destination_name,
          departs_at,
          status,
          seats_taken,
          total_seats,
          estimated_fare_min,
          estimated_fare_max,
          final_fare
        `)
        .eq('host_id', user.id)
        .in('status', ['open', 'closed', 'booked'])
        .order('departs_at', { ascending: true });

      const mappedHost: RideSummary[] = (hostData || []).map((p: any) => ({
        id: p.id,
        originName: p.origin_name,
        destinationName: p.destination_name,
        departsAt: p.departs_at,
        status: p.status,
        seatsTaken: p.seats_taken,
        totalSeats: p.total_seats,
        estimatedFareMin: p.estimated_fare_min,
        estimatedFareMax: p.estimated_fare_max,
        finalFare: p.final_fare,
        role: 'host',
      }));
      setHostingRides(mappedHost);

      // 3. Fetch upcoming rider pools
      const { data: memberData } = await (supabase.from('pool_members') as any)
        .select(`
          pool:pools!pool_members_pool_id_fkey(
            id,
            origin_name,
            destination_name,
            departs_at,
            status,
            seats_taken,
            total_seats,
            estimated_fare_min,
            estimated_fare_max,
            final_fare,
            host_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      const activeMemberPools: RideSummary[] = [];
      const pastPools: RideSummary[] = [];

      (memberData || []).forEach((row: any) => {
        const p = row.pool;
        if (!p) return;

        const isHost = p.host_id === user.id;
        const item: RideSummary = {
          id: p.id,
          originName: p.origin_name,
          destinationName: p.destination_name,
          departsAt: p.departs_at,
          status: p.status,
          seatsTaken: p.seats_taken,
          totalSeats: p.total_seats,
          estimatedFareMin: p.estimated_fare_min,
          estimatedFareMax: p.estimated_fare_max,
          finalFare: p.final_fare,
          role: isHost ? 'host' : 'member',
        };

        if (p.status === 'completed' || p.status === 'cancelled') {
          pastPools.push(item);
        } else if (!isHost) {
          activeMemberPools.push(item);
        }
      });

      // Sort upcoming by departs_at
      activeMemberPools.sort(
        (a, b) => new Date(a.departsAt).getTime() - new Date(b.departsAt).getTime()
      );
      setUpcomingRides(activeMemberPools);

      // Sort past by departs_at descending
      pastPools.sort(
        (a, b) => new Date(b.departsAt).getTime() - new Date(a.departsAt).getTime()
      );
      setPastRides(pastPools);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAllRides();
  }, [loadAllRides]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllRides();
  };

  const tabs: { value: RideTab; label: string; badge?: number }[] = [
    { value: 'upcoming', label: 'Upcoming', badge: upcomingRides.length },
    { value: 'hosting', label: 'Hosting', badge: hostingRides.length },
    { value: 'past', label: 'Past' },
  ];

  const currentList =
    selectedTab === 'upcoming'
      ? upcomingRides
      : selectedTab === 'hosting'
      ? hostingRides
      : pastRides;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your rides</Text>
      </View>

      {/* Ledger overview card */}
      <View style={styles.ledgerContainer}>
        <Card style={styles.ledgerCard} variant="flat">
          <View style={styles.ledgerColumn}>
            <Text style={styles.ledgerLabel}>You owe</Text>
            <Text style={[styles.ledgerValue, styles.oweText]}>
              {formatPaise(ledger.youOwePaise)}
            </Text>
          </View>
          <View style={styles.ledgerDivider} />
          <View style={styles.ledgerColumn}>
            <Text style={styles.ledgerLabel}>Owed to you</Text>
            <Text style={[styles.ledgerValue, styles.owedText]}>
              {formatPaise(ledger.owedToYouPaise)}
            </Text>
          </View>
        </Card>
      </View>

      {/* Pending settlement action card if user owes money */}
      {ledger.pendingToPay.length > 0 && (
        <View style={styles.dueAlertContainer}>
          <TouchableOpacity
            style={styles.dueAlertCard}
            onPress={() => {
              const firstPoolId = ledger.pendingToPay[0].poolId;
              router.push({
                pathname: '/pool/[id]/settle',
                params: { id: firstPoolId },
              });
            }}
          >
            <View style={styles.dueAlertContent}>
              <Text style={styles.dueAlertTitle}>Settlement Payment Due</Text>
              <Text style={styles.dueAlertSubtitle}>
                You have {ledger.pendingToPay.length} unpaid cab share(s). Tap to settle via UPI.
              </Text>
            </View>
            <ArrowUpRight size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab filter */}
      <View style={styles.segmentContainer}>
        <SegmentedControl
          options={tabs}
          value={selectedTab}
          onChange={(tab) => setSelectedTab(tab)}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {currentList.length > 0 ? (
          currentList.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              activeOpacity={0.85}
              onPress={() => {
                if (ride.status === 'completed') {
                  router.push({
                    pathname: '/pool/[id]/settle',
                    params: { id: ride.id },
                  });
                } else {
                  router.push({
                    pathname: '/pool/[id]',
                    params: { id: ride.id },
                  });
                }
              }}
            >
              <Card style={styles.rideCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.destinationTitle}>{ride.destinationName}</Text>
                    <View style={styles.timeRow}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.timeText}>{formatRideTime(ride.departsAt)}</Text>
                    </View>
                  </View>
                  <StatusBadge status={ride.status} />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <SeatIndicator
                    totalSeats={ride.totalSeats}
                    seatsTaken={ride.seatsTaken}
                  />
                  <Text style={styles.fareText}>
                    {ride.finalFare
                      ? `${formatPaise(Math.round(ride.finalFare / ride.seatsTaken))} / rider`
                      : `~${formatPaise(Math.round(ride.estimatedFareMin / ride.totalSeats))} / rider`}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon={<Car size={40} color={colors.textDisabled} />}
            title={
              selectedTab === 'upcoming'
                ? 'No upcoming rides'
                : selectedTab === 'hosting'
                ? 'No hosted pools'
                : 'No past rides'
            }
            description={
              selectedTab === 'upcoming'
                ? 'Search for pools to transit hubs or create your own.'
                : selectedTab === 'hosting'
                ? 'When you host a cab pool, it will appear here.'
                : 'Your completed rides and split history will be listed here.'
            }
            actionTitle={selectedTab !== 'past' ? 'Create a pool' : undefined}
            onAction={
              selectedTab !== 'past'
                ? () => router.push('/modals/create-pool')
                : undefined
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  ledgerContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  ledgerCard: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  ledgerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  ledgerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  ledgerValue: {
    ...typography.heading,
    ...typography.tabular,
  },
  oweText: {
    color: colors.textPrimary,
  },
  owedText: {
    color: colors.success,
  },
  dueAlertContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dueAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  dueAlertContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dueAlertTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dueAlertSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  segmentContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  rideCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  destinationTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
