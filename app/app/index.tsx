import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors, typography, spacing } from '../src/theme/tokens';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setChecking(false);
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(tabs)/home'); // Allow browsing or auth redirect
      }
    });
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RideHive</Text>
      <Text style={styles.subtitle}>BML Munjal University Campus Pooling</Text>
      {checking && <ActivityIndicator size="small" color={colors.primaryAction} style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
