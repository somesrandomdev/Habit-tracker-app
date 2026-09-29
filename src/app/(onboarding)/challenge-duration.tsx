import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppChip } from '@/components/ui/AppChip';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { CHALLENGE_DURATIONS } from '@/constants/presets';

const TOTAL_STEPS = 9;

export default function ChallengeDurationScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  return (
    <OnboardingShell
      step={6}
      totalSteps={TOTAL_STEPS}
      title="How long is your challenge?"
      subtitle="The challenge ends on its end date — but your journey never has to."
      footer={<AppButton label="Continue" size="lg" onPress={() => router.push('/(onboarding)/habits')} />}
    >
      <View style={styles.chips}>
        {CHALLENGE_DURATIONS.map((days) => (
          <AppChip
            key={days}
            label={`${days} days`}
            selected={draft.durationDays === days}
            onPress={() => setDraft({ durationDays: days })}
          />
        ))}
      </View>
      <AppCard>
        <AppText variant="caption" color="dim">
          Your challenge will run from today to your end date. If a day goes badly, log it honestly
          — the recovery messages will help you bounce back.
        </AppText>
      </AppCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
