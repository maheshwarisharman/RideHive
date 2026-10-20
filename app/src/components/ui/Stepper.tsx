import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  style?: ViewStyle;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 1,
  max = 6,
  onChange,
  label,
  style,
}) => {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      Haptics.selectionAsync();
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      Haptics.selectionAsync();
      onChange(value + 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDecrement}
          disabled={!canDecrement}
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Decrease value"
        >
          <Minus
            size={18}
            color={canDecrement ? colors.textPrimary : colors.textDisabled}
          />
        </TouchableOpacity>

        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{value}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleIncrement}
          disabled={!canIncrement}
          style={[styles.button, !canIncrement && styles.buttonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Increase value"
        >
          <Plus
            size={18}
            color={canIncrement ? colors.textPrimary : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueBox: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    ...typography.title,
    ...typography.tabular,
    color: colors.textPrimary,
  },
});
