import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, MapPin, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card, Button, StatusBadge, SeatIndicator, ListRow } from '../../src/components/ui';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
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

        {/* Popular Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular destinations</Text>
          <Card style={styles.listCard} variant="outlined">
            <ListRow
              title="IGI Airport Terminal 3"
              subtitle="International & Domestic"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => router.push('/modals/search')}
            />
            <ListRow
              title="Millennium City Centre Metro"
              subtitle="Yellow Line · Gurugram"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => router.push('/modals/search')}
            />
            <ListRow
              title="New Delhi Railway Station"
              subtitle="Paharganj / Ajmeri Gate"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => router.push('/modals/search')}
            />
            <ListRow
              title="DLF Cyber Hub"
              subtitle="Cyber City, Gurugram"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => router.push('/modals/search')}
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
