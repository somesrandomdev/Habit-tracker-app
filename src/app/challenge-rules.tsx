import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useAppStore } from '@/stores/useAppStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { getTipOfDay, getCopingStrategy } from '@/services/content.service';
import { addDaysToKey, formatKeyFriendly, todayKey } from '@/utils/dates';

export default function ChallengeRulesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const state = useChallengeStore((s) => s.state);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const challenge = state?.challenge ?? null;

  if (!challenge) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 100 }]}>
        <EmptyState emoji="🔍" title="No challenge found" message="Start a challenge first to see its rules." actionLabel="Back" onAction={() => router.back()} />
      </View>
    );
  }

  const today = todayKey();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <AppHeader
        title={challenge.title}
        subtitle={`${formatKeyFriendly(challenge.start_date)} → ${formatKeyFriendly(challenge.end_date)}`}
        showBack
      />

      <AppCard>
        <AppText variant="label" color="dim">
          YOUR RULES
        </AppText>
        <AppText style={styles.rules}>{challenge.rules_text || 'No custom rules were set for this challenge.'}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="label" color="dim">
          HOW CHECK-INS WORK
        </AppText>
        <View style={styles.list}>
          <AppText variant="caption">✅ Success — you fully followed the rules today.</AppText>
          <AppText variant="caption">💪 Cravings only — stayed on track despite cravings.</AppText>
          <AppText variant="caption">😳 Slip — a minor off-plan moment. Resets the streak, not the challenge.</AppText>
          <AppText variant="caption">🌧️ Fail — a major off-plan day. Same: streak resets, challenge continues.</AppText>
        </View>
        <AppText variant="caption" color="dim" style={styles.recoveryNote}>
          One check-in per day. You can edit today’s check-in until midnight.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="label" color="dim">
          TODAY’S SUGAR TIP
        </AppText>
        <AppText style={styles.tip}>{getTipOfDay('sugar', today)}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="label" color="dim">
          WHEN A CRAVING HITS
        </AppText>
        <AppText style={styles.tip}>{getCopingStrategy(today)}</AppText>
        <AppText variant="label" color="faint" style={styles.recoveryNote}>
          New strategy every day. Tomorrow: {getTipOfDay('sugar', addDaysToKey(today, 1)).slice(0, 60)}…
        </AppText>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  rules: { marginTop: 6, lineHeight: 22 },
  list: { gap: 6, marginTop: 6 },
  recoveryNote: { marginTop: spacing.md },
  tip: { marginTop: 6, lineHeight: 21 },
});
