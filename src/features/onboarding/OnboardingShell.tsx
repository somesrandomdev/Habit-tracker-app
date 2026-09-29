import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface OnboardingShellProps {
  step: number; // 1-based
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Common onboarding chrome: progress bar, heading, scrollable body, pinned footer. */
export function OnboardingShell({ step, totalSteps, title, subtitle, children, footer }: OnboardingShellProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + spacing.md }]}>
      <View style={styles.progressWrap}>
        <ProgressBar ratio={step / totalSteps} height={5} />
        <AppText variant="label" color="faint" style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </AppText>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: spacing.xl }]} keyboardShouldPersistTaps="handled">
        <AppText variant="title" weight="bold">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="dim" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        <View style={styles.content}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.md }]}>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressWrap: { paddingHorizontal: spacing.xl, gap: spacing.xs },
  stepLabel: { textAlign: 'right' },
  body: { padding: spacing.xl, gap: spacing.md },
  subtitle: { marginTop: -4 },
  content: { gap: spacing.md, marginTop: spacing.sm },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
});
