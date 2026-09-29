import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import * as notificationsService from '@/services/notifications.service';

const TOTAL_STEPS = 9;

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleEnable = async () => {
    setBusy(true);
    const granted = await notificationsService.requestPermission();
    setDraft({ notificationsEnabled: granted });
    setResult(
      granted
        ? 'Notifications enabled. You can fine-tune them later in Settings.'
        : 'No problem — the app will show gentle in-app reminder cards instead.',
    );
    setBusy(false);
  };

  const handleContinue = () => router.push('/(onboarding)/summary');

  return (
    <OnboardingShell
      step={8}
      totalSteps={TOTAL_STEPS}
      title="Stay on track with reminders"
      subtitle="Gentle local nudges when your fast ends, when it is time to check in, and for your habits."
      footer={<AppButton label="Continue" size="lg" onPress={handleContinue} />}
    >
      <AppCard>
        <AppText style={styles.emoji}>🔔</AppText>
        <AppText weight="semibold">Why reminders help</AppText>
        <AppText variant="caption" color="dim">
          The most common reason fasts and challenges fail is simply forgetting — to start, to end,
          or to check in. A small nudge at the right moment fixes that. Everything is scheduled
          locally on your device.
        </AppText>
      </AppCard>

      {result ? (
        <AppCard>
          <AppText variant="caption" color={draft.notificationsEnabled ? 'success' : 'warning'}>
            {result}
          </AppText>
        </AppCard>
      ) : (
        <AppButton
          label={busy ? 'Asking…' : 'Enable notifications'}
          variant="secondary"
          onPress={handleEnable}
          disabled={busy}
        />
      )}

      <AppText variant="caption" color="faint" align="center">
        You can continue without notifications if you prefer.
      </AppText>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 26, marginBottom: 4 },
});
