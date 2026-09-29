import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { FASTING_PLAN_PRESETS } from '@/constants/presets';

const TOTAL_STEPS = 9;

export default function FastingPlanScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  const selectPlan = (key: string) => {
    setError(null);
    setDraft({ planKey: key });
  };

  const handleContinue = () => {
    if (draft.planKey === 'custom') {
      const f = draft.customFastingHours;
      const e = draft.customEatingHours;
      if (f === null || e === null || !(f > 0 && f < 24) || !(e > 0 && e < 24) || f + e !== 24) {
        setError('Fasting and eating hours must each be 1–23 and add up to 24.');
        return;
      }
    }
    router.push('/(onboarding)/challenge-type');
  };

  return (
    <OnboardingShell
      step={4}
      totalSteps={TOTAL_STEPS}
      title="Choose your fasting plan"
      subtitle="You can change this anytime. Start easier — you can always go longer."
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
      {FASTING_PLAN_PRESETS.map((preset) => {
        const selected = draft.planKey === preset.key;
        return (
          <AppCard key={preset.key} onPress={() => selectPlan(preset.key)} style={selected && styles.selected}>
            <View style={styles.row}>
              <View style={[styles.planBadge, { backgroundColor: colors.primarySoft }]}>
                <AppText weight="bold" style={styles.planLabel}>
                  {preset.name}
                </AppText>
              </View>
              <View style={styles.text}>
                <AppText weight="semibold">{preset.fasting_hours}h fasting / {preset.eating_window_hours}h eating</AppText>
                <AppText variant="caption" color="dim">
                  {preset.description}
                </AppText>
              </View>
            </View>
          </AppCard>
        );
      })}

      {draft.planKey === 'custom' ? (
        <View style={styles.customRow}>
          <AppTextInput
            label="Fasting hours"
            value={draft.customFastingHours === null ? '' : String(draft.customFastingHours)}
            onChangeText={(t) => setDraft({ customFastingHours: t === '' ? null : Math.max(0, Math.min(23, Number(t.replace(/[^0-9.]/g, '')) || 0)) })}
            keyboardType="numeric"
            placeholder="16"
          />
          <AppTextInput
            label="Eating window hours"
            value={draft.customEatingHours === null ? '' : String(draft.customEatingHours)}
            onChangeText={(t) => setDraft({ customEatingHours: t === '' ? null : Math.max(0, Math.min(23, Number(t.replace(/[^0-9.]/g, '')) || 0)) })}
            keyboardType="numeric"
            placeholder="8"
          />
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planBadge: {
    width: 64,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLabel: { fontSize: 15 },
  text: { flex: 1, gap: 2 },
  selected: { borderWidth: 2 },
  customRow: { flexDirection: 'row', gap: 12 },
  footerGap: { gap: 8 },
});
