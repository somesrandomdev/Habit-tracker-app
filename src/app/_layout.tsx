import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/stores/useAppStore';
import { useAchievementsStore } from '@/stores/useAchievementsStore';
import { useAppStateRefresh } from '@/hooks/useAppStateRefresh';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { AchievementModal } from '@/components/common/AchievementModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';

export default function RootLayout() {
  const ready = useAppStore((s) => s.ready);
  const initError = useAppStore((s) => s.initError);
  const bootstrap = useAppStore((s) => s.bootstrap);
  const achievementQueue = useAchievementsStore((s) => s.queue);
  const dismissAchievement = useAchievementsStore((s) => s.dismissNext);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!ready) bootstrap();
  }, [ready, bootstrap]);

  useAppStateRefresh();
  useNotifications();

  if (initError) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ErrorState message={initError} />
        <AppButton label="Retry setup" onPress={bootstrap} variant="secondary" />
        <AppText variant="caption" color="faint" style={styles.errorHint}>
          If this keeps happening, reinstalling the app resets its local storage.
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="data-management" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fast-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="challenge-rules" options={{ presentation: 'modal' }} />
        <Stack.Screen name="celebration" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="modals/check-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/wellness-log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/metrics-log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/extend-fast" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/new-challenge" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <AchievementModal achievement={achievementQueue[0] ?? null} onDismiss={dismissAchievement} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorHint: { textAlign: 'center', paddingHorizontal: 32, paddingBottom: 24 },
});
