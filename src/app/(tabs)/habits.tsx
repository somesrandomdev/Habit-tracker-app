import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/useAppStore';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppChip } from '@/components/ui/AppChip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ListItem } from '@/components/ui/ListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { computeHabitStats } from '@/utils/habitLogic';
import { todayKey } from '@/utils/dates';

export default function HabitsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const habits = useHabitsStore((s) => s.habits);
  const completions = useHabitsStore((s) => s.completions);
  const toggleCompletion = useHabitsStore((s) => s.toggleCompletion);
  const todayHabits = useTodayHabits();

  useFocusEffect(
    useCallback(() => {
      refreshAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const today = todayKey();
  const unscheduled = habits.filter(
    (h) => !todayHabits.rows.some((row) => row.habit.id === h.id),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} tintColor={colors.primary} />}
    >
      <AppHeader
        title="Habits"
        subtitle={
          todayHabits.scheduledCount > 0
            ? `${todayHabits.completedCount}/${todayHabits.scheduledCount} done today`
            : 'Build your routine'
        }
        right={
          <AppText color="primary" weight="medium" onPress={() => router.push('/habit-form')} suppressHighlighting>
            + Add
          </AppText>
        }
      />

      {todayHabits.scheduledCount > 0 ? (
        <AppCard>
          <ProgressBar ratio={todayHabits.completedCount / todayHabits.scheduledCount} height={10} />
          <AppText variant="caption" color="dim" style={styles.progressLabel}>
            {todayHabits.completedCount} of {todayHabits.scheduledCount} scheduled habits completed today
          </AppText>
        </AppCard>
      ) : null}

      <SectionTitle title="Today" />
      {todayHabits.rows.length === 0 ? (
        <EmptyState
          emoji="🌤️"
          title="No habits scheduled today"
          message="Enjoy the rest day, or add a habit that fits your week."
          actionLabel="Add a habit"
          onAction={() => router.push('/habit-form')}
        />
      ) : (
        <View style={styles.list}>
          {todayHabits.rows.map(({ habit, completion }) => {
            const stats = computeHabitStats(habit, completions, today);
            return (
              <ListItem
                key={habit.id}
                emoji={habit.emoji}
                title={habit.title}
                subtitle={`🔥 ${stats.currentStreak}-day streak · best ${stats.longestStreak}`}
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
            );
          })}
        </View>
      )}

      {unscheduled.length > 0 ? (
        <>
          <SectionTitle title="Not scheduled today" />
          <View style={styles.list}>
            {unscheduled.map((habit) => (
              <ListItem
                key={habit.id}
                emoji={habit.emoji}
                title={habit.title}
                subtitle="Rests today"
                onPress={() => router.push(`/habit-detail?id=${habit.id}`)}
                disabled
                right={<AppText variant="caption" color="faint">{habit.schedule_type === 'weekdays' ? 'Weekdays' : 'Custom'}</AppText>}
              />
            ))}
          </View>
        </>
      ) : null}

      <AppButton label="Create a new habit" variant="secondary" onPress={() => router.push('/habit-form')} style={styles.addButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  progressLabel: { marginTop: spacing.sm },
  list: { gap: 8 },
  addButton: { marginTop: spacing.sm },
});
