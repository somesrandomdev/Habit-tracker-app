import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import type { Goal } from '@/types/models';

const TOTAL_STEPS = 9;

const GOALS: { value: Goal; label: string; emoji: string; description: string }[] = [
  { value: 'lose_weight', label: 'Lose weight', emoji: '⚖️', description: 'Use fasting and habits to reach a healthier weight.' },
  { value: 'quit_sugar', label: 'Quit sugar', emoji: '🍬', description: 'Break free from added sugar for good.' },
  { value: 'build_habits', label: 'Build habits', emoji: '✅', description: 'Stack small daily wins that stick.' },
  { value: 'improve_energy', label: 'Improve energy', emoji: '⚡', description: 'Steadier energy, fewer crashes.' },
  { value: 'all', label: 'All of the above', emoji: '🌟', description: 'The full journey — fasting, sugar, habits, energy.' },
];

export default function GoalSelectionScreen() {
  const router = useRouter();
  const draft = useOnboardingStore((s) => s.draft);
  const setDraft = useOnboardingStore((s) => s.setDraft);
  const { colors } = useTheme();

  return (
    <OnboardingShell
      step={2}
      totalSteps={TOTAL_STEPS}
      title="What brings you here?"
      subtitle="Pick a primary goal — you can always change it later in Settings."
      footer={
        <AppButton
          label="Continue"
          size="lg"
          onPress={() => router.push('/(onboarding)/safety')}
        />
      }
    >
      {GOALS.map((goal) => {
        const selected = draft.goal === goal.value;
        return (
          <AppCard key={goal.value} onPress={() => setDraft({ goal: goal.value })} style={selected && [styles.selected, { borderColor: colors.primary }]}>
            <View style={styles.row}>
              <AppText style={styles.emoji}>{goal.emoji}</AppText>
              <View style={styles.text}>
                <AppText weight="semibold">{goal.label}</AppText>
                <AppText variant="caption" color="dim">
                  {goal.description}
                </AppText>
              </View>
            </View>
          </AppCard>
        );
      })}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 26 },
  text: { flex: 1, gap: 2 },
  selected: { borderWidth: 2 },
});
