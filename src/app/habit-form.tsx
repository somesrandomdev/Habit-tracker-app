import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppChip } from '@/components/ui/AppChip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PRESET_HABITS } from '@/constants/presets';
import { parseScheduledDays } from '@/utils/habitLogic';
import { WEEKDAY_LABELS } from '@/utils/dates';
import type { ScheduleType } from '@/types/models';

const EMOJI_CHOICES = ['💧', '🚶', '🌙', '😴', '🥤', '📖', '🧘', '🏋️', '🥗', '⭐', '🎯'];

export default function HabitFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const habits = useHabitsStore((s) => s.habits);
  const addHabit = useHabitsStore((s) => s.addHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const deactivateHabit = useHabitsStore((s) => s.deactivateHabit);

  const editing = useMemo(
    () => (params.id ? habits.find((h) => h.id === Number(params.id)) ?? null : null),
    [params.id, habits],
  );

  const [title, setTitle] = useState(editing?.title ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🎯');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(editing?.schedule_type ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(editing ? parseScheduledDays(editing.scheduled_days) : []);
  const [useReminder, setUseReminder] = useState(editing?.reminder_time != null);
  const [reminderTime, setReminderTime] = useState(editing?.reminder_time ?? '08:00');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSave = () => {
    setError(null);
    const input = {
      title,
      emoji,
      schedule_type: scheduleType,
      scheduled_days: scheduleType === 'custom' ? weekdays : [],
      reminder_time: useReminder && /^\d{2}:\d{2}$/.test(reminderTime) ? reminderTime : null,
    };
    const result = editing ? updateHabit(editing.id, input) : addHabit(input);
    if (result.ok) router.back();
    else setError(result.error ?? 'Could not save the habit.');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title={editing ? 'Edit habit' : 'New habit'} showBack />

      <AppTextInput label="Habit name" value={title} onChangeText={setTitle} placeholder="e.g. Read 10 pages" maxLength={60} />

      <AppCard>
        <AppText weight="medium">Icon</AppText>
        <View style={styles.emojiRow}>
          {EMOJI_CHOICES.map((choice) => (
            <AppChip key={choice} label={choice} selected={emoji === choice} onPress={() => setEmoji(choice)} />
          ))}
        </View>
        <View style={styles.suggestionRow}>
          <AppText variant="label" color="faint">
            Quick picks:
          </AppText>
          {PRESET_HABITS.slice(0, 3).map((preset) => (
            <AppText
              key={preset.key}
              variant="caption"
              color="primary"
              onPress={() => {
                setTitle(preset.title);
                setEmoji(preset.emoji);
              }}
              style={styles.suggestion}
            >
              {preset.title}
            </AppText>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText weight="medium">Schedule</AppText>
        <View style={styles.segmentWrap}>
          <SegmentedControl
            options={[
              { value: 'daily', label: 'Every day' },
              { value: 'weekdays', label: 'Weekdays' },
              { value: 'custom', label: 'Custom' },
            ]}
            value={scheduleType}
            onChange={(v) => setScheduleType(v as ScheduleType)}
          />
        </View>
        {scheduleType === 'custom' ? (
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, index) => (
              <AppChip
                key={`${label}-${index}`}
                label={label}
                selected={weekdays.includes(index)}
                onPress={() => toggleWeekday(index)}
              />
            ))}
          </View>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText weight="medium">Reminder (optional)</AppText>
        <View style={styles.reminderRow}>
          <AppChip label="No reminder" selected={!useReminder} onPress={() => setUseReminder(false)} />
          <AppChip label="At a time" selected={useReminder} onPress={() => setUseReminder(true)} />
        </View>
        {useReminder ? (
          <>
            <AppTextInput label="Time (HH:MM)" value={reminderTime} onChangeText={(t) => setReminderTime(t)} placeholder="08:00" />
            <View style={styles.timeChips}>
              {['07:00', '12:00', '18:00', '21:00'].map((t) => (
                <AppChip key={t} label={t} selected={reminderTime === t} onPress={() => setReminderTime(t)} />
              ))}
            </View>
            <AppText variant="label" color="faint">
              Requires notifications to be enabled in Settings.
            </AppText>
          </>
        ) : null}
      </AppCard>

      <AppButton label={editing ? 'Save changes' : 'Create habit'} onPress={handleSave} />
      {error ? (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      ) : null}

      {editing ? (
        <>
          <View style={styles.divider} />
          <AppButton label="Remove habit" variant="danger" onPress={() => setConfirmDelete(true)} />
          <AppText variant="label" color="faint" align="center">
            Removing keeps your past history safe — the habit simply becomes inactive.
          </AppText>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title={`Remove “${editing?.title}”?`}
        message="The habit becomes inactive. All past completions and stats stay preserved."
        confirmLabel="Remove habit"
        danger
        onConfirm={() => {
          if (editing) deactivateHabit(editing.id);
          setConfirmDelete(false);
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  segmentWrap: { marginTop: spacing.md },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  reminderRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: spacing.md },
  suggestion: { paddingVertical: 4 },
  divider: { height: 1, backgroundColor: 'transparent' },
});
