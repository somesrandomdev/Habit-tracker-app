import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/features/onboarding/OnboardingShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';

const TOTAL_STEPS = 9;

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <OnboardingShell
      step={1}
      totalSteps={TOTAL_STEPS}
      title="Welcome to FastHabit"
      subtitle="Fasting, a no-sugar challenge, and daily habits — one calm place to build a healthier routine."
      footer={
        <AppButton label="Get Started" size="lg" onPress={() => router.push('/(onboarding)/goal')} />
      }
    >
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText style={styles.heroEmoji}>⏱️ 🍬 ✅</AppText>
        <AppText weight="semibold" align="center">
          Track fasts. Beat sugar. Stack small wins.
        </AppText>
        <AppText variant="caption" color="dim" align="center">
          Everything stays private on your device and works fully offline.
        </AppText>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  heroEmoji: { fontSize: 34 },
});
