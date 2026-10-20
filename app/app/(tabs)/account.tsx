import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  CreditCard,
  Bell,
  Bookmark,
  Shield,
  LogOut,
  Trash2,
  Code2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Avatar, Card, ListRow } from '../../src/components/ui';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

export default function AccountScreen() {
  const router = useRouter();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard} variant="outlined">
          <View style={styles.profileRow}>
            <Avatar name="BMU Student" size="lg" />
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>BMU Student</Text>
              <Text style={styles.profileEmail}>student@bmu.edu.in</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>0 rides completed · ★ 5.0</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Payment & Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Coordination</Text>
          <Card style={styles.cardGroup} variant="outlined">
            <ListRow
              title="Phone number"
              subtitle="Visible only to confirmed pool co-members"
              leading={<Phone size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
            <ListRow
              title="UPI ID"
              subtitle="For receiving fare splits when you host"
              leading={<CreditCard size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
            <ListRow
              title="Saved ride alerts"
              subtitle="Notify when matching pools are created"
              leading={<Bookmark size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card style={styles.cardGroup} variant="outlined">
            <ListRow
              title="Notifications"
              subtitle="Push alerts, ride reminders, and chat"
              leading={<Bell size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
            <ListRow
              title="Safety & blocked users"
              subtitle="Manage reports and blocked riders"
              leading={<Shield size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
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
            onPress={() => {}}
            accessibilityRole="button"
          >
            <Trash2 size={20} color={colors.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.dangerText]}>Delete account</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: spacing.xs,
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
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
});
