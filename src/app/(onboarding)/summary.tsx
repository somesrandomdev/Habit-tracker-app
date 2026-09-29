import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { PRESET_HABITS } from '@/constants/presets';
import { addDaysToKey, formatKeyFriendly, todayKey } from '@/utils/dates';

const TOTAL_STEPS = 9;

export default function OnboardingSummaryScreen() {
  const router = useRouter();
  const { draft, submit } = useOnboardingStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayKey();
  const planLabel =
    draft.planKey === 'custom'
      ? `${draft.customFastingHours ?? '?'}h fasting / ${draft.customEatingHours ?? '?'}h eating`
      : `${draft.planKey} plan`;
  const challengeTitle =
    draft.challengeType === 'no_added_sugar'
      ? 'No Added Sugar'
      : draft.challengeType === 'strict_no_sugar'
        ? 'Strict No Sugar'
        : 'Custom Challenge';
  const selectedPresetTitles = PRESET_HABITS.filter((h) => draft.presetHabitKeys.includes(h.key)).map(
    (h) => `${h.emoji} ${h.title}`,
  );

  const handleStart = () => {
    setBusy(true);
    const result = submit();
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={9}
      totalSteps={TOTAL_STEPS}
      title="Your plan is ready"
      subtitle="A quick look before you start."
      footer={
        <View style={styles.footerGap}>
          <AppButton label="Start My Journey" size="lg" onPress={handleStart} loading={busy} />
          {error ? (
            <AppText variant="caption" color="danger" align="center">
              {error}
            </AppText>
          ) : null}
        </View>
      }
    >
      <AppCard>
        <AppText variant="label" color="dim">
          FASTING PLAN
        </AppText>
        <AppText weight="semibold" style={styles.itemValue}>
          ⏱️ {planLabel}
        </AppText>
      </AppCard>
      <AppCard>
        <AppText variant="label" color="dim">
          NO-SUGAR CHALLENGE
        </AppText>
        <AppText weight="semibold" style={styles.itemValue}>
          🍬 {challengeTitle} — {draft.durationDays} days
        </AppText>
        <AppText variant="caption" color="dim">
          {formatKeyFriendly(today)} → {formatKeyFriendly(addDaysToKey(today, draft.durationDays - 1))}
        </AppText>
      </AppCard>
      <AppCard>
        <AppText variant="label" color="dim">
          HABITS
        </AppText>
        <View style={styles.habits}>
          {selectedPresetTitles.map((title) => (
            <AppText key={title} variant="caption" color="text">
              {title}
            </AppText>
          ))}
          {draft.customHabits.map((title) => (
            <AppText key={title} variant="caption" color="text">
              ⭐ {title}
            </AppText>
          ))}
        </View>
      </AppCard>
      <AppCard>
        <AppText variant="label" color="dim">
          REMINDERS
        </AppText>
        <AppText weight="semibold" style={styles.itemValue}>
          {draft.notificationsEnabled ? '🔔 On — fast end + daily check-in' : '🔕 Off — in-app cards instead'}
        </AppText>
      </AppCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  itemValue: { marginTop: 4 },
  habits: { gap: 4, marginTop: 6 },
  footerGap: { gap: 8 },
});
