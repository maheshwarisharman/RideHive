import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Clock, Plus } from 'lucide-react-native';
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
import { formatPaise } from '../../src/lib/formatters';

type RideTab = 'upcoming' | 'hosting' | 'past';

export default function RidesScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<RideTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const tabs: { value: RideTab; label: string; badge?: number }[] = [
    { value: 'upcoming', label: 'Upcoming', badge: 0 },
    { value: 'hosting', label: 'Hosting', badge: 0 },
    { value: 'past', label: 'Past' },
  ];

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
            <Text style={[styles.ledgerValue, styles.oweText]}>{formatPaise(0)}</Text>
          </View>
          <View style={styles.ledgerDivider} />
          <View style={styles.ledgerColumn}>
            <Text style={styles.ledgerLabel}>Owed to you</Text>
            <Text style={[styles.ledgerValue, styles.owedText]}>{formatPaise(0)}</Text>
          </View>
        </Card>
      </View>

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
        {/* Empty state for initial prototype */}
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
          actionTitle="Create a pool"
          onAction={() => router.push('/modals/create-pool')}
        />
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
  segmentContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
});
