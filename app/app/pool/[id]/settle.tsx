import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Copy, ExternalLink, IndianRupee, ShieldCheck } from 'lucide-react-native';
import {
  ScreenHeader,
  Card,
  Button,
  TextField,
  StatusBadge,
  Avatar,
  Toast,
} from '../../../src/components/ui';
import {
  settlementService,
  SettlementItem,
} from '../../../src/features/settlements/settlementService';
import {
  poolLifecycleService,
  DetailedPool,
} from '../../../src/features/pools/poolLifecycleService';
import { useAuthStore } from '../../../src/features/auth/authStore';
import { formatPaise } from '../../../src/lib/formatters';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

export default function PoolSettleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state: any) => state.user);

  const [pool, setPool] = useState<DetailedPool | null>(null);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Host entry form
  const [finalFareInput, setFinalFareInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [poolData, settlementsData, memberContacts] = await Promise.all([
      poolLifecycleService.fetchPoolDetails(id as string, user?.id),
      settlementService.fetchPoolSettlements(id as string),
      poolLifecycleService.fetchMemberContacts(id as string),
    ]);

    setPool(poolData);
    setSettlements(settlementsData);
    setContacts(memberContacts);
    if (poolData?.finalFare) {
      setFinalFareInput((poolData.finalFare / 100).toString());
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !pool) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Fare & Settlement" showBack onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading settlement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = pool.hostId === user?.id;
  const isCompleted = pool.status === 'completed';
  const mySettlement = settlements.find((s) => s.payerId === user?.id);

  // Find host contact info for UPI ID
  const hostContact = contacts.find((c) => c.user_id === pool.hostId);
  const hostUpiId = hostContact?.upi_id || pool.members.find((m) => m.userId === pool.hostId)?.upiId;

  // Final Fare Completion
  const handleCompletePool = async () => {
    const rupees = parseFloat(finalFareInput);
    if (isNaN(rupees) || rupees <= 0) {
      Alert.alert('Invalid Fare', 'Please enter a valid fare in rupees.');
      return;
    }

    const finalFarePaise = Math.round(rupees * 100);

    setActionLoading(true);
    const res = await settlementService.completePool(pool.id, finalFarePaise);
    setActionLoading(false);

    if (res.success) {
      setToastMessage('Ride completed! Settlements generated.');
      loadData();
    } else {
      Alert.alert('Error', res.error?.message || 'Could not complete ride.');
    }
  };

  // Pay via UPI Deep Link
  const handlePayUPI = async () => {
    if (!mySettlement || !hostUpiId) {
      Alert.alert('UPI Unavailable', 'The host has not set a UPI ID.');
      return;
    }

    const upiUrl = settlementService.generateUpiUrl({
      upiId: hostUpiId,
      payeeName: pool.hostName,
      amountPaise: mySettlement.amountPaise,
      transactionNote: `RideHive Cab to ${pool.destinationName}`,
    });

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          'UPI App Not Found',
          `Host UPI ID: ${hostUpiId}\nPlease transfer ₹${(mySettlement.amountPaise / 100).toFixed(2)} directly in your UPI app.`
        );
      }
    } catch {
      Alert.alert(
        'UPI Payment',
        `Host UPI ID: ${hostUpiId}\nPlease pay ₹${(mySettlement.amountPaise / 100).toFixed(2)} in your preferred UPI app.`
      );
    }
  };

  // Member marks paid
  const handleMarkPaid = async () => {
    setActionLoading(true);
    const res = await settlementService.markSettlementPaid(pool.id);
    setActionLoading(false);

    if (res.success) {
      setToastMessage('Marked as paid! Host will confirm shortly.');
      loadData();
    } else {
      Alert.alert('Error', res.error?.message || 'Could not update status.');
    }
  };

  // Host confirms receipt
  const handleConfirmSettlement = async (payerId: string) => {
    setActionLoading(true);
    const res = await settlementService.confirmSettlement(pool.id, payerId);
    setActionLoading(false);

    if (res.success) {
      setToastMessage('Payment confirmed!');
      loadData();
    } else {
      Alert.alert('Error', res.error?.message || 'Could not confirm payment.');
    }
  };

  // Preview calculations
  const parsedRupees = parseFloat(finalFareInput) || 0;
  const previewTotalPaise = Math.round(parsedRupees * 100);
  const confirmedMemberCount = Math.max(1, pool.seatsTaken);
  const previewPerPersonPaise = Math.floor(previewTotalPaise / confirmedMemberCount);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Fare & Settlement"
        subtitle={pool.destinationName}
        showBack
        onBack={() => router.back()}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 1: If ride not completed yet */}
        {!isCompleted && isHost && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Complete Ride & Calculate Split</Text>
            <Text style={styles.sectionSubtitle}>
              Enter the exact amount charged by the cab provider (Uber/Ola/InDrive). RideHive will
              split the fare evenly among all {pool.seatsTaken} confirmed riders.
            </Text>

            <TextField
              label="Actual Cab Fare (₹)"
              placeholder="e.g. 640"
              keyboardType="numeric"
              value={finalFareInput}
              onChangeText={setFinalFareInput}
            />

            {previewTotalPaise > 0 && (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total Fare:</Text>
                  <Text style={styles.previewValue}>{formatPaise(previewTotalPaise)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Confirmed Riders:</Text>
                  <Text style={styles.previewValue}>{confirmedMemberCount}</Text>
                </View>
                <View style={[styles.previewRow, styles.previewHighlightRow]}>
                  <Text style={styles.highlightLabel}>Each Rider Pays:</Text>
                  <Text style={styles.highlightValue}>{formatPaise(previewPerPersonPaise)}</Text>
                </View>
                <Text style={styles.remainderNotice}>
                  *Any indivisible remainder paise are allocated deterministically to maintain exact
                  balance.
                </Text>
              </View>
            )}

            <Button
              title="Confirm Final Fare & Split"
              onPress={handleCompletePool}
              loading={actionLoading}
              disabled={previewTotalPaise <= 0}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}

        {!isCompleted && !isHost && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Awaiting Final Fare Entry</Text>
            <Text style={styles.sectionSubtitle}>
              The pool host ({pool.hostName}) will enter the final cab bill once your ride reaches
              the destination. Once submitted, your individual share will appear here for 1-tap UPI
              settlement.
            </Text>
            <View style={styles.fareRangeBox}>
              <Text style={styles.fareRangeLabel}>Estimated Fare Range</Text>
              <Text style={styles.fareRangeValue}>
                {formatPaise(pool.estimatedFareMin)} - {formatPaise(pool.estimatedFareMax)}
              </Text>
              <Text style={styles.fareRangePerPerson}>
                ~{formatPaise(Math.round(pool.estimatedFareMin / pool.totalSeats))} per person
              </Text>
            </View>
          </Card>
        )}

        {/* Step 2: Once completed, settlement view */}
        {isCompleted && (
          <>
            {/* Final Fare Banner */}
            <Card style={styles.completedBannerCard}>
              <Text style={styles.completedLabel}>Ride Completed</Text>
              <Text style={styles.completedTotalFare}>{formatPaise(pool.finalFare || 0)}</Text>
              <Text style={styles.completedSplitNote}>
                Split among {pool.seatsTaken} riders
              </Text>
            </Card>

            {/* My Payment Action Card (For Non-Host Rider) */}
            {!isHost && mySettlement && (
              <Card style={styles.myShareCard}>
                <Text style={styles.myShareHeader}>Your Share</Text>
                <Text style={styles.myShareAmount}>
                  {formatPaise(mySettlement.amountPaise)}
                </Text>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Payment Status:</Text>
                  <StatusBadge
                    status={mySettlement.status}
                    label={
                      mySettlement.status === 'confirmed'
                        ? 'Payment Confirmed'
                        : mySettlement.status === 'marked_paid'
                        ? 'Waiting for Host'
                        : 'Payment Due'
                    }
                  />
                </View>

                {hostUpiId && (
                  <View style={styles.upiInfoBox}>
                    <Text style={styles.upiLabel}>Host UPI ID:</Text>
                    <Text style={styles.upiValue}>{hostUpiId}</Text>
                  </View>
                )}

                {mySettlement.status === 'pending' && (
                  <View style={styles.payActionGroup}>
                    <Button
                      title="Pay with UPI App"
                      onPress={handlePayUPI}
                      style={{ marginBottom: spacing.sm }}
                    />
                    <Button
                      title="I Have Sent Payment"
                      variant="secondary"
                      onPress={handleMarkPaid}
                      loading={actionLoading}
                    />
                  </View>
                )}

                {mySettlement.status === 'marked_paid' && (
                  <View style={styles.markedPaidNotice}>
                    <ShieldCheck size={20} color={colors.info} />
                    <Text style={styles.markedPaidText}>
                      You have marked this payment as paid. Host will verify and confirm.
                    </Text>
                  </View>
                )}

                {mySettlement.status === 'confirmed' && (
                  <View style={styles.confirmedNotice}>
                    <Check size={20} color={colors.success} />
                    <Text style={styles.confirmedText}>
                      Settlement complete! Thank you for pooling with RideHive.
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {/* All Pool Settlements Breakdown */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Settlement Ledger</Text>
              <Text style={styles.sectionSubtitle}>
                Payments due to host ({pool.hostName}):
              </Text>

              {settlements.map((item) => {
                const isItemPayer = item.payerId === user?.id;
                return (
                  <View key={item.id} style={styles.settlementRow}>
                    <Avatar name={item.payerName} avatarUrl={item.payerAvatarUrl} size="sm" />
                    <View style={styles.settlementInfo}>
                      <Text style={styles.payerName}>
                        {item.payerName} {isItemPayer ? '(You)' : ''}
                      </Text>
                      <Text style={styles.settlementPaise}>
                        {formatPaise(item.amountPaise)}
                      </Text>
                    </View>

                    <View style={styles.settlementActionCol}>
                      <StatusBadge
                        status={item.status}
                        label={
                          item.status === 'confirmed'
                            ? 'Settled'
                            : item.status === 'marked_paid'
                            ? 'Marked Paid'
                            : 'Pending'
                        }
                      />

                      {/* Host can confirm payment marked as paid */}
                      {isHost && item.status !== 'confirmed' && (
                        <TouchableOpacity
                          style={styles.confirmSmallBtn}
                          onPress={() => handleConfirmSettlement(item.payerId)}
                          disabled={actionLoading}
                        >
                          <Text style={styles.confirmSmallBtnText}>Confirm</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
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
  scrollContent: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  previewBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  previewHighlightRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  highlightLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  highlightValue: {
    ...typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  remainderNotice: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  fareRangeBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  fareRangeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  fareRangeValue: {
    ...typography.heading,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  fareRangePerPerson: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  completedBannerCard: {
    alignItems: 'center',
    backgroundColor: '#000000',
    marginBottom: spacing.lg,
  },
  completedLabel: {
    ...typography.caption,
    color: '#A0A0A0',
    textTransform: 'uppercase',
  },
  completedTotalFare: {
    ...typography.display,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.xs,
  },
  completedSplitNote: {
    ...typography.caption,
    color: '#A0A0A0',
  },
  myShareCard: {
    marginBottom: spacing.lg,
    borderColor: '#000000',
    borderWidth: 1.5,
  },
  myShareHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  myShareAmount: {
    ...typography.display,
    fontSize: 28,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  upiInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginVertical: spacing.sm,
  },
  upiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  upiValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  payActionGroup: {
    marginTop: spacing.sm,
  },
  markedPaidNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF5FF',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
  },
  markedPaidText: {
    ...typography.caption,
    color: colors.info,
    marginLeft: spacing.sm,
    flex: 1,
  },
  confirmedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8EE',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
  },
  confirmedText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.sm,
    flex: 1,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settlementInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  payerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  settlementPaise: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  settlementActionCol: {
    alignItems: 'flex-end',
  },
  confirmSmallBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  confirmSmallBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 11,
  },
});
