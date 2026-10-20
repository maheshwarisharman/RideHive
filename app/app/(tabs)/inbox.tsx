import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  MessageSquare,
  Clock,
  CheckCircle,
  Car,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  SegmentedControl,
  EmptyState,
  Card,
  Avatar,
  SeatIndicator,
  Button,
} from '../../src/components/ui';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { formatRideTime, formatPaise } from '../../src/lib/formatters';
import { useAuthStore } from '../../src/features/auth/authStore';
import {
  notificationsService,
  NotificationItem,
  RideAlertItem,
  ActivePoolChatSummary,
} from '../../src/features/notifications/notificationsService';

type InboxTab = 'notifications' | 'messages' | 'alerts';

function getNotificationDetails(notif: NotificationItem): {
  title: string;
  body: string;
  route?: string;
  params?: Record<string, any>;
} {
  const p = notif.payload || {};
  switch (notif.type) {
    case 'ride_completed':
      return {
        title: 'Ride Completed & Fare Split',
        body: p.amount_paise
          ? `Your share is ${formatPaise(p.amount_paise)}. Tap to settle via UPI.`
          : 'The pool host has finalized the cab fare.',
        route: '/pool/[id]/settle',
        params: { id: p.pool_id },
      };
    case 'payment_marked_paid':
      return {
        title: 'Payment Received',
        body: `${p.payer_name || 'A rider'} marked their share as paid. Tap to confirm.`,
        route: '/pool/[id]/settle',
        params: { id: p.pool_id },
      };
    case 'payment_confirmed':
      return {
        title: 'Payment Confirmed',
        body: 'The pool host confirmed receipt of your payment.',
        route: '/pool/[id]/settle',
        params: { id: p.pool_id },
      };
    case 'booking_confirmed':
      return {
        title: 'Cab Booked',
        body: `${p.provider || 'Cab'} booked. Vehicle: ${p.vehicle_number || 'Confirmed'}.`,
        route: '/pool/[id]',
        params: { id: p.pool_id },
      };
    case 'member_joined':
      return {
        title: 'New Co-Rider Joined',
        body: `${p.name || 'A student'} joined your cab pool.`,
        route: '/pool/[id]',
        params: { id: p.pool_id },
      };
    case 'join_request':
      return {
        title: 'Join Request',
        body: `${p.name || 'A rider'} requested to join your pool. Tap to approve.`,
        route: '/pool/[id]',
        params: { id: p.pool_id },
      };
    case 'pool_cancelled':
      return {
        title: 'Pool Cancelled',
        body: 'A pool you joined was cancelled by the host.',
        route: '/pool/[id]',
        params: { id: p.pool_id },
      };
    case 'alert_match':
      return {
        title: 'Ride Alert Match!',
        body: `A new pool heading to ${p.destination || 'your destination'} was just created.`,
        route: '/pool/[id]',
        params: { id: p.pool_id },
      };
    default:
      return {
        title: 'RideHive Notification',
        body: p.message || 'You have an update regarding your pool.',
        route: p.pool_id ? '/pool/[id]' : undefined,
        params: p.pool_id ? { id: p.pool_id } : undefined,
      };
  }
}

export default function InboxScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [selectedTab, setSelectedTab] = useState<InboxTab>('notifications');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeChats, setActiveChats] = useState<ActivePoolChatSummary[]>([]);
  const [alerts, setAlerts] = useState<RideAlertItem[]>([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [notifs, chats, userAlerts] = await Promise.all([
        notificationsService.fetchNotifications(user.id),
        notificationsService.fetchUserActiveChats(user.id),
        notificationsService.fetchActiveRideAlerts(user.id),
      ]);

      setNotifications(notifs);
      setActiveChats(chats);
      setAlerts(userAlerts);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    if (!user?.id) return;

    // Realtime notification subscription
    const unsubscribe = notificationsService.subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleNotificationPress = async (notif: NotificationItem) => {
    if (!notif.readAt) {
      notificationsService.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    }

    const details = getNotificationDetails(notif);
    if (details.route && details.params) {
      router.push({
        pathname: details.route as any,
        params: details.params,
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await notificationsService.markAllNotificationsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
  };

  const handleToggleAlert = async (alertId: string, current: boolean) => {
    const next = !current;
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, active: next } : a)));
    await notificationsService.toggleRideAlert(alertId, next);
  };

  const handleDeleteAlert = async (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await notificationsService.deleteRideAlert(alertId);
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const tabs: { value: InboxTab; label: string; badge?: number }[] = [
    { value: 'notifications', label: 'Updates', badge: unreadCount },
    { value: 'messages', label: 'Chats', badge: activeChats.length },
    { value: 'alerts', label: 'Alerts', badge: alerts.length },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        {selectedTab === 'notifications' && unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedControl
          options={tabs}
          value={selectedTab}
          onChange={(tab) => setSelectedTab(tab)}
        />
      </View>

      {/* Tab 1: Notifications / Updates */}
      {selectedTab === 'notifications' && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon={<Bell size={40} color={colors.textDisabled} />}
                title="No notifications yet"
                description="Updates on your pools, join requests, and fare splits will appear here."
              />
            ) : undefined
          }
          renderItem={({ item }) => {
            const isUnread = !item.readAt;
            const details = getNotificationDetails(item);

            return (
              <TouchableOpacity
                style={[styles.notifCard, isUnread ? styles.notifCardUnread : null]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.notifIconCol}>
                  <View
                    style={[
                      styles.iconCircle,
                      isUnread ? styles.iconCircleActive : styles.iconCircleMuted,
                    ]}
                  >
                    <Bell size={18} color={isUnread ? '#FFFFFF' : colors.textSecondary} />
                  </View>
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <Text style={[styles.notifTitle, isUnread ? styles.boldTitle : null]}>
                      {details.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifBody}>{details.body}</Text>
                  <Text style={styles.notifTime}>{formatRideTime(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Tab 2: Pool Chats */}
      {selectedTab === 'messages' && (
        <FlatList
          data={activeChats}
          keyExtractor={(item) => item.poolId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon={<MessageSquare size={40} color={colors.textDisabled} />}
                title="No active pool chats"
                description="When you join or host a pool, your group chat will appear here."
                actionTitle="Find a pool"
                onAction={() => router.push('/modals/search')}
              />
            ) : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/pool/[id]/chat',
                  params: { id: item.poolId },
                })
              }
            >
              <View style={styles.chatIconCol}>
                <View style={styles.chatAvatar}>
                  <Car size={20} color={colors.textPrimary} />
                </View>
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    {item.destinationName}
                  </Text>
                  <Text style={styles.chatTime}>
                    {formatRideTime(item.lastMessageTime || item.departsAt)}
                  </Text>
                </View>

                <Text style={styles.lastMessageSnippet} numberOfLines={1}>
                  {item.lastMessage}
                </Text>

                <View style={styles.chatFooterRow}>
                  <Text style={styles.chatRidersText}>
                    {item.seatsTaken} of {item.totalSeats} seats filled
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Tab 3: Ride Alerts */}
      {selectedTab === 'alerts' && (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon={<AlertCircle size={40} color={colors.textDisabled} />}
                title="No active ride alerts"
                description="When no pools match your travel schedule, set an alert from the Search tab to be notified when one is created."
                actionTitle="Search pools"
                onAction={() => router.push('/modals/search')}
              />
            ) : undefined
          }
          renderItem={({ item }) => (
            <Card style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertDestinationCol}>
                  <Text style={styles.alertDestination}>{item.destinationName}</Text>
                  <View style={styles.alertTimeRow}>
                    <Calendar size={13} color={colors.textSecondary} />
                    <Text style={styles.alertTimeText}>
                      Window: {formatRideTime(item.earliestDeparture)}
                    </Text>
                  </View>
                </View>

                <Switch
                  value={item.active}
                  onValueChange={() => handleToggleAlert(item.id, item.active)}
                  trackColor={{ false: colors.border, true: '#000000' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.alertFooter}>
                <Text style={styles.alertStatusText}>
                  {item.active ? 'Alert active • Watching for new pools' : 'Alert paused'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteAlert(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color={colors.textDisabled} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  markReadText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
  segmentContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  notifCard: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifCardUnread: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  notifIconCol: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#000000',
  },
  iconCircleMuted: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  boldTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.info,
  },
  notifBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatIconCol: {
    marginRight: spacing.md,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatTime: {
    ...typography.caption,
    color: colors.textDisabled,
    fontVariant: ['tabular-nums'],
    fontSize: 11,
  },
  lastMessageSnippet: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chatFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatRidersText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDisabled,
  },
  alertCard: {
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertDestinationCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  alertDestination: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  alertTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTimeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alertStatusText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDisabled,
  },
});
