import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useFastingStore } from '@/stores/useFastingStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { computeFastProgress } from '@/utils/fasting';
import { formatDurationHuman, formatHours, msToHours } from '@/utils/durations';
import { formatIsoDateTime, formatKeyShort, keyFromIso } from '@/utils/dates';
import type { FastStatus } from '@/types/models';

const STATUS_TONE: Record<FastStatus, 'success' | 'warning' | 'danger' | 'primary'> = {
  completed: 'success',
  stopped_early: 'warning',
  abandoned: 'danger',
  active: 'primary',
};

export default function FastDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sessions = useFastingStore((s) => s.recentSessions);
  const plans = useFastingStore((s) => s.plans);
  const deleteSession = useFastingStore((s) => s.deleteSession);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const session = useMemo(
    () => (params.id ? sessions.find((s) => s.id === Number(params.id)) ?? null : null),
    [params.id, sessions],
  );

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 100 }]}>
        <EmptyState emoji="🔍" title="Fast not found" message="It may have been deleted." actionLabel="Back" onAction={() => router.back()} />
      </View>
    );
  }

  const plan = plans.find((p) => p.id === session.plan_id);
  const start = new Date(session.start_time_utc);
  const end = new Date(session.actual_end_time_utc ?? session.scheduled_end_time_utc);
  const durationMs = Math.max(0, end.getTime() - start.getTime());
  const durationHours = msToHours(durationMs);
  const targetHours = plan?.fasting_hours ?? msToHours(new Date(session.scheduled_end_time_utc).getTime() - start.getTime());
  const hitTarget = session.status === 'completed' || durationMs >= new Date(session.scheduled_end_time_utc).getTime() - start.getTime();
  const activeProgress = session.status === 'active' ? computeFastProgress(session.start_time_utc, session.scheduled_end_time_utc) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <AppHeader
        title={formatKeyShort(keyFromIso(session.start_time_utc))}
        subtitle={`${start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} → ${end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
        showBack
      />

      <View style={styles.rowCenter}>
        <Badge label={session.status.replace('_', ' ')} tone={STATUS_TONE[session.status]} />
        {hitTarget && session.status !== 'abandoned' ? <Badge label="🎯 target reached" tone="success" /> : null}
      </View>

      <View style={styles.statsRow}>
        <StatCard flex emoji="⏱️" label="duration" value={formatHours(durationHours)} />
        <StatCard flex emoji="🎯" label="target" value={`${targetHours}h`} sub={plan?.name} />
      </View>

      <AppCard>
        <DetailRow label="Plan" value={plan?.name ?? `Plan #${session.plan_id}`} />
        <DetailRow label="Started" value={formatIsoDateTime(session.start_time_utc)} />
        <DetailRow label={session.actual_end_time_utc ? 'Ended' : 'Scheduled end'} value={formatIsoDateTime(session.actual_end_time_utc ?? session.scheduled_end_time_utc)} />
        <DetailRow label="Duration" value={session.status === 'active' && activeProgress ? `running · ${formatDurationHuman(activeProgress.elapsedMs)}` : formatDurationHuman(durationMs)} />
        <DetailRow
          label="Result"
          value={
            session.status === 'completed'
              ? 'Completed — counts toward streaks'
              : session.status === 'stopped_early'
                ? 'Stopped early — streak paused'
                : session.status === 'abandoned'
                  ? 'Abandoned'
                  : 'In progress'
          }
        />
        {session.reason_for_stopping ? <DetailRow label="Reason" value={session.reason_for_stopping} /> : null}
      </AppCard>

      {session.notes ? (
        <AppCard>
          <AppText variant="label" color="dim">
            NOTES
          </AppText>
          <AppText style={styles.notes}>{session.notes}</AppText>
        </AppCard>
      ) : null}

      {session.status !== 'active' ? (
        <>
          <AppButton label="Delete this record" variant="danger" onPress={() => setConfirmDelete(true)} />
          <AppText variant="label" color="faint" align="center">
            Deleting removes this fast from history and stats.
          </AppText>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this fast?"
        message="This record will be removed from your history and stats permanently."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          deleteSession(session.id);
          setConfirmDelete(false);
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" color="dim">
        {label}
      </AppText>
      <AppText weight="medium" style={styles.detailValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  rowCenter: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: spacing.lg },
  detailValue: { flex: 1, textAlign: 'right' },
  notes: { marginTop: 4, lineHeight: 21 },
});
