import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
