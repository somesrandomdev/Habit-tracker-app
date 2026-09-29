import { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/useAppStore';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { useChallengeProgress } from '@/hooks/useChallengeProgress';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useStreaks } from '@/hooks/useStreaks';
import { useDailyLog } from '@/hooks/useDailyLog';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppChip } from '@/components/ui/AppChip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ListItem } from '@/components/ui/ListItem';
import { TodayFastingCard } from '@/components/fasting/TodayFastingCard';
import { getDailyQuote } from '@/services/content.service';
import { formatKeyFriendly, todayKey } from '@/utils/dates';
import type { CheckInStatus } from '@/types/models';

const CHECKIN_LABELS: Record<CheckInStatus, string> = {
  success: 'On track ✅',
  craving_only: 'Cravings, but on track 💪',
  slip: 'Slip — recovery mode 💚',
  fail: 'Tough day — fresh start 🌅',
};

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const profile = useAppStore((s) => s.profile);
  const toggleCompletion = useHabitsStore((s) => s.toggleCompletion);
  const challenge = useChallengeProgress();
  const todayHabits = useTodayHabits();
  const streaks = useStreaks();
  const todayLog = useDailyLog();

  const quote = useMemo(() => getDailyQuote(todayKey()), []);
  const onRefresh = useCallback(() => refreshAll(), [refreshAll]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppHeader
        title={`Hi${profile?.name ? `, ${profile.name}` : ''} 👋`}
        subtitle={formatKeyFriendly(todayKey())}
        right={
          <AppText color="primary" weight="medium" onPress={() => router.push('/settings')} suppressHighlighting>
            Settings
          </AppText>
        }
      />

      {/* A. Fasting */}
      <SectionTitle title="Fasting" actionLabel="Details" onAction={() => router.push('/(tabs)/fasting')} />
      <TodayFastingCard />

      {/* B. Sugar challenge */}
      <SectionTitle title="No-Sugar Challenge" actionLabel="Open" onAction={() => router.push('/(tabs)/challenge')} />
      {challenge.challenge && challenge.stats ? (
        <AppCard onPress={() => router.push('/(tabs)/challenge')}>
          <View style={styles.challengeRow}>
            <View style={styles.textBlock}>
              <AppText weight="semibold">
                Day {challenge.stats.dayNumber} of {challenge.stats.totalDays}
              </AppText>
              <AppText variant="caption" color="dim">
                {challenge.challenge.title}
              </AppText>
            </View>
            {challenge.stats.todayCheckIn ? (
              <Badge
                label={CHECKIN_LABELS[challenge.stats.todayCheckIn.status]}
                tone={challenge.stats.todayCheckIn.status === 'slip' || challenge.stats.todayCheckIn.status === 'fail' ? 'warning' : 'success'}
              />
            ) : (
              <Badge label="Not checked in" />
            )}
          </View>
          <View style={styles.streakRow}>
            <AppText weight="semibold" color={challenge.stats.currentStreak > 0 ? 'text' : 'faint'}>
              {challenge.stats.currentStreak > 0 ? `🔥 ${challenge.stats.currentStreak}-day sugar streak` : 'Streak: 0 days'}
            </AppText>
            <AppButton
              label={challenge.stats.todayCheckIn ? 'Update' : 'Check in now'}
              variant="secondary"
              onPress={() => router.push('/modals/check-in')}
            />
          </View>
        </AppCard>
      ) : (
        <EmptyState
          emoji="🍬"
          title="No challenge running"
          message="Start a no-sugar challenge and build momentum one day at a time."
          actionLabel="Start a challenge"
          onAction={() => router.push('/modals/new-challenge')}
        />
      )}

      {/* C. Habits */}
      <SectionTitle title="Habits" actionLabel="Manage" onAction={() => router.push('/(tabs)/habits')} />
      <AppCard>
        {todayHabits.scheduledCount > 0 ? (
          <>
            <AppText variant="caption" color="dim" style={styles.habitHeader}>
              {todayHabits.completedCount} of {todayHabits.scheduledCount} done today
            </AppText>
            <ProgressBar ratio={todayHabits.completedCount / todayHabits.scheduledCount} />
            <View style={styles.habitList}>
              {todayHabits.rows.map(({ habit, completion }) => (
                <ListItem
                  key={habit.id}
                  emoji={habit.emoji}
                  title={habit.title}
                  subtitle={
                    completion
                      ? completion.status === 'completed'
                        ? 'Completed'
                        : completion.status === 'skipped'
                          ? 'Skipped'
                          : 'Missed'
                      : 'Not done yet'
                  }
                  onPress={() => router.push(`/habit-detail?id=${habit.id}`)}
                  right={
                    <AppChip
                      label={completion?.status === 'completed' ? '✓ Done' : 'Mark done'}
                      selected={completion?.status === 'completed'}
                      tone={completion?.status === 'completed' ? 'success' : 'default'}
                      onPress={() => {
                        toggleCompletion(habit.id);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    />
                  }
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            emoji="🌤️"
            title="No habits scheduled today"
            message="Enjoy the rest day, or add a habit that fits your week."
            actionLabel="Add a habit"
            onAction={() => router.push('/habit-form')}
          />
        )}
      </AppCard>

      {/* D. Daily wellness quick log */}
      <SectionTitle title="Daily Log" actionLabel="Edit" onAction={() => router.push('/modals/wellness-log')} />
      <AppCard onPress={() => router.push('/modals/wellness-log')}>
        {todayLog ? (
          <View style={styles.logRow}>
            <LogPill emoji="😊" value={todayLog.mood !== null ? `${todayLog.mood}/5` : '—'} label="mood" />
            <LogPill emoji="🔋" value={todayLog.energy !== null ? `${todayLog.energy}/5` : '—'} label="energy" />
            <LogPill emoji="🍽️" value={todayLog.hunger !== null ? `${todayLog.hunger}/5` : '—'} label="hunger" />
            <LogPill emoji="💧" value={`${todayLog.water_cups}`} label="cups" />
            <LogPill emoji="🍬" value={`${todayLog.craving_intensity}/10`} label="craving" />
          </View>
        ) : (
          <View style={styles.textBlock}>
            <AppText weight="medium">How is today going?</AppText>
            <AppText variant="caption" color="dim">
              Log mood, energy, hunger, water, and cravings in under a minute.
            </AppText>
          </View>
        )}
      </AppCard>

      {/* E. Streak overview */}
      <SectionTitle title="Streaks" />
      <View style={styles.statsRow}>
        <StatCard flex emoji="⏱️" label="fasting" value={`${streaks?.fasting.current ?? 0}d`} sub={`best ${streaks?.fasting.longest ?? 0}d`} />
        <StatCard
          flex
          emoji="🍬"
          label="sugar-free"
          value={streaks?.sugar ? `${streaks.sugar.current}d` : '—'}
          sub={streaks?.sugar ? `best ${streaks.sugar.longest}d` : 'no challenge'}
        />
        <StatCard flex emoji="✅" label="best habit" value={`${streaks?.habits.current ?? 0}d`} sub={streaks?.habits.habit?.title ?? 'no habits'} />
      </View>

      {/* F. Motivation */}
      <SectionTitle title="Daily Motivation" />
      <AppCard>
        <AppText style={styles.quoteText}>“{quote.text}”</AppText>
        <AppText variant="caption" color="dim" align="right">
          — {quote.author}
        </AppText>
      </AppCard>
    </ScrollView>
  );
}

function LogPill({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.logPill, { backgroundColor: colors.surfaceAlt }]}>
      <AppText>{emoji}</AppText>
      <AppText variant="caption" weight="semibold">
        {value}
      </AppText>
      <AppText variant="label" color="faint">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  challengeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  textBlock: { gap: 4, flex: 1 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  habitHeader: { marginBottom: spacing.sm },
  habitList: { gap: 8, marginTop: spacing.md },
  logRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', gap: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  quoteText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
});
