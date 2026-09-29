import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppChip } from '@/components/ui/AppChip';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ListItem } from '@/components/ui/ListItem';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { PRESET_HABITS } from '@/constants/presets';

const TOTAL_STEPS = 9;

export default function HabitSelectionScreen() {
  const router = useRouter();
  const { draft, togglePresetHabit, addCustomHabit, removeCustomHabit } = useOnboardingStore();
  const [newHabit, setNewHabit] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newHabit.trim()) return;
    addCustomHabit(newHabit);
    setNewHabit('');
  };

  const handleContinue = () => {
    if (draft.presetHabitKeys.length === 0 && draft.customHabits.length === 0) {
      setError('Pick at least one habit to support your journey.');
      return;
    }
    router.push('/(onboarding)/notifications');
  };

  return (
    <OnboardingShell
      step={7}
      totalSteps={TOTAL_STEPS}
      title="Add supportive habits"
      subtitle="Habits make fasting and sugar-free days much easier. Pick a few."
      footer={
        <View style={styles.footerGap}>
          <AppButton label="Continue" size="lg" onPress={handleContinue} />
          {error ? (
            <AppText variant="caption" color="danger" align="center">
              {error}
            </AppText>
          ) : null}
        </View>
      }
    >
      <View style={styles.chips}>
        {PRESET_HABITS.map((habit) => (
          <AppChip
            key={habit.key}
            label={`${habit.emoji} ${habit.title}`}
            selected={draft.presetHabitKeys.includes(habit.key)}
            onPress={() => togglePresetHabit(habit.key)}
          />
        ))}
      </View>

      <AppTextInput
        label="Add your own habit"
        value={newHabit}
        onChangeText={setNewHabit}
        placeholder="e.g. Read 10 pages"
        maxLength={60}
      />
      <AppButton label="Add habit" variant="secondary" onPress={handleAdd} disabled={!newHabit.trim()} />

      {draft.customHabits.length > 0 ? (
        <View style={styles.customList}>
          {draft.customHabits.map((title) => (
            <ListItem
              key={title}
              emoji="⭐"
              title={title}
              right={
                <AppText color="danger" weight="medium" onPress={() => removeCustomHabit(title)}>
                  Remove
                </AppText>
              }
            />
          ))}
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  customList: { gap: 8 },
  footerGap: { gap: 8 },
});
