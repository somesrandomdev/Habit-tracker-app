import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useInsightsSnapshot } from '@/features/insights/useInsightsSnapshot';
import { useAppStore } from '@/stores/useAppStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart } from '@/components/ui/BarChart';
import { LineChart } from '@/components/ui/LineChart';
import { CalendarMonthView } from '@/components/ui/CalendarMonthView';
import { computeChallengeStats } from '@/utils/challengeLogic';
import { habitCompletionRates, bestAndWeakestHabits, wellnessTrend, averageWater } from '@/utils/insights';
import { latestEntry, metricChange, displayWeight, displayLength } from '@/utils/metrics';
import { formatHours } from '@/utils/durations';
import { addDaysToKey, formatKeyShort, todayKey, weekdayOf } from '@/utils/dates';
import { ACHIEVEMENT_DEFS } from '@/services/achievements.service';
import { useSettingsStore } from '@/stores/useSettingsStore';

const DAY_COLORS: Record<string, string> = {
  success: '#15803D',
  craving_only: '#0E7490',
  slip: '#B45309',
  fail: '#B91C1C',
};

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const units = useSettingsStore((s) => s.settings.units);
  const snapshot = useInsightsSnapshot();
  const refreshAll = useAppStore((s) => s.refreshAll);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const data = useMemo(() => {
    if (!snapshot) return null;
    const today = todayKey();
    const activeChallenge = snapshot.challenge?.challenge ?? null;
    const challengeStats = activeChallenge
      ? computeChallengeStats(activeChallenge, snapshot.challenge?.checkins ?? [], today)
      : null;

    const habits = snapshot.habits.filter((h) => h.active === 1);
    const rates = habitCompletionRates(habits, snapshot.habitCompletions, today);
    const bestWeakest = bestAndWeakestHabits(habits, snapshot.habitCompletions, today);
    const weekdayAverages = weekdayConsistency(habits, snapshot.habitCompletions, today);

    const weightLatest = latestEntry(snapshot.metrics);
    const weightDisplay =
      weightLatest && weightLatest.weight !== null ? displayWeight(weightLatest.weight, units) : null;
    const change7 = metricChange(snapshot.metrics, 'weight', 7, today);
    const change30 = metricChange(snapshot.metrics, 'weight', 30, today);
    const weightSeries = snapshot.metrics
      .filter((m) => m.weight !== null)
      .slice(-14)
      .map((m) => ({
        label: formatKeyShort(m.local_date),
        value: displayWeight(m.weight, units),
      }));

    return {
      today,
      challengeStats,
      activeChallenge,
      fastingBars: snapshot.fasting.last7Days.map((d) => ({
        label: weekdayShort(d.dateKey),
        value: Math.round(d.hours * 10) / 10,
        highlighted: d.dateKey === today,
      })),
      habits,
      rates,
      bestWeakest,
      weekdayAverages,
      mood: wellnessTrend(snapshot.logs, 'mood', today, 7).map((d) => ({ label: formatKeyShort(d.dateKey), value: d.value })),
      energy: wellnessTrend(snapshot.logs, 'energy', today, 7).map((d) => ({ label: formatKeyShort(d.dateKey), value: d.value })),
      hunger: wellnessTrend(snapshot.logs, 'hunger', today, 7).map((d) => ({ label: formatKeyShort(d.dateKey), value: d.value })),
      craving: wellnessTrend(snapshot.logs, 'craving_intensity', today, 7).map((d) => ({ label: formatKeyShort(d.dateKey), value: d.value })),
      waterAvg: averageWater(snapshot.logs, 7, today),
      weightLatest: weightDisplay,
      weightLatestDate: weightLatest?.local_date ?? null,
      change7,
      change30,
      weightSeries,
      waistLatest: weightLatest ? displayLength(weightLatest.waist, units) : null,
    };
  }, [snapshot, units]);

  if (!snapshot || !data) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: 100 }}>
        <EmptyState emoji="📊" title="Not enough data yet" message="Track a few days and your charts will come to life here." />
      </ScrollView>
    );
  }

  const hasAnyData =
    snapshot.fasting.totalCompleted > 0 ||
    data.challengeStats !== null ||
    snapshot.habitCompletions.length > 0 ||
    snapshot.logs.length > 0 ||
    snapshot.metrics.length > 0;

  const unlockedKeys = new Set(snapshot.achievements.map((a) => a.key));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 96 }]}
    >
      <AppHeader title="Insights" subtitle="Your journey in numbers" />

      {!hasAnyData ? (
        <EmptyState emoji="📊" title="Not enough data yet" message="Track a few days and your charts will come to life here." />
      ) : (
        <>
          {/* 1. Fasting */}
          <SectionTitle title="Fasting" />
          <View style={styles.statsRow}>
            <StatCard flex emoji="⏳" label="total hours" value={formatHours(snapshot.fasting.totalHours)} />
            <StatCard flex emoji="✅" label="completed" value={String(snapshot.fasting.totalCompleted)} />
          </View>
          <View style={styles.statsRow}>
            <StatCard flex emoji="📊" label="average fast" value={formatHours(snapshot.fasting.averageHours)} />
            <StatCard flex emoji="🔥" label="streak" value={`${snapshot.fasting.currentStreak}d`} sub={`best ${snapshot.fasting.longestStreak}d`} />
          </View>
          <AppCard>
            <AppText variant="label" color="dim" style={styles.chartTitle}>
              Fasting hours · last 7 days
            </AppText>
            <BarChart data={data.fastingBars} valueFormatter={(v) => `${v}h`} />
          </AppCard>

          {/* 2. Challenge */}
          {data.activeChallenge && data.challengeStats ? (
            <>
              <SectionTitle title="No-Sugar Challenge" />
              <View style={styles.statsRow}>
                <StatCard flex emoji="✅" label="success days" value={String(data.challengeStats.successDays)} />
                <StatCard flex emoji="🔥" label="streak" value={`${data.challengeStats.currentStreak}d`} sub={`best ${data.challengeStats.longestStreak}d`} />
              </View>
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  {data.activeChallenge.title}
                </AppText>
                <CalendarMonthView
                  compact
                  initialMonth={data.activeChallenge.start_date}
                  dayMark={(dateKey) => {
                    const active = data.activeChallenge;
                    if (!active) return null;
                    if (dateKey < active.start_date || dateKey > active.end_date) return null;
                    const checkin = snapshot.challenge?.checkins.find((c) => c.local_date === dateKey);
                    if (checkin) return { color: DAY_COLORS[checkin.status], label: String(Number(dateKey.slice(-2))) };
                    if (dateKey < data.today) return { color: colors.border, label: String(Number(dateKey.slice(-2))) };
                    return null;
                  }}
                />
              </AppCard>
            </>
          ) : null}

          {/* 3. Habits */}
          {data.rates.length > 0 ? (
            <>
              <SectionTitle title="Habits" />
              <View style={styles.statsRow}>
                <StatCard
                  flex
                  emoji="🥇"
                  label="best habit"
                  value={`${Math.round((data.bestWeakest.best?.rate ?? 0) * 100)}%`}
                  sub={data.bestWeakest.best?.habit.title}
                />
                <StatCard
                  flex
                  emoji="🎯"
                  label="focus area"
                  value={`${Math.round((data.bestWeakest.weakest?.rate ?? 0) * 100)}%`}
                  sub={data.bestWeakest.weakest?.habit.title}
                />
              </View>
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  Completion by weekday (14 days)
                </AppText>
                <BarChart
                  data={data.weekdayAverages.map((rate, i) => ({
                    label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
                    value: Math.round(rate * 100),
                  }))}
                  valueFormatter={(v) => `${v}%`}
                />
              </AppCard>
            </>
          ) : null}

          {/* 4. Wellness */}
          {snapshot.logs.length > 0 ? (
            <>
              <SectionTitle title="Wellness" />
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  Mood · last 7 days
                </AppText>
                <LineChart data={data.mood} min={1} max={5} />
              </AppCard>
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  Energy · last 7 days
                </AppText>
                <LineChart data={data.energy} min={1} max={5} />
              </AppCard>
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  Cravings · last 7 days
                </AppText>
                <LineChart data={data.craving} min={0} max={10} />
              </AppCard>
              <View style={styles.statsRow}>
                <StatCard flex emoji="💧" label="avg water / day" value={`${data.waterAvg}`} sub="last 7 days" />
                <StatCard flex emoji="🍽️" label="hunger trend" value={trendLabel(data.hunger)} sub="last 7 days" />
              </View>
            </>
          ) : null}

          {/* 5. Metrics */}
          {snapshot.metrics.length > 0 && data.weightLatest !== null ? (
            <>
              <SectionTitle title="Body Metrics" actionLabel="Log" onAction={() => router.push('/modals/metrics-log')} />
              <View style={styles.statsRow}>
                <StatCard flex emoji="⚖️" label="latest weight" value={`${data.weightLatest} ${units === 'metric' ? 'kg' : 'lb'}`} sub={data.weightLatestDate ? formatKeyShort(data.weightLatestDate) : undefined} />
                <StatCard flex emoji="📏" label="waist" value={data.waistLatest !== null ? `${data.waistLatest} ${units === 'metric' ? 'cm' : 'in'}` : '—'} />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  flex
                  emoji="📉"
                  label="7-day change"
                  value={data.change7 ? `${data.change7.delta > 0 ? '+' : ''}${displayWeight(Math.abs(data.change7.delta), units)} ${units === 'metric' ? 'kg' : 'lb'}` : '—'}
                />
                <StatCard
                  flex
                  emoji="🗓️"
                  label="30-day change"
                  value={data.change30 ? `${data.change30.delta > 0 ? '+' : ''}${displayWeight(Math.abs(data.change30.delta), units)} ${units === 'metric' ? 'kg' : 'lb'}` : '—'}
                />
              </View>
              <AppCard>
                <AppText variant="label" color="dim" style={styles.chartTitle}>
                  Weight trend
                </AppText>
                <LineChart data={data.weightSeries} />
              </AppCard>
            </>
          ) : null}

          {/* Achievements */}
          <SectionTitle title={`Achievements (${unlockedKeys.size}/${ACHIEVEMENT_DEFS.length})`} />
          <View style={styles.badgeGrid}>
            {ACHIEVEMENT_DEFS.map((def) => {
              const unlocked = unlockedKeys.has(def.key);
              return (
                <View
                  key={def.key}
                  style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: unlocked ? 1 : 0.45 }]}
                >
                  <AppText style={styles.badgeEmoji}>{def.emoji}</AppText>
                  <AppText variant="label" weight="semibold" align="center" numberOfLines={2}>
                    {def.title}
                  </AppText>
                  <AppText variant="label" color={unlocked ? 'success' : 'faint'} align="center">
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </AppText>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ---- local helpers (pure, snapshot-driven) ----

function weekdayShort(dateKey: string): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekdayOf(dateKey)];
}

function weekdayConsistency(
  habits: { id: number }[],
  completions: { habit_id: number; local_date: string; status: string }[],
  today: string,
): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const done = [0, 0, 0, 0, 0, 0, 0];
  const completionSet = new Set(
    completions.filter((c) => c.status === 'completed').map((c) => `${c.habit_id}|${c.local_date}`),
  );
  for (let i = 0; i < 14; i++) {
    const key = addDaysToKey(today, -i);
    const wd = weekdayOf(key);
    for (const habit of habits) {
      totals[wd] += 1;
      if (completionSet.has(`${habit.id}|${key}`)) done[wd] += 1;
    }
  }
  return totals.map((t, i) => (t > 0 ? done[i] / t : 0));
}

function trendLabel(series: { value: number | null }[]): string {
  const values = series.map((s) => s.value).filter((v): v is number => v !== null);
  if (values.length < 2) return '—';
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first) return '↗ rising';
  if (last < first) return '↘ falling';
  return '→ steady';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  chartTitle: { marginBottom: spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: spacing.md,
    width: '31%',
    alignItems: 'center',
    gap: 4,
  },
  badgeEmoji: { fontSize: 24 },
});
