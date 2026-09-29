import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { CHALLENGE_PRESETS } from '@/constants/presets';

const TOTAL_STEPS = 9;

export default function ChallengeTypeScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (draft.challengeType === 'custom' && !draft.customRules.trim()) {
      setError('Describe your custom rules — one clear line is enough.');
      return;
    }
    router.push('/(onboarding)/challenge-duration');
  };

  return (
    <OnboardingShell
      step={5}
      totalSteps={TOTAL_STEPS}
      title="Pick your no-sugar challenge"
      subtitle="This is the rule set you will check in against every day."
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
      {CHALLENGE_PRESETS.map((preset) => {
        const selected = draft.challengeType === preset.type;
        return (
          <View key={preset.type}>
            <AppCard onPress={() => { setError(null); setDraft({ challengeType: preset.type }); }} style={selected && styles.selected}>
              <View style={styles.row}>
                <AppText style={styles.emoji}>{preset.type === 'no_added_sugar' ? '🍯' : preset.type === 'strict_no_sugar' ? '🚫' : '✏️'}</AppText>
                <View style={styles.text}>
                  <AppText weight="semibold">{preset.title}</AppText>
                  <AppText variant="caption" color="dim">
                    {preset.description}
                  </AppText>
                </View>
              </View>
            </AppCard>
            {selected && preset.type === 'custom' ? (
              <View style={styles.customWrap}>
                <AppTextInput
                  label="Your challenge rules"
                  value={draft.customRules}
                  onChangeText={(t) => setDraft({ customRules: t })}
                  placeholder="e.g. No dessert during weekdays, one fruit per day…"
                  multiline
                />
              </View>
            ) : null}
          </View>
        );
      })}
      <AppCard>
        <AppText variant="caption" color="dim">
          💚 A slip or a fail resets your sugar streak, but never erases your challenge progress.
        </AppText>
      </AppCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 26 },
  text: { flex: 1, gap: 2 },
  selected: { borderWidth: 2 },
  customWrap: { marginTop: -6 },
  footerGap: { gap: 8 },
});
