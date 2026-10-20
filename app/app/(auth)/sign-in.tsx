import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField, Toast } from '../../src/components/ui';
import { emailSchema, EmailFormData } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true);
    setToastMessage(null);

    const { error } = await authService.sendOtp(data.email);
    setLoading(false);

    if (error) {
      setToastMessage(error.message || 'Failed to send OTP code. Please try again.');
    } else {
      router.push('/(auth)/verify-otp');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>RideHive</Text>
            <Text style={styles.title}>Enter university email</Text>
            <Text style={styles.subtitle}>
              We will send a 6-digit verification code to your official @bmu.edu.in address.
            </Text>
          </View>

          {toastMessage && (
            <Toast message={toastMessage} type="error" style={styles.toast} />
          )}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="BMU Email Address"
                  placeholder="firstname.lastname@bmu.edu.in"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  leadingIcon={<Mail size={18} color={colors.textSecondary} />}
                />
              )}
            />

            <Button
              title="Send verification code"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.trustBanner}>
            <ShieldCheck size={18} color={colors.textSecondary} style={styles.trustIcon} />
            <Text style={styles.trustText}>
              Campus-only network. Only students and staff with an active @bmu.edu.in email can access RideHive.
            </Text>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  brand: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  toast: {
    marginBottom: spacing.lg,
  },
  form: {
    marginBottom: spacing.xl,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  trustText: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    flex: 1,
  },
});
