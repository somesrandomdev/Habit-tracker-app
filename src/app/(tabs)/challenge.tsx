import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/useAppStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useChallengeProgress } from '@/hooks/useChallengeProgress';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CalendarMonthView } from '@/components/ui/CalendarMonthView';
import { getRecoveryMessage } from '@/services/content.service';
import { shouldCelebrateCompletion, markChallengeCelebrated } from '@/services/challenge.service';
import { recoveryInfo } from '@/services/achievements.service';
import { todayKey } from '@/utils/dates';
import type { CheckInStatus } from '@/types/models';

const DAY_COLORS: Record<CheckInStatus, string> = {
  success: '#15803D',
  craving_only: '#0E7490',
  slip: '#B45309',
  fail: '#B91C1C',
};

export default function ChallengeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const store = useChallengeStore();
  const { challenge, stats } = useChallengeProgress();
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  useFocusEffect(
    useCallback(() => {
      store.hydrate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // One-shot celebration when a challenge completes (even while the app was closed).
  useEffect(() => {
    if (challenge?.status === 'completed' && shouldCelebrateCompletion(challenge.id)) {
      markChallengeCelebrated(challenge.id);
      router.push('/celebration?type=challenge');
    }
  }, [challenge?.id, challenge?.status, router]);

  const recovery = useMemo(() => {
    const state = store.state;
    if (!state || !stats) return null;
    const info = recoveryInfo(state);
    if (info.daysSince !== 0) return null; // show recovery messaging on the setback day itself
    const lastStatus = state.checkins.at(-1)?.status;
    if (lastStatus === 'slip' || lastStatus === 'fail') {
      return getRecoveryMessage(lastStatus, todayKey());
    }
    return null;
  }, [stats, store.state]);

  const dayMark = useCallback(
    (dateKey: string) => {
      const state = store.state;
      const active = state?.challenge;
      if (!state || !active) return null;
      if (dateKey < active.start_date || dateKey > active.end_date) return null;
      const checkin = state.checkins.find((c) => c.local_date === dateKey);
      if (checkin) return { color: DAY_COLORS[checkin.status], label: String(Number(dateKey.slice(-2))) };
      if (dateKey < todayKey()) return { color: colors.border, label: String(Number(dateKey.slice(-2))) };
      return null;
    },
    [store.state, colors],
  );

  if (!challenge || !stats) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: 96 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} tintColor={colors.primary} />}
      >
        <AppHeader title="No-Sugar Challenge" />
        <EmptyState
          emoji="🍬"
          title="No challenge running"
          message="Pick a rule set and a duration, then check in daily. Slips never erase your progress."
          actionLabel="Start a challenge"
          onAction={() => router.push('/modals/new-challenge')}
        />
        <AppCard style={styles.infoCard}>
          <AppText variant="caption" color="dim">
            💚 How it works: check in once a day. “Success” and “craving only” extend your streak. A
            slip or fail resets the streak — but never the challenge itself.
          </AppText>
        </AppCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} tintColor={colors.primary} />}
    >
      <AppHeader
        title={challenge.title}
        subtitle={`Day ${stats.dayNumber} of ${stats.totalDays}`}
        right={
          <AppText color="primary" weight="medium" onPress={() => router.push('/challenge-rules')} suppressHighlighting>
            Rules
          </AppText>
        }
      />

      <AppCard>
        <View style={styles.ringRow}>
          <ProgressRing ratio={stats.dayNumber / stats.totalDays} size={170} strokeWidth={13} color={colors.accent}>
            <View style={styles.ringCenter}>
              <AppText style={styles.dayNumber}>{stats.dayNumber}</AppText>
              <AppText variant="label" color="dim">
                of {stats.totalDays} days
              </AppText>
            </View>
          </ProgressRing>
          <View style={styles.sideMeta}>
            <AppText weight="semibold">
              {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}-day streak` : 'Streak: 0 days'}
            </AppText>
            <AppText variant="caption" color="dim">
              Longest: {stats.longestStreak} days
            </AppText>
            <AppText variant="caption" color="dim">
              {Math.round(stats.completionRate * 100)}% on track
            </AppText>
            {challenge.status !== 'active' ? (
              <Badge label={challenge.status === 'completed' ? 'Completed 🎉' : 'Abandoned'} tone={challenge.status === 'completed' ? 'success' : 'danger'} />
            ) : null}
          </View>
        </View>

        {challenge.status === 'active' ? (
          <View style={styles.ctaRow}>
            {stats.todayCheckIn ? (
              <>
                <Badge
                  label={
                    stats.todayCheckIn.status === 'success'
                      ? 'On track today ✅'
                      : stats.todayCheckIn.status === 'craving_only'
                        ? 'Cravings, but on track 💪'
                        : stats.todayCheckIn.status === 'slip'
                          ? 'Slip logged today'
                          : 'Fail logged today'
                  }
                  tone={stats.todayCheckIn.status === 'slip' || stats.todayCheckIn.status === 'fail' ? 'warning' : 'success'}
                />
                <AppButton label="Update check-in" variant="secondary" onPress={() => router.push('/modals/check-in')} />
              </>
            ) : (
              <AppButton label="Check in for today" onPress={() => router.push('/modals/check-in')} style={styles.fullButton} />
            )}
          </View>
        ) : (
          <AppButton label="Start a new challenge" onPress={() => router.push('/modals/new-challenge')} style={styles.fullButton} />
        )}
      </AppCard>

      {recovery ? (
        <AppCard style={[styles.recoveryCard, { backgroundColor: colors.successSoft }]}>
          <AppText weight="semibold" color="success">
            💚 Recovery mode
          </AppText>
          <AppText variant="caption" color="text">
            {recovery}
          </AppText>
        </AppCard>
      ) : null}

      <SectionTitle title="Challenge Calendar" />
      <AppCard>
        <CalendarMonthView dayMark={dayMark} initialMonth={challenge.start_date} compact />
        <View style={styles.legendRow}>
          <Legend color={DAY_COLORS.success} label="success" />
          <Legend color={DAY_COLORS.craving_only} label="craving" />
          <Legend color={DAY_COLORS.slip} label="slip" />
          <Legend color={DAY_COLORS.fail} label="fail" />
        </View>
      </AppCard>

      <SectionTitle title="Progress" />
      <View style={styles.statsRow}>
        <StatCard flex emoji="✅" label="success days" value={String(stats.successDays)} />
        <StatCard flex emoji="💪" label="craving days" value={String(stats.cravingDays)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard flex emoji="😳" label="slips" value={String(stats.slips)} />
        <StatCard flex emoji="🌧️" label="fails" value={String(stats.fails)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard flex emoji="🎯" label="on-track rate" value={`${Math.round(stats.completionRate * 100)}%`} sub={`${stats.missedDays} missed`} />
      </View>

      {challenge.status === 'active' ? (
        <AppButton label="Abandon challenge" variant="ghost" onPress={() => setConfirmAbandon(true)} style={styles.abandonButton} />
      ) : null}

      <ConfirmDialog
        visible={confirmAbandon}
        title="Abandon this challenge?"
        message="Your check-ins and history stay saved, but this challenge will be marked abandoned. You can start a new one anytime."
        confirmLabel="Abandon"
        danger
        onConfirm={() => {
          store.abandon();
          setConfirmAbandon(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }}
        onCancel={() => setConfirmAbandon(false)}
      />
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="label" color="faint">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringCenter: { alignItems: 'center' },
  dayNumber: { fontSize: 44, fontWeight: '800' },
  sideMeta: { flex: 1, gap: 6 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg },
  fullButton: { marginTop: spacing.lg },
  recoveryCard: { gap: 6 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  abandonButton: { marginTop: spacing.sm },
  infoCard: { marginTop: spacing.md },
});
