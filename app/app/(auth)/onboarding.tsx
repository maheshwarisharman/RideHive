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
import { useRouter } from 'expo-router';
import { User, Phone, CreditCard, Shield, ArrowRight } from 'lucide-react-native';
import { Button, TextField, Toast, Avatar, ScreenHeader } from '../../src/components/ui';
import { authService } from '../../src/features/auth/authService';
import { useAuthStore } from '../../src/features/auth/authStore';
import {
  onboardingStepOneSchema,
  onboardingStepTwoSchema,
} from '../../src/features/auth/authSchemas';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Step 2 state
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStepOneNext = () => {
    setNameError(null);
    const result = onboardingStepOneSchema.safeParse({ fullName });
    if (!result.success) {
      setNameError(result.error.issues[0]?.message || 'Please enter a valid name.');
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    setPhoneError(null);
    setUpiError(null);
    setToastMessage(null);

    const result = onboardingStepTwoSchema.safeParse({ phone, upiId });
    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path.includes('phone')) setPhoneError(issue.message);
        if (issue.path.includes('upiId')) setUpiError(issue.message);
      }
      return;
    }

    if (!user) {
      setToastMessage('Authentication session not found. Please sign in again.');
      return;
    }

    setLoading(true);
    const { error } = await authService.completeOnboarding(
      user.id,
      fullName,
      null,
      phone || null,
      upiId || null
    );
    setLoading(false);

    if (error) {
      setToastMessage(error.message || 'Failed to save profile. Please try again.');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title=""
        showBack={step === 2}
        onBack={() => setStep(1)}
        rightAction={<Text style={styles.stepIndicator}>Step {step} of 2</Text>}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {toastMessage && (
            <Toast message={toastMessage} type="error" style={styles.toast} />
          )}

          {step === 1 ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.title}>What's your name?</Text>
                <Text style={styles.subtitle}>
                  Co-riders will see this name on pools you create or join.
                </Text>
              </View>

              <View style={styles.avatarPreview}>
                <Avatar name={fullName || 'Student'} size="xl" />
              </View>

              <TextField
                label="Full Name"
                placeholder="e.g. Sharman Maheshwari"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (nameError) setNameError(null);
                }}
                error={nameError || undefined}
                leadingIcon={<User size={18} color={colors.textSecondary} />}
                autoFocus
              />

              <Button
                title="Continue"
                onPress={handleStepOneNext}
                style={styles.actionBtn}
              />
            </View>
          ) : (
            <View>
              <View style={styles.header}>
                <Text style={styles.title}>Contact & Fare details</Text>
                <Text style={styles.subtitle}>
                  Used for coordination and settling cab split amounts outside the app.
                </Text>
              </View>

              <View style={styles.privacyNote}>
                <Shield size={20} color={colors.textPrimary} style={styles.privacyIcon} />
                <Text style={styles.privacyText}>
                  Your phone and UPI ID are private. They are shared{' '}
                  <Text style={styles.boldText}>only with confirmed members of a pool you are in</Text>.
                </Text>
              </View>

              <TextField
                label="Phone number (Optional)"
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (phoneError) setPhoneError(null);
                }}
                error={phoneError || undefined}
                leadingIcon={<Phone size={18} color={colors.textSecondary} />}
                helperText="For pickup calls and WhatsApp coordination"
              />

              <TextField
                label="UPI ID (Optional)"
                placeholder="username@okhdfcbank"
                autoCapitalize="none"
                autoCorrect={false}
                value={upiId}
                onChangeText={(val) => {
                  setUpiId(val);
                  if (upiError) setUpiError(null);
                }}
                error={upiError || undefined}
                leadingIcon={<CreditCard size={18} color={colors.textSecondary} />}
                helperText="Enables riders to pay you directly via UPI when you host"
              />

              <Button
                title="Complete setup"
                onPress={handleComplete}
                loading={loading}
                style={styles.actionBtn}
              />
            </View>
          )}
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
  stepIndicator: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
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
  avatarPreview: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  actionBtn: {
    marginTop: spacing.xl,
  },
  toast: {
    marginBottom: spacing.lg,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  privacyIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  privacyText: {
    ...typography.captionRegular,
    color: colors.textSecondary,
    flex: 1,
  },
  boldText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
