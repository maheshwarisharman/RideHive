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
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField, Toast } from '../../src/components/ui';
import { credentialsSchema, CredentialsFormData } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { useAuthStore } from '../../src/features/auth/authStore';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: CredentialsFormData) => {
    setLoading(true);
    setToastMessage(null);

    const { error, session } = await authService.signInWithCredentials(
      data.email,
      data.password
    );
    setLoading(false);

    if (error) {
      setToastMessage(error.message || 'Authentication failed. Please verify credentials.');
      return;
    }

    if (session) {
      const profile = useAuthStore.getState().profile;
      // If user has not onboarded full name, take them to onboarding
      if (!profile?.fullName || profile.fullName === 'BMU Student') {
        router.push('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
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
            <Text style={styles.title}>BMU Student Sign In</Text>
            <Text style={styles.subtitle}>
              Sign in with your official @bmu.edu.in email. If you are new, an account will be
              created automatically with your password.
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Password"
                  placeholder="Minimum 6 characters"
                  secureTextEntry
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leadingIcon={<Lock size={18} color={colors.textSecondary} />}
                />
              )}
            />

            <Button
              title="Continue to RideHive"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.trustBanner}>
            <ShieldCheck size={18} color={colors.textSecondary} style={styles.trustIcon} />
            <Text style={styles.trustText}>
              Verified Campus Community: Only students and faculty with an active @bmu.edu.in email can access RideHive.
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing['4xl'],
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  brand: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  toast: {
    marginBottom: spacing.md,
  },
  form: {
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trustIcon: {
    marginRight: spacing.sm,
  },
  trustText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
