import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone,
  CreditCard,
  Bell,
  Bookmark,
  Shield,
  LogOut,
  Trash2,
  Code2,
  X,
  PhoneCall,
  UserCheck,
  Star,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Avatar,
  Card,
  ListRow,
  Button,
  TextField,
  Toast,
} from '../../src/components/ui';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/features/auth/authStore';
import {
  safetyService,
  BlockedUserItem,
  NotificationPrefs,
} from '../../src/features/safety/safetyService';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [profile, setProfile] = useState<any>(null);
  const [privateProfile, setPrivateProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [coordinationModalVisible, setCoordinationModalVisible] = useState(false);
  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

  // Form states
  const [phoneInput, setPhoneInput] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [submittingCoordination, setSubmittingCoordination] = useState(false);

  // Notification prefs state
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    pool_updates: true,
    chat_messages: true,
    departure_reminders: true,
    ride_alerts: true,
    payment_updates: true,
  });

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [profileRes, privateRes, prefsRes, blockedRes] = await Promise.all([
        (supabase.from('profiles') as any).select('*').eq('id', user.id).single(),
        (supabase.from('profile_private') as any).select('*').eq('id', user.id).single(),
        safetyService.fetchNotificationPrefs(),
        safetyService.fetchBlockedUsers(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setUpiInput(profileRes.data.upi_id || '');
      }
      if (privateRes.data) {
        setPrivateProfile(privateRes.data);
        setPhoneInput(privateRes.data.phone || '');
      }
      setPrefs(prefsRes);
      setBlockedUsers(blockedRes);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveCoordination = async () => {
    setSubmittingCoordination(true);
    const res = await safetyService.updateCoordinationDetails({
      phone: phoneInput,
      upiId: upiInput,
    });
    setSubmittingCoordination(false);

    if (res.success) {
      setToastMessage('Contact & UPI details updated.');
      setCoordinationModalVisible(false);
      loadProfile();
    } else {
      Alert.alert('Update Failed', res.error?.message || 'Could not save details.');
    }
  };

  const handleTogglePref = async (key: keyof NotificationPrefs) => {
    const nextVal = !prefs[key];
    const newPrefs = { ...prefs, [key]: nextVal };
    setPrefs(newPrefs);
    await safetyService.updateNotificationPrefs({ [key]: nextVal });
  };

  const handleUnblock = async (blockedUserId: string) => {
    const res = await safetyService.unblockUser(blockedUserId);
    if (res.success) {
      setBlockedUsers((prev) => prev.filter((b) => b.blockedUserId !== blockedUserId));
      setToastMessage('User unblocked.');
    }
  };

  const handleEmergencyCall = () => {
    Linking.openURL('tel:+911242671000');
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, ride history, and tokens. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            const res = await safetyService.deleteAccount();
            if (res.success) {
              router.replace('/(auth)/sign-in');
            } else {
              Alert.alert('Error', 'Could not delete account.');
            }
          },
        },
      ]
    );
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'BMU Student';
  const displayEmail = user?.email || 'student@bmu.edu.in';
  const ratingAvg = (profile?.rating_avg || 5.0).toFixed(1);
  const rideCount = profile?.ride_count || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
        />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard} variant="outlined">
          <View style={styles.profileRow}>
            <Avatar name={displayName} avatarUrl={profile?.avatar_url} size="lg" />
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
              <View style={styles.statsRow}>
                <Star size={13} color="#000000" fill="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.statsText}>
                  {ratingAvg} · {rideCount} rides completed
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Ride Coordination Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Coordination</Text>
          <Card style={styles.cardGroup} variant="outlined">
            <ListRow
              title="Phone number"
              subtitle={privateProfile?.phone ? privateProfile.phone : 'Add phone for co-riders'}
              leading={<Phone size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => setCoordinationModalVisible(true)}
            />
            <ListRow
              title="UPI ID"
              subtitle={profile?.upi_id ? profile.upi_id : 'Add UPI ID to receive fare splits'}
              leading={<CreditCard size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => setCoordinationModalVisible(true)}
            />
            <ListRow
              title="Saved ride alerts"
              subtitle="Manage departure alerts for NCR routes"
              leading={<Bookmark size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => router.push('/(tabs)/inbox')}
            />
          </Card>
        </View>

        {/* Preferences & Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences & Safety</Text>
          <Card style={styles.cardGroup} variant="outlined">
            <ListRow
              title="Notifications"
              subtitle="Push alerts, ride reminders, and chat"
              leading={<Bell size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => setPrefsModalVisible(true)}
            />
            <ListRow
              title="Campus Safety & Blocked Users"
              subtitle="Security hotline, safety escort & blocked riders"
              leading={<Shield size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => setSafetyModalVisible(true)}
            />
          </Card>
        </View>

        {/* Developer Sandbox Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <Card style={styles.cardGroup} variant="outlined">
            <ListRow
              title="Design System Showcase"
              subtitle="Inspect all UI tokens, primitives & states"
              leading={<Code2 size={20} color={colors.info} />}
              showChevron
              onPress={() => router.push('/dev-showcase')}
            />
          </Card>
        </View>

        {/* Sign Out & Account Action */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSignOut}
            accessibilityRole="button"
          >
            <LogOut size={20} color={colors.textPrimary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Sign out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
          >
            <Trash2 size={20} color={colors.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.dangerText]}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal 1: Edit Coordination Details */}
      <Modal
        visible={coordinationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCoordinationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Coordination Details</Text>
              <TouchableOpacity onPress={() => setCoordinationModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Phone numbers are strictly private and revealed only to confirmed co-riders in your
              pool. UPI ID is used by co-riders to transfer fare splits directly to you.
            </Text>

            <TextField
              label="Mobile Number"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />

            <TextField
              label="UPI ID"
              placeholder="e.g. name@okhdfcbank"
              autoCapitalize="none"
              value={upiInput}
              onChangeText={setUpiInput}
            />

            <Button
              title="Save Details"
              onPress={handleSaveCoordination}
              loading={submittingCoordination}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal 2: Notification Preferences */}
      <Modal
        visible={prefsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrefsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setPrefsModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.prefRow}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Pool Updates</Text>
                <Text style={styles.prefSubtitle}>Rider joins, host approvals, and status changes</Text>
              </View>
              <Switch
                value={prefs.pool_updates}
                onValueChange={() => handleTogglePref('pool_updates')}
                trackColor={{ false: colors.border, true: '#000000' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.prefRow}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Chat Messages</Text>
                <Text style={styles.prefSubtitle}>Direct group messages in your active pools</Text>
              </View>
              <Switch
                value={prefs.chat_messages}
                onValueChange={() => handleTogglePref('chat_messages')}
                trackColor={{ false: colors.border, true: '#000000' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.prefRow}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Departure Reminders</Text>
                <Text style={styles.prefSubtitle}>Alerts 30 mins before scheduled cab pickup</Text>
              </View>
              <Switch
                value={prefs.departure_reminders}
                onValueChange={() => handleTogglePref('departure_reminders')}
                trackColor={{ false: colors.border, true: '#000000' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.prefRow}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Fare & Payment Updates</Text>
                <Text style={styles.prefSubtitle}>Notices when cab fare is split and marked paid</Text>
              </View>
              <Switch
                value={prefs.payment_updates}
                onValueChange={() => handleTogglePref('payment_updates')}
                trackColor={{ false: colors.border, true: '#000000' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Safety & Blocked Users */}
      <Modal
        visible={safetyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Campus Safety & Trust</Text>
              <TouchableOpacity onPress={() => setSafetyModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Campus Security Helpline Card */}
            <Card style={styles.sosCard}>
              <View style={styles.sosRow}>
                <View style={styles.sosIconCircle}>
                  <PhoneCall size={22} color="#FFFFFF" />
                </View>
                <View style={styles.sosDetails}>
                  <Text style={styles.sosTitle}>BMU Security Control Room</Text>
                  <Text style={styles.sosSubtitle}>24/7 Campus Emergency Assistance</Text>
                </View>
              </View>
              <Button
                title="Call Security Hotline (+91 124 267 1000)"
                onPress={handleEmergencyCall}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            </Card>

            <Text style={styles.blockedSectionTitle}>Blocked Users ({blockedUsers.length})</Text>
            {blockedUsers.length > 0 ? (
              blockedUsers.map((b) => (
                <View key={b.id} style={styles.blockedRow}>
                  <Avatar name={b.fullName} avatarUrl={b.avatarUrl} size="sm" />
                  <Text style={styles.blockedName}>{b.fullName}</Text>
                  <TouchableOpacity
                    style={styles.unblockBtn}
                    onPress={() => handleUnblock(b.blockedUserId)}
                  >
                    <Text style={styles.unblockBtnText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noBlockedText}>
                You have not blocked any riders. Blocked riders cannot see or join your pools.
              </Text>
            )}
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  cardGroup: {
    padding: 0,
    overflow: 'hidden',
  },
  actionsGroup: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actionIcon: {
    marginRight: spacing.md,
  },
  actionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  prefTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  prefSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  sosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sosDetails: {
    flex: 1,
  },
  sosTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sosSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  blockedSectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  blockedName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  unblockBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unblockBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  noBlockedText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
