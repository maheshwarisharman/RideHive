import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight,
  Info,
  Car,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Button,
  ScreenHeader,
  Card,
  Chip,
  SegmentedControl,
  Stepper,
  TextField,
  Toast,
  DateTimePickerModal,
} from '../../src/components/ui';
import { LocationPicker } from '../../src/features/maps/LocationPicker';
import { RoutePreviewMap } from '../../src/features/maps/RoutePreviewMap';
import { mapsService, LocationItem, RouteResult } from '../../src/features/maps/mapsService';
import { poolService } from '../../src/features/pools/poolService';
import { config } from '../../src/lib/config';
import { formatPaise, formatRideTime, formatDuration, formatDistance } from '../../src/lib/formatters';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function CreatePoolModal() {
  const router = useRouter();

  // Wizard Step (1 to 4)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Route
  const [origin] = useState<LocationItem>({
    name: config.campus.name,
    latitude: config.campus.latitude,
    longitude: config.campus.longitude,
  });
  const [destination, setDestination] = useState<LocationItem | null>(null);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Step 2: When
  const [departsAt, setDepartsAt] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
  const [flexibility, setFlexibility] = useState<number>(15);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Step 3: Seats & Rules
  const [totalSeats, setTotalSeats] = useState<number>(4);
  const [joinMode, setJoinMode] = useState<'instant' | 'approval'>('instant');
  const [note, setNote] = useState<string>('');

  // Step 4: Liquidity matches & publishing
  const [liquidityMatches, setLiquidityMatches] = useState<any[]>([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When destination changes, calculate route
  useEffect(() => {
    if (destination) {
      setRouteLoading(true);
      mapsService
        .calculateRoute(origin.latitude, origin.longitude, destination.latitude, destination.longitude)
        .then((result) => {
          setRouteData(result);
          setRouteLoading(false);
        });
    }
  }, [origin, destination]);

  // When reaching review step, check liquidity matches
  useEffect(() => {
    if (step === 4 && destination) {
      poolService
        .checkLiquidityMatches(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
          departsAt,
          flexibility
        )
        .then((matches) => setLiquidityMatches(matches));
    }
  }, [step, origin, destination, departsAt, flexibility]);

  const handleNext = () => {
    if (step === 1 && !destination) {
      setToastMessage('Please select a destination to continue.');
      return;
    }
    setToastMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((prev) => Math.min(prev + 1, 4) as any);
  };

  const handlePublish = async () => {
    if (!destination) return;
    setPublishLoading(true);
    setToastMessage(null);

    const { poolId, error } = await poolService.createPool({
      originName: origin.name,
      originLat: origin.latitude,
      originLng: origin.longitude,
      destinationName: destination.name,
      destLat: destination.latitude,
      destLng: destination.longitude,
      destinationPlaceId: destination.placeId,
      departsAt,
      flexibilityMinutes: flexibility,
      totalSeats,
      joinMode,
      note: note || undefined,
      routePolyline: routeData?.polyline,
      routeDistanceM: routeData?.distanceM,
      routeDurationS: routeData?.durationS,
    });

    setPublishLoading(false);

    if (error) {
      setToastMessage(error.message || 'Failed to create pool. Please try again.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    }
  };

  const fareEstimate = poolService.calculateFareEstimate(
    routeData?.distanceM || 25000,
    totalSeats
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Create Pool"
        showBack
        onBack={() => {
          if (step > 1) {
            setStep((prev) => (prev - 1) as any);
          } else {
            router.back();
          }
        }}
        rightAction={
          <Text style={styles.stepIndicator}>
            Step {step} of 4
          </Text>
        }
      />

      {/* Progress Line */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {toastMessage && (
            <Toast message={toastMessage} type="error" style={styles.toast} />
          )}

          {/* STEP 1: DESTINATION */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Where are you going?</Text>
              <Text style={styles.stepSubtitle}>
                Pickup defaults to the BMU campus main gate.
              </Text>

              {/* Origin indicator */}
              <Card variant="flat" style={styles.originCard}>
                <View style={styles.row}>
                  <View style={styles.originDot} />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationLabel}>Pickup</Text>
                    <Text style={styles.locationName}>{origin.name}</Text>
                  </View>
                </View>
              </Card>

              {/* Destination Picker */}
              <LocationPicker
                selectedLocation={destination}
                onSelect={(loc) => setDestination(loc)}
              />

              {/* Route Map Preview */}
              {destination && (
                <View style={styles.mapSection}>
                  <RoutePreviewMap
                    origin={origin}
                    destination={destination}
                    coordinates={routeData?.coordinates}
                    height={180}
                  />
                  {routeData && (
                    <View style={styles.routeStatsRow}>
                      <Text style={styles.routeStat}>
                        {formatDistance(routeData.distanceM)}
                      </Text>
                      <Text style={styles.routeStatDot}>·</Text>
                      <Text style={styles.routeStat}>
                        ~{formatDuration(routeData.durationS)} drive
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Button
                title="Continue to departure time"
                onPress={handleNext}
                disabled={!destination}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* STEP 2: WHEN */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>When are you leaving?</Text>
              <Text style={styles.stepSubtitle}>
                Choose date, time, and how flexible you can be with co-riders.
              </Text>

              <Card variant="flat" style={styles.timeCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTimePickerVisible(true)}
                  style={styles.timeSelector}
                >
                  <Calendar size={22} color={colors.textPrimary} style={styles.timeIcon} />
                  <View style={styles.timeTextContainer}>
                    <Text style={styles.timeLabel}>Departure Time</Text>
                    <Text style={styles.timeValue}>{formatRideTime(departsAt)}</Text>
                  </View>
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </Card>

              <Text style={styles.sectionHeading}>Time flexibility</Text>
              <Text style={styles.fieldHint}>
                Allows students searching within this window to find your ride.
              </Text>
              <View style={styles.chipsRow}>
                {[
                  { label: 'Exact time', value: 0 },
                  { label: '± 10 min', value: 10 },
                  { label: '± 15 min', value: 15 },
                  { label: '± 30 min', value: 30 },
                ].map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    selected={flexibility === item.value}
                    onPress={() => setFlexibility(item.value)}
                  />
                ))}
              </View>

              <DateTimePickerModal
                visible={timePickerVisible}
                value={departsAt}
                onChange={(d) => setDepartsAt(d)}
                onClose={() => setTimePickerVisible(false)}
              />

              <Button
                title="Continue to seats & rules"
                onPress={handleNext}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* STEP 3: SEATS & RULES */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Seats and joining</Text>
              <Text style={styles.stepSubtitle}>
                Specify how many people can join and how join requests are handled.
              </Text>

              <Card variant="flat" style={styles.seatsCard}>
                <Stepper
                  label="Total cab seats (including you)"
                  value={totalSeats}
                  min={3}
                  max={6}
                  onChange={setTotalSeats}
                />
                <Text style={styles.seatsHint}>
                  {totalSeats - 1} {totalSeats - 1 === 1 ? 'seat' : 'seats'} available for co-riders.
                </Text>
              </Card>

              <Text style={styles.sectionHeading}>Join Mode</Text>
              <SegmentedControl
                options={[
                  { value: 'instant', label: 'Instant Join' },
                  { value: 'approval', label: 'Host Approves' },
                ]}
                value={joinMode}
                onChange={(mode) => setJoinMode(mode)}
                style={styles.segment}
              />
              <Text style={styles.fieldHint}>
                {joinMode === 'instant'
                  ? 'Students can join immediately until all seats are taken.'
                  : 'You will receive a notification to approve or decline each join request.'}
              </Text>

              <Text style={styles.sectionHeading}>Note for co-riders (Optional)</Text>
              <TextField
                placeholder="e.g. Booking Uber Premier. Meet at BMU Gate 1 by 6:25 PM."
                value={note}
                onChangeText={setNote}
                maxLength={150}
                multiline
                helperText={`${note.length}/150 characters`}
              />

              <Button
                title="Review pool details"
                onPress={handleNext}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* STEP 4: REVIEW & LIQUIDITY GUARD */}
          {step === 4 && (
            <View>
              <Text style={styles.stepTitle}>Review & Publish</Text>
              <Text style={styles.stepSubtitle}>
                Check all ride details before opening it to campus riders.
              </Text>

              {/* Liquidity Guard Banner */}
              {liquidityMatches.length > 0 && (
                <Card variant="flat" style={styles.liquidityBanner}>
                  <View style={styles.liquidityRow}>
                    <Users size={22} color={colors.info} style={styles.liquidityIcon} />
                    <View style={styles.liquidityTextContainer}>
                      <Text style={styles.liquidityTitle}>
                        {liquidityMatches.length} {liquidityMatches.length === 1 ? 'pool' : 'pools'} already going this way!
                      </Text>
                      <Text style={styles.liquiditySubtitle}>
                        You can join an existing pool instead of booking a separate cab.
                      </Text>
                    </View>
                  </View>
                  <Button
                    title="View existing pools"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push('/modals/search')}
                    style={styles.liquidityBtn}
                  />
                </Card>
              )}

              {/* Route Map Preview */}
              {destination && (
                <View style={styles.reviewMap}>
                  <RoutePreviewMap
                    origin={origin}
                    destination={destination}
                    coordinates={routeData?.coordinates}
                    height={160}
                  />
                </View>
              )}

              {/* Ride Summary Card */}
              <Card variant="outlined" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Route</Text>
                  <Text style={styles.summaryValue}>
                    BMU Gate → {destination?.name}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Leaves</Text>
                  <Text style={styles.summaryValue}>
                    {formatRideTime(departsAt)} (±{flexibility}m)
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Seats</Text>
                  <Text style={styles.summaryValue}>
                    {totalSeats} total ({totalSeats - 1} open)
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mode</Text>
                  <Text style={styles.summaryValue}>
                    {joinMode === 'instant' ? 'Instant join' : 'Host approval'}
                  </Text>
                </View>
              </Card>

              {/* Fare Estimate Card */}
              <Card variant="flat" style={styles.fareCard}>
                <View style={styles.fareHeader}>
                  <Text style={styles.fareTitle}>Estimated Fare</Text>
                  <Text style={styles.farePerPerson}>
                    ~{formatPaise(fareEstimate.perPersonPaise)} / person
                  </Text>
                </View>
                <Text style={styles.fareRange}>
                  Total cab estimate: {formatPaise(fareEstimate.minPaise)} - {formatPaise(fareEstimate.maxPaise)}
                </Text>
                <View style={styles.fareDisclaimerRow}>
                  <Info size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.fareDisclaimer}>
                    Estimate only. The host enters the actual cab fare after booking.
                  </Text>
                </View>
              </Card>

              <Button
                title={liquidityMatches.length > 0 ? 'Publish pool anyway' : 'Publish Pool'}
                onPress={handlePublish}
                loading={publishLoading}
                style={styles.actionBtn}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    height: 3,
    backgroundColor: colors.surface,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primaryAction,
  },
  stepIndicator: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  toast: {
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  originCard: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.primaryAction,
    marginRight: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  locationName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  mapSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  routeStat: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  routeStatDot: {
    marginHorizontal: spacing.xs,
    color: colors.textDisabled,
  },
  actionBtn: {
    marginTop: spacing.xl,
  },
  timeCard: {
    marginBottom: spacing.xl,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: spacing.md,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeValue: {
    ...typography.heading,
    ...typography.tabular,
    color: colors.textPrimary,
  },
  changeLink: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
  sectionHeading: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seatsCard: {
    marginBottom: spacing.lg,
  },
  seatsHint: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  segment: {
    marginBottom: spacing.xs,
  },
  liquidityBanner: {
    backgroundColor: '#EDF5FF',
    borderColor: '#B9DAFB',
    marginBottom: spacing.lg,
  },
  liquidityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  liquidityIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  liquidityTextContainer: {
    flex: 1,
  },
  liquidityTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  liquiditySubtitle: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  liquidityBtn: {
    marginTop: spacing.md,
  },
  reviewMap: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  fareCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fareTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  farePerPerson: {
    ...typography.heading,
    ...typography.tabular,
    color: colors.success,
  },
  fareRange: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fareDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareDisclaimer: {
    ...typography.captionRegular,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
});
