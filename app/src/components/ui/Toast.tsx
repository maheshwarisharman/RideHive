import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastProps {
  message: string;
  type?: ToastType;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  style,
}) => {
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color={colors.white} />;
      case 'error':
        return <AlertCircle size={16} color={colors.white} />;
      default:
        return <Info size={16} color={colors.white} />;
    }
  };

  return (
    <View style={[styles.container, styles[type], style]}>
      <View style={styles.icon}>{renderIcon()}</View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primaryAction,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  info: {
    backgroundColor: colors.primaryAction,
  },
  success: {
    backgroundColor: colors.success,
  },
  error: {
    backgroundColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.white,
    flex: 1,
    fontSize: 14,
  },
});
