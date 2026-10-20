import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, OtpInput, Toast, ScreenHeader } from '../../src/components/ui';
import { authService } from '../../src/features/auth/authService';
import { useAuthStore } from '../../src/features/auth/authStore';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  // 30-second countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setToastMessage('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setToastMessage(null);

    const { error, session } = await authService.verifyOtp(pendingEmail, code);
    setLoading(false);

    if (error) {
      setToastMessage(error.message || 'Invalid or expired verification code.');
    } else if (session) {
      const profile = useAuthStore.getState().profile;
      // If user hasn't set their full name yet, go to onboarding
      if (!profile || !profile.fullName || profile.fullName.includes('@')) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setToastMessage(null);
    const { error } = await authService.sendOtp(pendingEmail);
    if (error) {
      setToastMessage(error.message || 'Failed to resend code.');
    } else {
      setResendCooldown(30);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Enter 6-digit code</Text>
            <Text style={styles.subtitle}>
              Sent to{' '}
              <Text style={styles.emailHighlight}>{pendingEmail || 'your email'}</Text>
            </Text>
          </View>

          {toastMessage && (
            <Toast message={toastMessage} type="error" style={styles.toast} />
          )}

          <OtpInput value={code} onChange={setCode} />

          <Button
            title="Verify & continue"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length !== 6}
            style={styles.verifyBtn}
          />

          <View style={styles.resendRow}>
            {resendCooldown > 0 ? (
              <Text style={styles.cooldownText}>
                Resend code in {resendCooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emailHighlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toast: {
    marginBottom: spacing.lg,
  },
  verifyBtn: {
    marginTop: spacing.xl,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  cooldownText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  resendText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
