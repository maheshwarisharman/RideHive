import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  style,
}) => {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        disabled ? styles.chipDisabled : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      {icon ? <>{icon}</> : null}
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          icon ? styles.textWithIcon : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryAction,
    borderColor: colors.primaryAction,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
  },
  textUnselected: {
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.primaryActionText,
  },
  textWithIcon: {
    marginLeft: spacing.xs,
  },
});
