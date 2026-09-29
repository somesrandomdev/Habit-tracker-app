import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 9;

export default function SafetyScreen() {
  const router = useRouter();
  const setDraft = useOnboardingStore((s) => s.setDraft);
  const accepted = useOnboardingStore((s) => s.draft.safetyAccepted);
  const [showError, setShowError] = useState(false);

  const handleContinue = () => {
    if (!accepted) {
      setShowError(true);
      return;
    }
    router.push('/(onboarding)/fasting-plan');
  };

  return (
    <OnboardingShell
      step={3}
      totalSteps={TOTAL_STEPS}
      title="Before we start"
      subtitle="A quick but important note."
      footer={
        <View style={styles.footerGap}>
          <AppButton label="Continue" size="lg" onPress={handleContinue} disabled={!accepted} />
          {!accepted ? (
            <AppButton
              label="I understand"
              variant="secondary"
              onPress={() => {
                setDraft({ safetyAccepted: true });
                setShowError(false);
              }}
            />
          ) : null}
          {showError && !accepted ? (
            <AppText variant="caption" color="danger" align="center">
              Please confirm you understand before continuing.
            </AppText>
          ) : null}
        </View>
      }
    >
      <AppCard>
        <AppText style={styles.emoji}>🩺</AppText>
        <AppText weight="semibold">FastHabit is not medical advice</AppText>
        <AppText variant="caption" color="dim">
          This app is a tracking and motivation tool. It does not diagnose, treat, or prevent any
          condition.
        </AppText>
      </AppCard>
      <AppCard>
        <AppText style={styles.emoji}>⚠️</AppText>
        <AppText weight="semibold">Check with a professional first</AppText>
        <AppText variant="caption" color="dim">
          If you are pregnant or breastfeeding, under 18, have diabetes or any medical condition,
          have a history of eating disorders, or take regular medication — talk to a doctor before
          fasting or changing your diet.
        </AppText>
      </AppCard>
      <AppCard>
        <AppText style={styles.emoji}>💚</AppText>
        <AppText weight="semibold">Be kind to yourself</AppText>
        <AppText variant="caption" color="dim">
          Slips are part of every journey here. The app is built to help you recover, never to
          shame you.
        </AppText>
      </AppCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  footerGap: { gap: 8 },
  emoji: { fontSize: 24, marginBottom: 4 },
});
