import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useFastingStore } from '@/stores/useFastingStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppChip } from '@/components/ui/AppChip';
import { formatIsoDateTime } from '@/utils/dates';
import { formatDurationHuman } from '@/utils/durations';
import { computeFastProgress } from '@/utils/fasting';

const QUICK_HOURS = [1, 2];

export default function ExtendFastModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const activeFast = useFastingStore((s) => s.activeFast);
  const extendFast = useFastingStore((s) => s.extendFast);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!activeFast) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xl }]}>
        <AppHeader title="Extend fast" showBack />
        <AppText color="dim" style={styles.noFast}>
          There is no active fast to extend.
        </AppText>
      </View>
    );
  }

  const progress = computeFastProgress(activeFast.start_time_utc, activeFast.scheduled_end_time_utc);

  const handleExtend = (hours: number) => {
    const result = extendFast(hours);
    if (result.ok) {
      router.back();
    } else {
      setError(result.error ?? 'Could not extend the fast.');
    }
  };

  const handleCustom = () => {
    const hours = Number(custom.replace(',', '.'));
    if (!Number.isFinite(hours) || hours <= 0 || hours > 72) {
      setError('Enter an extension between 0 and 72 hours.');
      return;
    }
    handleExtend(hours);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Extend fast" showBack />

      <AppCard>
        <AppText weight="semibold">Current target</AppText>
        <AppText variant="caption" color="dim">
          Ends {formatIsoDateTime(activeFast.scheduled_end_time_utc)} ·{' '}
          {progress.isComplete
            ? `${formatDurationHuman(-progress.remainingMs)} past target`
            : `${formatDurationHuman(progress.remainingMs)} remaining`}
        </AppText>
      </AppCard>

      <AppCard>
        <AppText weight="medium">Quick extend</AppText>
        <View style={styles.quickRow}>
          {QUICK_HOURS.map((h) => (
            <AppChip key={h} label={`+${h} hour${h > 1 ? 's' : ''}`} onPress={() => handleExtend(h)} />
          ))}
        </View>
        <AppText variant="caption" color="dim" style={styles.hint}>
          The extension is added on top of your current target (or from now, if the target already
          passed). Reminders are rescheduled automatically.
        </AppText>
      </AppCard>

      <AppTextInput
        label="Custom extension (hours)"
        value={custom}
        onChangeText={setCustom}
        keyboardType="numeric"
        placeholder="e.g. 1.5"
      />
      <AppButton label="Extend by custom amount" onPress={handleCustom} disabled={!custom.trim()} />

      {error ? (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  noFast: { padding: spacing.xl },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  hint: { marginTop: spacing.md },
});
