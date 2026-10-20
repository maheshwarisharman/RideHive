import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Clock,
  Car,
  Star,
  Users,
  MessageSquare,
  Shield,
  Phone,
  CreditCard,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  ScreenHeader,
  Card,
  Button,
  StatusBadge,
  SeatIndicator,
  Avatar,
  AvatarStack,
  TextField,
  Toast,
  Chip,
  ListRow,
} from '../../../src/components/ui';
import { RoutePreviewMap } from '../../../src/features/maps/RoutePreviewMap';
import { mapsService } from '../../../src/features/maps/mapsService';
import {
  poolLifecycleService,
  DetailedPool,
  PoolMemberInfo,
} from '../../../src/features/pools/poolLifecycleService';
import { useAuthStore } from '../../../src/features/auth/authStore';
import { formatPaise, formatRideTime } from '../../../src/lib/formatters';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

export default function PoolDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state: any) => state.user);

  const [pool, setPool] = useState<DetailedPool | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  // Book cab modal state
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [provider, setProvider] = useState<string>('uber');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [cabNote, setCabNote] = useState<string>('');

  const loadPool = useCallback(async () => {
    if (!id) return;
    const data = await poolLifecycleService.fetchPoolDetails(id, user?.id);
    setPool(data);
    setLoading(false);

    if (data && data.myStatus === 'confirmed') {
      const contactList = await poolLifecycleService.fetchMemberContacts(id);
      setContacts(contactList);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  // Join pool handler
  const handleJoin = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }
    if (!pool) return;

    setActionLoading(true);
    setToastMessage(null);

    const res = await poolLifecycleService.joinPool(pool.id);
    setActionLoading(false);

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastMessage(res.message || 'Joined successfully!');
      setToastType('success');
      loadPool();
    } else {
      setToastMessage(res.error?.message || 'Failed to join pool.');
      setToastType('error');
    }
  };

  // Leave pool handler
  const handleLeave = () => {
    if (!pool) return;

    const isBooked = pool.status === 'booked';
    const message = isBooked
      ? 'The cab has already been booked. Leaving now will increment your late cancellation count. Are you sure?'
      : 'Are you sure you want to leave this pool?';

    Alert.alert('Leave pool', message, [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const res = await poolLifecycleService.leavePool(pool.id);
          setActionLoading(false);

          if (res.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadPool();
          } else {
            setToastMessage(res.error?.message || 'Failed to leave pool.');
            setToastType('error');
          }
        },
      },
    ]);
  };

  // Approve member
  const handleApprove = async (targetUserId: string) => {
    if (!pool) return;
    setActionLoading(true);
    const res = await poolLifecycleService.approveMember(pool.id, targetUserId);
    setActionLoading(false);

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadPool();
    } else {
      setToastMessage(res.error?.message || 'Failed to approve request.');
      setToastType('error');
    }
  };

  // Mark cab booked
  const handleConfirmBooked = async () => {
    if (!pool) return;
    setActionLoading(true);
    const res = await poolLifecycleService.markBooked(
      pool.id,
      provider,
      vehicleNumber || undefined,
      cabNote || undefined
    );
    setActionLoading(false);
    setBookModalVisible(false);

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastMessage('Cab marked as booked! Riders notified.');
      setToastType('success');
      loadPool();
    } else {
      setToastMessage(res.error?.message || 'Failed to update status.');
      setToastType('error');
    }
  };

  // Close joining
  const handleCloseJoining = async () => {
    if (!pool) return;
    setActionLoading(true);
    const res = await poolLifecycleService.closePool(pool.id);
    setActionLoading(false);

    if (res.success) {
      loadPool();
    } else {
      setToastMessage(res.error?.message || 'Failed to close pool.');
      setToastType('error');
    }
  };

  // Cancel pool
  const handleCancelPool = () => {
    if (!pool) return;

    Alert.alert(
      'Cancel pool',
      'This will cancel the entire pool and notify all confirmed riders. This cannot be undone.',
      [
        { text: 'Keep pool', style: 'cancel' },
        {
          text: 'Cancel pool',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const res = await poolLifecycleService.cancelPool(pool.id);
            setActionLoading(false);

            if (res.success) {
              router.back();
            } else {
              setToastMessage(res.error?.message || 'Failed to cancel pool.');
              setToastType('error');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Pool Details" showBack />
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primaryAction} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pool) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Pool Details" showBack />
        <View style={styles.loaderCenter}>
          <Text style={styles.notFoundText}>Pool not found or has expired.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = pool.myRole === 'host';
  const isMember = pool.myRole === 'member' && pool.myStatus === 'confirmed';
  const isPending = pool.myRole === 'member' && pool.myStatus === 'pending';
  const isOpen = pool.status === 'open';
  const isBooked = pool.status === 'booked';
  const isCompleted = pool.status === 'completed';
  const isCancelled = pool.status === 'cancelled';

  const pendingRequests = isHost ? pool.members.filter((m: PoolMemberInfo) => m.status === 'pending') : [];
  const confirmedMembers = pool.members.filter((m: PoolMemberInfo) => m.status === 'confirmed');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Ride Pool"
        showBack
        rightAction={
          isMember || isHost ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/pool/[id]/chat', params: { id: pool.id } })}
              style={styles.chatHeaderBtn}
              accessibilityRole="button"
              accessibilityLabel="Open pool chat"
            >
              <MessageSquare size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {toastMessage && (
          <Toast message={toastMessage} type={toastType} style={styles.toast} />
        )}

        {/* Route Preview Map */}
        <View style={styles.mapContainer}>
          <RoutePreviewMap
            origin={{ latitude: pool.originLat, longitude: pool.originLng, name: pool.originName }}
            destination={{ latitude: pool.destLat, longitude: pool.destLng, name: pool.destinationName }}
            height={200}
          />
        </View>

        {/* Main Pool Header */}
        <Card variant="flat" style={styles.headerCard}>
          <View style={styles.statusRow}>
            <StatusBadge status={pool.status} />
            <Text style={styles.joinModeText}>
              {pool.joinMode === 'instant' ? 'Instant join' : 'Host approval'}
            </Text>
          </View>

          <Text style={styles.destTitle} numberOfLines={2}>
            {pool.destinationName}
          </Text>
          <Text style={styles.originSubtitle}>
            Pickup from {pool.originName}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>
                {formatRideTime(pool.departsAt)} (±{pool.flexibilityMinutes}m)
              </Text>
            </View>
          </View>

          <View style={styles.seatsRow}>
            <SeatIndicator totalSeats={pool.totalSeats} seatsTaken={pool.seatsTaken} />
            <Text style={styles.farePerPerson}>
              ~{formatPaise(Math.round(pool.estimatedFareMin / pool.totalSeats))} / person
            </Text>
          </View>
        </Card>

        {/* Booked Cab Banner (if booked) */}
        {isBooked && (
          <Card variant="flat" style={styles.bookedBanner}>
            <View style={styles.bookedHeader}>
              <Car size={20} color={colors.info} style={{ marginRight: 8 }} />
              <Text style={styles.bookedTitle}>
                Cab Booked: {pool.cabProvider?.toUpperCase()}
              </Text>
            </View>
            {pool.cabVehicleNumber && (
              <Text style={styles.bookedVehicle}>
                Vehicle: {pool.cabVehicleNumber}
              </Text>
            )}
            {pool.cabNote && (
              <Text style={styles.bookedNote}>{pool.cabNote}</Text>
            )}
          </Card>
        )}

        {/* Host Profile Card */}
        <Card variant="outlined" style={styles.hostCard}>
          <Text style={styles.sectionHeader}>Host</Text>
          <View style={styles.hostRow}>
            <Avatar name={pool.hostName} avatarUrl={pool.hostAvatarUrl} size="md" />
            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>{pool.hostName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.ratingText}>
                  {Number(pool.hostRatingAvg).toFixed(1)} rating
                </Text>
              </View>
            </View>
          </View>
          {pool.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>"{pool.note}"</Text>
            </View>
          )}
        </Card>

        {/* Co-riders List */}
        <Card variant="outlined" style={styles.membersCard}>
          <Text style={styles.sectionHeader}>
            Riders ({pool.seatsTaken} of {pool.totalSeats})
          </Text>
          <AvatarStack
            members={confirmedMembers.map((m: PoolMemberInfo) => ({ id: m.userId, name: m.name, avatarUrl: m.avatarUrl }))}
            size="md"
            style={styles.avatarStack}
          />

          {confirmedMembers.map((m: PoolMemberInfo) => (
            <ListRow
              key={m.userId}
              title={m.name}
              subtitle={m.role === 'host' ? 'Host' : 'Confirmed rider'}
              leading={<Avatar name={m.name} avatarUrl={m.avatarUrl} size="sm" />}
            />
          ))}
        </Card>

        {/* Pending Approval Requests (Host view) */}
        {isHost && pendingRequests.length > 0 && (
          <Card variant="flat" style={styles.pendingCard}>
            <Text style={styles.sectionHeader}>Pending Join Requests</Text>
            {pendingRequests.map((req: PoolMemberInfo) => (
              <View key={req.userId} style={styles.pendingRow}>
                <Avatar name={req.name} avatarUrl={req.avatarUrl} size="sm" />
                <View style={styles.pendingDetails}>
                  <Text style={styles.pendingName}>{req.name}</Text>
                  <Text style={styles.pendingTime}>Requested to join</Text>
                </View>
                <Button
                  title="Approve"
                  size="sm"
                  onPress={() => handleApprove(req.userId)}
                  loading={actionLoading}
                />
              </View>
            ))}
          </Card>
        )}

        {/* Co-Member Contacts (Only for confirmed members) */}
        {(isHost || isMember) && contacts.length > 0 && (
          <Card variant="outlined" style={styles.contactsCard}>
            <View style={styles.contactsHeader}>
              <Shield size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.contactsTitle}>Coordination Contacts</Text>
            </View>
            {contacts.map((c) => (
              <View key={c.user_id} style={styles.contactItem}>
                <Text style={styles.contactName}>{c.full_name} ({c.role})</Text>
                {c.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.contactValue}>{c.phone}</Text>
                  </View>
                )}
                {c.upi_id && (
                  <View style={styles.contactRow}>
                    <CreditCard size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.contactValue}>UPI: {c.upi_id}</Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.actionsContainer}>
          {/* Guest / Non-member Action */}
          {!isHost && !isMember && !isPending && isOpen && (
            <Button
              title={pool.joinMode === 'instant' ? 'Join Pool' : 'Request to Join'}
              onPress={handleJoin}
              loading={actionLoading}
            />
          )}

          {isPending && (
            <Button
              title="Request Pending Host Approval"
              variant="secondary"
              disabled
              onPress={() => {}}
            />
          )}

          {/* Confirmed Member Action */}
          {isMember && (
            <View style={styles.memberActionGroup}>
              <Button
                title="Open Pool Chat"
                icon={<MessageSquare size={18} color={colors.white} />}
                onPress={() => router.push({ pathname: '/pool/[id]/chat', params: { id: pool.id } })}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="Leave Pool"
                variant="destructive"
                onPress={handleLeave}
                loading={actionLoading}
              />
            </View>
          )}

          {/* Host Action Center */}
          {isHost && (
            <View style={styles.hostActionGroup}>
              <Button
                title="Open Pool Chat"
                icon={<MessageSquare size={18} color={colors.white} />}
                onPress={() => router.push({ pathname: '/pool/[id]/chat', params: { id: pool.id } })}
                style={{ marginBottom: spacing.sm }}
              />

              {!isBooked && !isCompleted && !isCancelled && (
                <Button
                  title="Mark Cab Booked"
                  icon={<Car size={18} color={colors.textPrimary} />}
                  variant="secondary"
                  onPress={() => setBookModalVisible(true)}
                  style={{ marginBottom: spacing.sm }}
                />
              )}

              {isOpen && (
                <Button
                  title="Close Joining Early"
                  variant="secondary"
                  onPress={handleCloseJoining}
                  loading={actionLoading}
                  style={{ marginBottom: spacing.sm }}
                />
              )}

              {(isOpen || isBooked) && (
                <Button
                  title="Complete Ride & Split Fare"
                  onPress={() => router.push({ pathname: '/pool/[id]/settle', params: { id: pool.id } })}
                  style={{ marginBottom: spacing.sm }}
                />
              )}

              {!isCompleted && !isCancelled && (
                <Button
                  title="Cancel Pool"
                  variant="destructive"
                  onPress={handleCancelPool}
                  loading={actionLoading}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MARK CAB BOOKED MODAL */}
      <Modal
        visible={bookModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBookModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Cab Booked</Text>
            <Text style={styles.modalSubtitle}>
              Let co-riders know you booked the cab and share vehicle details.
            </Text>

            <Text style={styles.modalFieldLabel}>Cab Provider</Text>
            <View style={styles.providerChips}>
              {['uber', 'ola', 'rapido', 'other'].map((p) => (
                <Chip
                  key={p}
                  label={p.toUpperCase()}
                  selected={provider === p}
                  onPress={() => setProvider(p)}
                />
              ))}
            </View>

            <TextField
              label="Vehicle Number (Optional)"
              placeholder="e.g. HR 26 DK 1234"
              autoCapitalize="characters"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />

            <TextField
              label="Pickup Note (Optional)"
              placeholder="e.g. White Dzire, standing near Gate 1"
              value={cabNote}
              onChangeText={setCabNote}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setBookModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Confirm Booking"
                onPress={handleConfirmBooked}
                loading={actionLoading}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  toast: {
    marginBottom: spacing.md,
  },
  mapContainer: {
    marginBottom: spacing.md,
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  joinModeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  destTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  originSubtitle: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  farePerPerson: {
    ...typography.heading,
    ...typography.tabular,
    color: colors.success,
  },
  bookedBanner: {
    backgroundColor: '#EDF5FF',
    borderColor: '#B9DAFB',
    marginBottom: spacing.md,
  },
  bookedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookedTitle: {
    ...typography.bodyMedium,
    color: colors.info,
    fontWeight: '700',
  },
  bookedVehicle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  bookedNote: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hostCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostDetails: {
    marginLeft: spacing.md,
  },
  hostName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...typography.captionRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  noteBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
  },
  noteText: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  membersCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  avatarStack: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pendingCard: {
    backgroundColor: '#FFF8E6',
    borderColor: '#FEEBC8',
    marginBottom: spacing.md,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pendingDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingTime: {
    ...typography.captionRegular,
    color: colors.textSecondary,
  },
  contactsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactsTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contactItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contactName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactValue: {
    ...typography.captionRegular,
    color: colors.textSecondary,
  },
  actionsContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  memberActionGroup: {
    flexDirection: 'column',
  },
  hostActionGroup: {
    flexDirection: 'column',
  },
  chatHeaderBtn: {
    padding: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalFieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  providerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
