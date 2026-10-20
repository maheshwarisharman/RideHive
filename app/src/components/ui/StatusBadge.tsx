import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type BadgeStatus =
  | 'open'
  | 'closed'
  | 'booked'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'confirmed'
  | 'marked_paid';

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  style?: ViewStyle;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  open: {
    label: 'Open',
    bg: '#EBF9F1',
    text: colors.success,
    dot: colors.success,
  },
  closed: {
    label: 'Joining closed',
    bg: colors.surface,
    text: colors.textSecondary,
    dot: colors.textSecondary,
  },
  booked: {
    label: 'Cab booked',
    bg: '#EDF5FF',
    text: colors.info,
    dot: colors.info,
  },
  completed: {
    label: 'Completed',
    bg: '#EBF9F1',
    text: colors.success,
    dot: colors.success,
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FDF2F2',
    text: colors.error,
    dot: colors.error,
  },
  expired: {
    label: 'Expired',
    bg: colors.surface,
    text: colors.textDisabled,
    dot: colors.textDisabled,
  },
  pending: {
    label: 'Pending',
    bg: '#FFF8E6',
    text: '#B7791F',
    dot: '#B7791F',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#EBF9F1',
    text: colors.success,
    dot: colors.success,
  },
  marked_paid: {
    label: 'Marked paid',
    bg: '#EDF5FF',
    text: colors.info,
    dot: colors.info,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  style,
}) => {
  const config = statusConfig[status] || statusConfig.open;
  const displayLabel = label || config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
