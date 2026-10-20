import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
  Send,
  User,
  CreditCard,
} from 'lucide-react-native';
import {
  Button,
  TextField,
  OtpInput,
  Chip,
  SegmentedControl,
  ListRow,
  Avatar,
  AvatarStack,
  SeatIndicator,
  StatusBadge,
  Card,
  Skeleton,
  EmptyState,
  ErrorState,
  Toast,
  ScreenHeader,
  Stepper,
  DateTimePickerModal,
} from '../src/components/ui';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

export default function DevShowcaseScreen() {
  const [text, setText] = useState('');
  const [otp, setOtp] = useState('123');
  const [selectedChip, setSelectedChip] = useState('Option 1');
  const [segment, setSegment] = useState<'A' | 'B' | 'C'>('A');
  const [seatCount, setSeatCount] = useState(4);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader title="Design System Showcase" showBack subtitle="All UI primitives & states" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TOKENS OVERVIEW */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Color Tokens</Text>
          <View style={styles.tokenRow}>
            {[
              { label: 'Primary', color: colors.primaryAction },
              { label: 'Surface', color: colors.surface },
              { label: 'Border', color: colors.border },
              { label: 'Info', color: colors.info },
              { label: 'Success', color: colors.success },
              { label: 'Warning', color: colors.warning },
              { label: 'Error', color: colors.error },
            ].map((t) => (
              <View key={t.label} style={styles.colorSwatch}>
                <View
                  style={[
                    styles.swatchCircle,
                    { backgroundColor: t.color },
                    t.color === colors.surface
                      ? styles.swatchBorder
                      : null,
                  ]}
                />
                <Text style={styles.swatchLabel}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Buttons</Text>
          <View style={styles.itemRow}>
            <Button title="Primary Action" onPress={() => {}} style={styles.btnMargin} />
            <Button
              title="With Icon"
              icon={<Plus size={18} color={colors.white} />}
              onPress={() => {}}
              style={styles.btnMargin}
            />
            <Button title="Secondary" variant="secondary" onPress={() => {}} style={styles.btnMargin} />
            <Button title="Destructive" variant="destructive" onPress={() => {}} style={styles.btnMargin} />
            <Button title="Ghost Action" variant="ghost" onPress={() => {}} style={styles.btnMargin} />
            <Button title="Loading Button" loading onPress={() => {}} style={styles.btnMargin} />
            <Button title="Disabled Button" disabled onPress={() => {}} style={styles.btnMargin} />
          </View>
        </View>

        {/* TEXT INPUTS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TextFields</Text>
          <TextField
            label="Full Name"
            placeholder="e.g. Sharman Maheshwari"
            value={text}
            onChangeText={setText}
            leadingIcon={<User size={18} color={colors.textSecondary} />}
          />
          <TextField
            label="UPI ID"
            placeholder="username@okhdfcbank"
            helperText="Shared only with confirmed pool co-members"
            leadingIcon={<CreditCard size={18} color={colors.textSecondary} />}
          />
          <TextField
            label="Email with Error"
            placeholder="student@gmail.com"
            error="Only @bmu.edu.in emails are allowed."
          />
        </View>

        {/* OTP INPUT */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>OTP Input (6 Digits)</Text>
          <OtpInput value={otp} onChange={setOtp} />
        </View>

        {/* CHIPS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Chips</Text>
          <View style={styles.chipsRow}>
            {['Option 1', 'Option 2', 'Option 3'].map((item) => (
              <Chip
                key={item}
                label={item}
                selected={selectedChip === item}
                onPress={() => setSelectedChip(item)}
              />
            ))}
          </View>
        </View>

        {/* SEGMENTED CONTROL */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Segmented Control</Text>
          <SegmentedControl
            options={[
              { value: 'A', label: 'Upcoming', badge: 2 },
              { value: 'B', label: 'Hosting', badge: 1 },
              { value: 'C', label: 'Past' },
            ]}
            value={segment}
            onChange={(val) => setSegment(val)}
          />
        </View>

        {/* SEAT INDICATOR & STEPPER */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Seats & Stepper</Text>
          <Card variant="flat" style={styles.subCard}>
            <View style={styles.seatRow}>
              <Text style={styles.cardLabel}>Available:</Text>
              <SeatIndicator totalSeats={4} seatsTaken={2} />
            </View>
            <View style={styles.seatRow}>
              <Text style={styles.cardLabel}>Full Pool:</Text>
              <SeatIndicator totalSeats={4} seatsTaken={4} />
            </View>
            <View style={styles.divider} />
            <Stepper
              label="Seats to offer (including you)"
              value={seatCount}
              min={3}
              max={6}
              onChange={setSeatCount}
            />
          </Card>
        </View>

        {/* AVATARS & AVATAR STACK */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Avatars & Stacks</Text>
          <View style={styles.avatarRow}>
            <Avatar name="Sharman Maheshwari" size="sm" />
            <Avatar name="Aarav Sharma" size="md" />
            <Avatar name="Priya Patel" size="lg" />
            <AvatarStack
              members={[
                { id: '1', name: 'Rohan Verma' },
                { id: '2', name: 'Simran Kaur' },
                { id: '3', name: 'Ananya Roy' },
                { id: '4', name: 'Dev Gupta' },
                { id: '5', name: 'Kavita Joshi' },
              ]}
              max={3}
              size="md"
            />
          </View>
        </View>

        {/* STATUS BADGES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Status Badges</Text>
          <View style={styles.badgeWrap}>
            <StatusBadge status="open" style={styles.badgeMargin} />
            <StatusBadge status="closed" style={styles.badgeMargin} />
            <StatusBadge status="booked" style={styles.badgeMargin} />
            <StatusBadge status="completed" style={styles.badgeMargin} />
            <StatusBadge status="pending" style={styles.badgeMargin} />
            <StatusBadge status="confirmed" style={styles.badgeMargin} />
            <StatusBadge status="cancelled" style={styles.badgeMargin} />
          </View>
        </View>

        {/* LIST ROWS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>List Rows</Text>
          <Card variant="outlined" style={styles.listCard}>
            <ListRow
              title="IGI Airport Terminal 3"
              subtitle="Domestic and International"
              leading={<MapPin size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
            <ListRow
              title="Ride Departure"
              subtitle="Today, 6:30 PM · 2 seats left"
              leading={<Calendar size={20} color={colors.textSecondary} />}
              showChevron
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* SKELETON LOADERS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Skeleton Placeholders</Text>
          <Card variant="flat" style={styles.subCard}>
            <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={12} borderRadius={4} />
          </Card>
        </View>

        {/* TOASTS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Toast Messages</Text>
          <Toast message="Joined pool successfully! You can now chat." type="success" style={styles.toastMargin} />
          <Toast message="Payment marked as paid. Waiting for host confirmation." type="info" style={styles.toastMargin} />
          <Toast message="Pool is full. You were not charged." type="error" style={styles.toastMargin} />
        </View>

        {/* DATE TIME PICKER MODAL TRIGGER */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Date & Time Modal</Text>
          <Button
            title="Open Date & Time Picker"
            variant="secondary"
            onPress={() => setPickerVisible(true)}
          />
          <DateTimePickerModal
            visible={pickerVisible}
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            onClose={() => setPickerVisible(false)}
          />
        </View>

        {/* EMPTY & ERROR STATES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Empty & Error States</Text>
          <Card variant="outlined">
            <EmptyState
              icon={<Car size={32} color={colors.textDisabled} />}
              title="No rides found"
              description="Be the first to create a pool to this destination."
              actionTitle="Create pool"
              onAction={() => {}}
            />
          </Card>
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <ErrorState
              message="Network request timed out. Please check your connection."
              onRetry={() => {}}
            />
          </Card>
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
    paddingBottom: spacing['5xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  tokenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    alignItems: 'center',
    width: 60,
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    marginBottom: 4,
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchLabel: {
    ...typography.captionRegular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'column',
  },
  btnMargin: {
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCard: {
    padding: spacing.md,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 80,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeMargin: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  toastMargin: {
    marginBottom: spacing.sm,
  },
});
