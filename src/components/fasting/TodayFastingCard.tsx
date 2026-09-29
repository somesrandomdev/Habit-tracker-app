import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/useAppStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useActiveFast } from '@/hooks/useActiveFast';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatClock, formatDurationHuman } from '@/utils/durations';
import { formatIsoTime } from '@/utils/dates';
import { FAST_PHASE_META } from '@/utils/fasting';

/**
 * Self-contained fasting card for the dashboard. It subscribes to the live timer
 * internally, so the 1-second tick re-renders only this card — not the whole
 * Today screen.
 */
export const TodayFastingCard = memo(function TodayFastingCard() {
  const router = useRouter();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const activePlan = useFastingStore((s) => s.activePlan);
  const startFast = useFastingStore((s) => s.startFast);
  const endFast = useFastingStore((s) => s.endFast);
  const active = useActiveFast();

  const handleEndFast = () => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const result = endFast(null);
    if (result.ok) {
      refreshAll();
      if (result.completed) router.push('/celebration?type=fast');
    }
  };

  if (active) {
    return (
      <AppCard>
        <View style={styles.ringRow}>
          <ProgressRing ratio={active.progress.ratio} size={150} strokeWidth={11}>
            <View style={styles.ringCenter}>
              <AppText style={styles.timer}>{formatClock(active.progress.elapsedMs)}</AppText>
              <AppText variant="label" color="dim">
                {active.progress.isComplete ? 'target reached' : 'elapsed'}
              </AppText>
            </View>
          </ProgressRing>
          <View style={styles.fastMeta}>
            <Badge label={FAST_PHASE_META[active.progress.phase].label} tone="primary" />
            <AppText variant="caption" color="dim">
              {active.progress.isComplete
                ? 'Target reached — well done.'
                : `${formatDurationHuman(active.progress.remainingMs)} remaining`}
            </AppText>
            <AppText variant="caption" color="faint">
              Scheduled end: {formatIsoTime(active.session.scheduled_end_time_utc)}
            </AppText>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <AppButton
            label={active.progress.isComplete ? 'Complete Fast 🎉' : 'End Fast'}
            onPress={handleEndFast}
            style={styles.flexButton}
          />
          <AppButton label="Extend" variant="secondary" onPress={() => router.push('/modals/extend-fast')} style={styles.flexButton} />
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppText weight="semibold">No fast running</AppText>
      <AppText variant="caption" color="dim">
        {activePlan
          ? `Your plan: ${activePlan.name} (${activePlan.fasting_hours}h fasting / ${activePlan.eating_window_hours}h eating)`
          : 'Set up a fasting plan to begin.'}
      </AppText>
      <AppButton
        label="Start Fast"
        onPress={() => {
          const result = startFast();
          if (result.ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        style={styles.singleButton}
      />
    </AppCard>
  );
});

const styles = StyleSheet.create({
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringCenter: { alignItems: 'center', gap: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  fastMeta: { flex: 1, gap: 6 },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  flexButton: { flex: 1 },
  singleButton: { marginTop: spacing.md },
});
