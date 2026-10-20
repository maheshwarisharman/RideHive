import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import {
  ScreenHeader,
  Card,
  Button,
  Chip,
  SeatIndicator,
  StatusBadge,
  Avatar,
  EmptyState,
  Toast,
  Stepper,
  DateTimePickerModal,
} from '../../src/components/ui';
import { LocationPicker } from '../../src/features/maps/LocationPicker';
import { LocationItem } from '../../src/features/maps/mapsService';
import { searchService, PoolSearchResult } from '../../src/features/search/searchService';
import { useAuthStore } from '../../src/features/auth/authStore';
import { config } from '../../src/lib/config';
import { formatPaise, formatRideTime } from '../../src/lib/formatters';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function SearchModal() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ destName?: string; destLat?: string; destLng?: string }>();
  const user = useAuthStore((state) => state.user);

  const [origin] = useState<LocationItem>({
    name: config.campus.name,
    latitude: config.campus.latitude,
    longitude: config.campus.longitude,
  });

  const [destination, setDestination] = useState<LocationItem | null>(() => {
    if (searchParams.destName && searchParams.destLat && searchParams.destLng) {
      return {
        name: searchParams.destName,
        latitude: parseFloat(searchParams.destLat),
        longitude: parseFloat(searchParams.destLng),
      };
    }
    return null;
  });

  const [departsAt, setDepartsAt] = useState<Date>(new Date());
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [results, setResults] = useState<PoolSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  const executeSearch = async () => {
    if (!destination) {
      setToastMessage('Please select a destination.');
      setToastType('error');
      return;
    }

    setLoading(true);
    setSearched(true);
    setToastMessage(null);

    const windowStart = new Date(departsAt.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(departsAt.getTime() + 60 * 60 * 1000);

    const pools = await searchService.searchPools({
      originLat: origin.latitude,
      originLng: origin.longitude,
      destLat: destination.latitude,
      destLng: destination.longitude,
      windowStart,
      windowEnd,
      seatsNeeded,
      userId: user?.id,
    });

    setResults(pools);
    setLoading(false);
  };

  const handleCreateAlert = async () => {
    if (!user || !destination) {
      setToastMessage('Please sign in to save a ride alert.');
      setToastType('error');
      return;
    }

    const windowStart = new Date(departsAt.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(departsAt.getTime() + 60 * 60 * 1000);

    const { success, error } = await searchService.createRideAlert(
      user.id,
      origin.name,
      origin.latitude,
      origin.longitude,
      destination.name,
      destination.latitude,
      destination.longitude,
      windowStart,
      windowEnd,
      seatsNeeded
    );

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastMessage(`Alert saved! We will notify you when a pool forms to ${destination.name}.`);
      setToastType('success');
    } else {
      setToastMessage(error?.message || 'Failed to save alert.');
      setToastType('error');
    }
  };

  const renderPoolItem = ({ item }: { item: PoolSearchResult }) => (
    <Card
      variant="outlined"
      style={styles.poolCard}
      onPress={() => router.push({ pathname: '/pool/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.hostRow}>
          <Avatar name={item.host_name} avatarUrl={item.host_avatar_url} size="sm" />
          <View style={styles.hostDetails}>
            <Text style={styles.hostName}>{item.host_name}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{Number(item.host_rating_avg).toFixed(1)}</Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.join_mode === 'instant' ? 'open' : 'pending'} label={item.join_mode === 'instant' ? 'Instant' : 'Approval'} />
      </View>

      <View style={styles.routeSection}>
        <Text style={styles.destName} numberOfLines={1}>
          {item.destination_name}
        </Text>
        <Text style={styles.departureTime}>
          Leaves {formatRideTime(item.departs_at)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <SeatIndicator totalSeats={item.total_seats} seatsTaken={item.seats_taken} />
        <Text style={styles.fareText}>
          ~{formatPaise(item.estimated_fare_per_person)}
          <Text style={styles.farePerPerson}> / person</Text>
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Find a Pool" showBack />

      <View style={styles.container}>
        {toastMessage && (
          <Toast message={toastMessage} type={toastType} style={styles.toast} />
        )}

        {/* Search Inputs Header */}
        <View style={styles.searchHeader}>
          <LocationPicker
            selectedLocation={destination}
            onSelect={(loc) => {
              setDestination(loc);
              setSearched(false);
            }}
            placeholder="Search destination"
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={() => setTimePickerVisible(true)}
              style={styles.timePickerButton}
            >
              <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.timePickerText}>{formatRideTime(departsAt)}</Text>
            </TouchableOpacity>

            <Button
              title="Search"
              size="sm"
              onPress={executeSearch}
              loading={loading}
              style={styles.searchButton}
            />
          </View>
        </View>

        <DateTimePickerModal
          visible={timePickerVisible}
          value={departsAt}
          onChange={(d) => setDepartsAt(d)}
          onClose={() => setTimePickerVisible(false)}
        />

        {/* Results List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryAction} />
            <Text style={styles.loadingText}>Searching available campus pools...</Text>
          </View>
        ) : searched && results.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyContainer}>
            <EmptyState
              icon={<Search size={40} color={colors.textDisabled} />}
              title="No pools found"
              description={`No open pools found for ${destination?.name || 'this destination'} around your time window.`}
            />

            <View style={styles.emptyActions}>
              <Button
                title="Create a pool for this ride"
                icon={<Plus size={18} color={colors.white} />}
                onPress={() => router.push('/modals/create-pool')}
                style={styles.emptyActionBtn}
              />
              <Button
                title="Alert me when a pool forms"
                variant="secondary"
                icon={<Bell size={18} color={colors.textPrimary} />}
                onPress={handleCreateAlert}
                style={styles.emptyActionBtn}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.listContainer}>
            {searched && (
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'pool' : 'pools'} found
              </Text>
            )}
            <FlashList
              data={results}
              renderItem={renderPoolItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  toast: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  searchHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginRight: spacing.sm,
  },
  timePickerText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  searchButton: {
    minWidth: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  poolCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostDetails: {
    marginLeft: spacing.sm,
  },
  hostName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  ratingText: {
    ...typography.captionRegular,
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  routeSection: {
    marginVertical: spacing.xs,
  },
  destName: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  departureTime: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  fareText: {
    ...typography.heading,
    ...typography.tabular,
    color: colors.success,
  },
  farePerPerson: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  emptyActions: {
    marginTop: spacing.md,
  },
  emptyActionBtn: {
    marginBottom: spacing.md,
  },
});
