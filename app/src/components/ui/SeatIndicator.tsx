import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export interface SeatIndicatorProps {
  totalSeats: number;
  seatsTaken: number;
  showText?: boolean;
  style?: ViewStyle;
}

export const SeatIndicator: React.FC<SeatIndicatorProps> = ({
  totalSeats,
  seatsTaken,
  showText = true,
  style,
}) => {
  const seatsLeft = Math.max(0, totalSeats - seatsTaken);
  const isFull = seatsLeft === 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSeats }).map((_, index) => {
          const isOccupied = index < seatsTaken;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isOccupied ? styles.dotOccupied : styles.dotEmpty,
              ]}
            />
          );
        })}
      </View>
      {showText ? (
        <Text
          style={[
            styles.text,
            isFull ? styles.textFull : styles.textAvailable,
          ]}
        >
          {isFull ? 'Full' : `${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginRight: 4,
  },
  dotOccupied: {
    backgroundColor: colors.primaryAction,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
  text: {
    ...typography.caption,
    ...typography.tabular,
    fontWeight: '500',
  },
  textAvailable: {
    color: colors.textSecondary,
  },
  textFull: {
    color: colors.error,
    fontWeight: '600',
  },
});
