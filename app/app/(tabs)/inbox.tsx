import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MessageSquare } from 'lucide-react-native';
import { SegmentedControl, EmptyState, ListRow, Avatar } from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme/tokens';

type InboxTab = 'notifications' | 'messages';

export default function InboxScreen() {
  const [selectedTab, setSelectedTab] = useState<InboxTab>('notifications');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const tabs: { value: InboxTab; label: string; badge?: number }[] = [
    { value: 'notifications', label: 'Notifications', badge: 0 },
    { value: 'messages', label: 'Pool Chats', badge: 0 },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
      </View>

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
        {selectedTab === 'notifications' ? (
          <EmptyState
            icon={<Bell size={40} color={colors.textDisabled} />}
            title="No notifications"
            description="Ride alerts, join requests, and fare updates will appear here."
          />
        ) : (
          <EmptyState
            icon={<MessageSquare size={40} color={colors.textDisabled} />}
            title="No pool chats"
            description="When you join or host a pool, your group chat will appear here."
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
