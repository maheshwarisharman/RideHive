/**
 * RideHive Design Tokens
 * Strictly adheres to Uber Rider aesthetic: restrained, monochromatic, light-theme only.
 * No gradients, no emojis, no glassmorphism.
 */

export const colors = {
  background: '#FFFFFF',
  surface: '#F6F6F6',
  border: '#E8E8E8',
  divider: '#E8E8E8',
  textPrimary: '#000000',
  textSecondary: '#5E5E5E',
  textDisabled: '#A6A6A6',
  primaryAction: '#000000',
  primaryActionText: '#FFFFFF',
  info: '#276EF1',
  success: '#05944F',
  warning: '#FFC043',
  error: '#E11900',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radii = {
  sm: 8, // Inputs, chips
  md: 12, // Cards, buttons
  lg: 16, // Bottom sheets, modals
  full: 9999, // Circular avatars & status dots
} as const;

export const typography = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600' as const,
  },
  heading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  captionRegular: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  tabular: {
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
} as const;

export const motion = {
  durationFast: 150,
  durationNormal: 200,
  durationSlow: 250,
} as const;
