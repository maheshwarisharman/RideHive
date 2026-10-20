import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, MapPin, ArrowRight, Clock, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Card,
  Button,
  StatusBadge,
  SeatIndicator,
  ListRow,
  Avatar,
  Skeleton,
} from '../../src/components/ui';
import { searchService } from '../../src/features/search/searchService';
import { useAuthStore } from '../../src/features/auth/authStore';
import { formatPaise, formatRideTime } from '../../src/lib/formatters';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const [nextRide, setNextRide] = useState<any | null>(null);
  const [leavingSoon, setLeavingSoon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (user?.id) {
      const ride = await searchService.fetchNextRide(user.id);
      setNextRide(ride);
    }
    const soonPools = await searchService.fetchLeavingSoonPools(4);
    setLeavingSoon(soonPools);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greetingName = profile?.fullName ? profile.fullName.split(' ')[0] : 'there';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey, {greetingName}</Text>
          <Text style={styles.subGreeting}>Where are you headed from BMU today?</Text>
        </View>

        {/* Large "Where to?" Search Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modals/search')}
          style={styles.searchBar}
          accessibilityRole="button"
          accessibilityLabel="Where to? Search rides"
        >
          <Search size={20} color={colors.textPrimary} style={styles.searchIcon} />
          <Text style={styles.searchText}>Where to?</Text>
        </TouchableOpacity>

        {/* 1. YOUR NEXT RIDE (if any) */}
        {nextRide && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your next ride</Text>
            <Card
              variant="elevated"
              style={styles.nextRideCard}
              onPress={() => router.push({ pathname: '/pool/[id]', params: { id: nextRide.id } })}
            >
              <View style={styles.nextRideHeader}>
                <StatusBadge status={nextRide.status} />
                <Text style={styles.nextRideRole}>
                  {nextRide.myRole === 'host' ? 'Hosting' : 'Rider'}
                </Text>
              </View>

              <Text style={styles.nextRideDest} numberOfLines={1}>
                {nextRide.destination_name}
              </Text>
              <Text style={styles.nextRideTime}>
                Leaves {formatRideTime(nextRide.departs_at)}
              </Text>

              <View style={styles.nextRideFooter}>
                <SeatIndicator totalSeats={nextRide.total_seats} seatsTaken={nextRide.seats_taken} />
                <Text style={styles.viewRideLink}>View ride details →</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Create a pool CTA */}
        <Card style={styles.createCard} variant="flat">
          <View style={styles.createRow}>
            <View style={styles.createTextContainer}>
              <Text style={styles.createTitle}>Driving or booking a cab?</Text>
              <Text style={styles.createSubtitle}>Create a pool and split fare with co-riders.</Text>
            </View>
            <Button
              title="Create"
              size="sm"
              icon={<Plus size={16} color={colors.white} />}
              onPress={() => router.push('/modals/create-pool')}
            />
          </View>
        </Card>

        {/* 2. LEAVING SOON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaving soon</Text>
          {loading ? (
            <Card variant="flat" style={styles.leavingSoonSkeleton}>
              <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={12} />
            </Card>
          ) : leavingSoon.length > 0 ? (
            <View>
              {leavingSoon.map((p) => (
                <Card
                  key={p.id}
                  variant="outlined"
                  style={styles.soonCard}
                  onPress={() => router.push({ pathname: '/pool/[id]', params: { id: p.id } })}
                >
                  <View style={styles.soonHeader}>
                    <Text style={styles.soonDest} numberOfLines={1}>
                      {p.destination_name}
                    </Text>
                    <StatusBadge
                      status={p.join_mode === 'instant' ? 'open' : 'pending'}
                      label={p.join_mode === 'instant' ? 'Instant' : 'Approval'}
                    />
                  </View>
                  <Text style={styles.soonTime}>
                    Leaves {formatRideTime(p.departs_at)}
                  </Text>
                  <View style={styles.soonFooter}>
                    <SeatIndicator totalSeats={p.total_seats} seatsTaken={p.seats_taken} />
                    <Text style={styles.soonFare}>
                      ~{formatPaise(Math.round(p.estimated_fare_min / p.total_seats))} / person
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card variant="flat" style={styles.noPoolsCard}>
              <Text style={styles.noPoolsText}>No pools departing in the next few hours.</Text>
            </Card>
          )}
        </View>

        {/* 3. POPULAR DESTINATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular destinations</Text>
          <Card style={styles.listCard} variant="outlined">
            <ListRow
              title="IGI Airport Terminal 3"
              subtitle="International & Domestic Hub"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() =>
                router.push({
                  pathname: '/modals/search',
                  params: {
                    destName: 'IGI Airport Terminal 3 (T3)',
                    destLat: '28.55616',
                    destLng: '77.08638',
                  },
                })
              }
            />
            <ListRow
              title="Millennium City Centre Metro"
              subtitle="Yellow Line · Gurugram (HUDA)"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() =>
                router.push({
                  pathname: '/modals/search',
                  params: {
                    destName: 'Millennium City Centre Gurugram Metro',
                    destLat: '28.45927',
                    destLng: '77.07268',
                  },
                })
              }
            />
            <ListRow
              title="New Delhi Railway Station (NDLS)"
              subtitle="Paharganj / Ajmeri Gate"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() =>
                router.push({
                  pathname: '/modals/search',
                  params: {
                    destName: 'New Delhi Railway Station (NDLS)',
                    destLat: '28.64290',
                    destLng: '77.21950',
                  },
                })
              }
            />
            <ListRow
              title="DLF Cyber Hub"
              subtitle="Cyber City, Gurugram"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() =>
                router.push({
                  pathname: '/modals/search',
                  params: {
                    destName: 'DLF Cyber Hub / Cyber City',
                    destLat: '28.49500',
                    destLng: '77.08900',
                  },
                })
              }
            />
          </Card>
        </View>

        {/* Link to hidden dev showcase */}
        <TouchableOpacity
          style={styles.devLink}
          onPress={() => router.push('/dev-showcase')}
        >
          <Text style={styles.devLinkText}>View Design System Showcase →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    minHeight: 52,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchText: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  createCard: {
    marginBottom: spacing.xl,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  createTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  createSubtitle: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  nextRideCard: {
    padding: spacing.md,
  },
  nextRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nextRideRole: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nextRideDest: {
    ...typography.title,
    color: colors.textPrimary,
  },
  nextRideTime: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nextRideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  viewRideLink: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
  soonCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  soonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soonDest: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  soonTime: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  soonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  soonFare: {
    ...typography.bodyMedium,
    ...typography.tabular,
    color: colors.success,
    fontWeight: '600',
  },
  leavingSoonSkeleton: {
    padding: spacing.md,
  },
  noPoolsCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  noPoolsText: {
    ...typography.captionRegular,
    color: colors.textSecondary,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  devLink: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  devLinkText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
});
