import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { useAppStore } from '@/stores/useAppStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ListItem } from '@/components/ui/ListItem';
import { CalendarMonthView } from '@/components/ui/CalendarMonthView';
import { EmptyState } from '@/components/ui/EmptyState';
import { computeHabitStats } from '@/utils/habitLogic';
import { formatKeyFriendly, todayKey } from '@/utils/dates';
import type { HabitCompletionStatus } from '@/types/models';

const STATUS_TONE: Record<HabitCompletionStatus, 'success' | 'danger' | 'default'> = {
  completed: 'success',
  missed: 'danger',
  skipped: 'default',
};

export default function HabitDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const habits = useHabitsStore((s) => s.habits);
  const completions = useHabitsStore((s) => s.completions);
  const setStatus = useHabitsStore((s) => s.setStatus);
  const toggleCompletion = useHabitsStore((s) => s.toggleCompletion);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const habit = useMemo(
    () => (params.id ? habits.find((h) => h.id === Number(params.id)) ?? null : null),
    [params.id, habits],
  );

  const [selectedDay, setSelectedDay] = useState<string | null>(todayKey());

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 100 }]}>
        <EmptyState emoji="🔍" title="Habit not found" message="It may have been removed." actionLabel="Back to habits" onAction={() => router.back()} />
      </View>
    );
  }

  const today = todayKey();
  const stats = computeHabitStats(habit, completions, today);
  const completionsForHabit = completions.filter((c) => c.habit_id === habit.id);
  const byDate = new Map(completionsForHabit.map((c) => [c.local_date, c]));
  const selectedRecord = selectedDay ? (byDate.get(selectedDay) ?? null) : null;

  const handleSetStatus = (status: HabitCompletionStatus) => {
    if (!selectedDay) return;
    if (selectedDay === today && status === 'completed') {
      toggleCompletion(habit.id, today);
    } else {
      setStatus(habit.id, selectedDay, status);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <AppHeader
        title={`${habit.emoji} ${habit.title}`}
        subtitle={
          habit.schedule_type === 'daily'
            ? 'Every day'
            : habit.schedule_type === 'weekdays'
              ? 'Weekdays (Mon–Fri)'
              : 'Custom schedule'
        }
        showBack
        right={
          <AppText color="primary" weight="medium" onPress={() => router.push(`/habit-form?id=${habit.id}`)} suppressHighlighting>
            Edit
          </AppText>
        }
      />

      <View style={styles.statsRow}>
        <StatCard flex emoji="🔥" label="current streak" value={`${stats.currentStreak}d`} />
        <StatCard flex emoji="🏆" label="longest streak" value={`${stats.longestStreak}d`} />
      </View>
      <View style={styles.statsRow}>
        <StatCard flex emoji="📊" label="14-day rate" value={`${Math.round(stats.weeklyRate * 100)}%`} />
        <StatCard flex emoji="✅" label="total completions" value={String(stats.totalCompletions)} />
      </View>

      <SectionTitle title="Calendar" />
      <AppCard>
        <CalendarMonthView
          compact
          dayMark={(dateKey) => {
            const record = byDate.get(dateKey);
            if (!record) return null;
            const color = record.status === 'completed' ? colors.success : record.status === 'missed' ? colors.danger : colors.warning;
            return { color, label: String(Number(dateKey.slice(-2))) };
          }}
          selected={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <View style={styles.legendRow}>
          <Legend color={colors.success} label="completed" />
          <Legend color={colors.warning} label="skipped" />
          <Legend color={colors.danger} label="missed" />
        </View>
      </AppCard>

      {selectedDay ? (
        <AppCard>
          <View style={styles.dayHeader}>
            <AppText weight="semibold">{formatKeyFriendly(selectedDay)}</AppText>
            {selectedRecord ? (
              <Badge label={selectedRecord.status} tone={STATUS_TONE[selectedRecord.status]} />
            ) : (
              <AppText variant="caption" color="faint">
                No record
              </AppText>
            )}
          </View>
          <View style={styles.dayActions}>
            <AppButton label="Completed" variant={selectedRecord?.status === 'completed' ? 'primary' : 'secondary'} onPress={() => handleSetStatus('completed')} style={styles.dayButton} />
            <AppButton label="Skipped" variant={selectedRecord?.status === 'skipped' ? 'primary' : 'secondary'} onPress={() => handleSetStatus('skipped')} style={styles.dayButton} />
            <AppButton label="Missed" variant={selectedRecord?.status === 'missed' ? 'primary' : 'secondary'} onPress={() => handleSetStatus('missed')} style={styles.dayButton} />
          </View>
          <AppText variant="label" color="faint">
            “Skipped” keeps your streak alive without adding to it. Future days cannot be marked.
          </AppText>
        </AppCard>
      ) : null}

      <SectionTitle title="Recent history" />
      <View style={styles.list}>
        {completionsForHabit
          .slice()
          .sort((a, b) => (a.local_date < b.local_date ? 1 : -1))
          .slice(0, 14)
          .map((record) => (
            <ListItem
              key={record.id}
              title={formatKeyFriendly(record.local_date)}
              onPress={() => setSelectedDay(record.local_date)}
              right={<Badge label={record.status} tone={STATUS_TONE[record.status]} />}
            />
          ))}
        {completionsForHabit.length === 0 ? (
          <AppText variant="caption" color="dim">
            No history yet for this habit.
          </AppText>
        ) : null}
      </View>
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
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  dayActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dayButton: { flex: 1 },
  list: { gap: 8 },
});
