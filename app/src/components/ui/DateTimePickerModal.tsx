import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { format, addMinutes, addHours, setHours, setMinutes, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Button } from './Button';
import { Chip } from './Chip';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const TIME_ZONE = 'Asia/Kolkata';

export interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onChange: (date: Date) => void;
  title?: string;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onClose,
  value,
  onChange,
  title = 'When are you leaving?',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(value);

  // Quick preset helper
  const handlePreset = (minutesFromNow: number) => {
    const newDate = addMinutes(new Date(), minutesFromNow);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    onClose();
  };

  // Day options: Today, Tomorrow, Day after
  const now = new Date();
  const dayOptions = [
    { label: 'Today', date: now },
    { label: 'Tomorrow', date: addHours(now, 24) },
    { label: format(addHours(now, 48), 'EEE, d MMM'), date: addHours(now, 48) },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {/* Quick presets */}
          <Text style={styles.sectionTitle}>Quick options</Text>
          <View style={styles.chipsRow}>
            <Chip
              label="Leave in 15 min"
              onPress={() => handlePreset(15)}
            />
            <Chip
              label="Leave in 30 min"
              onPress={() => handlePreset(30)}
            />
            <Chip
              label="Leave in 1 hour"
              onPress={() => handlePreset(60)}
            />
          </View>

          {/* Day selection */}
          <Text style={styles.sectionTitle}>Day</Text>
          <View style={styles.chipsRow}>
            {dayOptions.map((opt, idx) => {
              const isSelected = isSameDay(selectedDate, opt.date);
              return (
                <Chip
                  key={idx}
                  label={opt.label}
                  selected={isSelected}
                  onPress={() => {
                    const updated = new Date(opt.date);
                    updated.setHours(selectedDate.getHours());
                    updated.setMinutes(selectedDate.getMinutes());
                    setSelectedDate(updated);
                  }}
                />
              );
            })}
          </View>

          {/* Time display & adjustments */}
          <Text style={styles.sectionTitle}>Selected Time</Text>
          <View style={styles.timeDisplayCard}>
            <Text style={styles.timeText}>
              {format(toZonedTime(selectedDate, TIME_ZONE), 'EEEE, d MMM · h:mm a')}
            </Text>
          </View>

          {/* Adjustment buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity
              onPress={() => setSelectedDate(addMinutes(selectedDate, -15))}
              style={styles.adjustButton}
            >
              <Text style={styles.adjustText}>- 15 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedDate(addMinutes(selectedDate, 15))}
              style={styles.adjustButton}
            >
              <Text style={styles.adjustText}>+ 15 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedDate(addHours(selectedDate, 1))}
              style={styles.adjustButton}
            >
              <Text style={styles.adjustText}>+ 1 hr</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.footerBtn}
            />
            <Button
              title="Confirm"
              variant="primary"
              onPress={handleConfirm}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeDisplayCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  timeText: {
    ...typography.heading,
    ...typography.tabular,
    color: colors.textPrimary,
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  adjustButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  adjustText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
