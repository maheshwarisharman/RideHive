import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 72,
};

const fontSizeMap = {
  sm: 11,
  md: 15,
  lg: 20,
  xl: 26,
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  // Extract initials
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
          style as any,
        ]}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        style,
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

export interface AvatarStackProps {
  members: { id: string; name: string; avatarUrl?: string | null }[];
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  members,
  max = 4,
  size = 'sm',
  style,
}) => {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  const dimension = sizeMap[size];
  const overlap = Math.round(dimension * 0.3);

  return (
    <View style={[styles.stack, style]}>
      {visible.map((member, index) => (
        <View
          key={member.id}
          style={[
            styles.stackItem,
            { marginLeft: index === 0 ? 0 : -overlap, zIndex: visible.length - index },
          ]}
        >
          <Avatar name={member.name} avatarUrl={member.avatarUrl} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.stackItem,
            styles.overflowCircle,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              marginLeft: -overlap,
              zIndex: 0,
            },
          ]}
        >
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  fallback: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackItem: {
    borderRadius: radii.full,
  },
  overflowCircle: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  overflowText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
