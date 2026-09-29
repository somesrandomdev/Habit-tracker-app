import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/useAppStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useActiveFast } from '@/hooks/useActiveFast';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { AppChip } from '@/components/ui/AppChip';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ListItem } from '@/components/ui/ListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { CalendarMonthView } from '@/components/ui/CalendarMonthView';
import { computeFastingStats } from '@/services/fasting.service';
import { FAST_PHASE_META } from '@/utils/fasting';
import { formatClock, formatDurationHuman, formatHours } from '@/utils/durations';
import { formatKeyShort, formatIsoDateTime, keyFromIso, todayKey } from '@/utils/dates';
import type { FastSession, FastStatus } from '@/types/models';

const EARLY_REASONS = ['Hunger too strong', 'Social event', 'Felt unwell', 'Broke plan by accident', 'Other'];

const STATUS_TONE: Record<FastStatus, 'success' | 'warning' | 'danger' | 'primary'> = {
  completed: 'success',
  stopped_early: 'warning',
  abandoned: 'danger',
  active: 'primary',
};

export default function FastingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);
  const store = useFastingStore();
  const active = useActiveFast();

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [endEarlyVisible, setEndEarlyVisible] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [editStartVisible, setEditStartVisible] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Deferred so the store round-trip never sets state synchronously inside the effect.
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setNotes(active?.session.notes ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [active?.session.id, active?.session.notes]);

  useFocusEffect(
    useCallback(() => {
      store.hydrate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const stats = useMemo(
    () => computeFastingStats(store.recentSessions, todayKey()),
    [store.recentSessions],
  );

  const endNow = (reasonValue: string | null) => {
    if (!active) return;
    const result = store.endFast(reasonValue);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setConfirmEnd(false);
      setReason(null);
      if (result.completed) router.push('/celebration?type=fast');
    }
  };

  const dayMark = useCallback(
    (dateKey: string) => {
      const session = store.recentSessions.find(
        (s) => s.actual_end_time_utc && keyFromIso(s.actual_end_time_utc) === dateKey,
      );
      if (!session) return null;
      if (session.status === 'completed') return { color: colors.success, label: String(dateKey.slice(-2)) };
      if (session.status === 'stopped_early') return { color: colors.warning, label: String(dateKey.slice(-2)) };
      return { color: colors.textFaint, label: String(dateKey.slice(-2)) };
    },
    [store.recentSessions, colors],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} tintColor={colors.primary} />}
    >
      <AppHeader
        title="Fasting"
        subtitle={store.activePlan ? `Plan: ${store.activePlan.name}` : 'No plan selected'}
        right={
          <AppText color="primary" weight="medium" onPress={() => router.push('/settings')} suppressHighlighting>
            Settings
          </AppText>
        }
      />

      {active ? (
        <AppCard>
          <View style={styles.timerSection}>
            <ProgressRing ratio={active.progress.ratio} size={230} strokeWidth={16}>
              <View style={styles.ringCenter}>
                <AppText variant="label" color="dim">
                  {FAST_PHASE_META[active.progress.phase].emoji} {FAST_PHASE_META[active.progress.phase].label}
                </AppText>
                <AppText style={styles.bigTimer}>{formatClock(active.progress.elapsedMs)}</AppText>
                <AppText variant="caption" color="dim">
                  {active.progress.isComplete
                    ? 'Target reached 🎉'
                    : `${formatDurationHuman(active.progress.remainingMs)} left · ends ${formatIsoDateTime(active.session.scheduled_end_time_utc)}`}
                </AppText>
              </View>
            </ProgressRing>
          </View>

          <View style={styles.buttonRow}>
            <AppButton
              label={active.progress.isComplete ? 'Complete Fast 🎉' : 'End Fast'}
              onPress={() => {
                if (active.progress.isComplete) setConfirmEnd(true);
                else setEndEarlyVisible(true);
              }}
              style={styles.flexButton}
            />
            <AppButton label="Extend" variant="secondary" onPress={() => router.push('/modals/extend-fast')} style={styles.flexButton} />
          </View>
          <View style={styles.secondaryRow}>
            <AppButton label="Edit start time" variant="ghost" onPress={() => setEditStartVisible(true)} />
            <AppButton label="Cancel fast" variant="ghost" onPress={() => setConfirmCancel(true)} />
          </View>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            onEndEditing={() => store.updateNotes(notes)}
            placeholder="Notes for this fast…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={[styles.notesInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
          />
        </AppCard>
      ) : (
        <AppCard>
          <AppText weight="semibold">Ready for a fast?</AppText>
          <AppText variant="caption" color="dim">
            {store.activePlan
              ? `${store.activePlan.fasting_hours}h fasting / ${store.activePlan.eating_window_hours}h eating window`
              : 'Choose a plan in Settings first.'}
          </AppText>
          <AppButton
            label="Start Fast"
            onPress={() => {
              const result = store.startFast();
              if (result.ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }}
            style={styles.startButton}
          />
        </AppCard>
      )}

      <SectionTitle title="Your Stats" />
      <View style={styles.statsRow}>
        <StatCard flex emoji="✅" label="completed" value={String(stats.totalCompleted)} />
        <StatCard flex emoji="⏳" label="total hours" value={formatHours(stats.totalHours)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard flex emoji="📊" label="average" value={formatHours(stats.averageHours)} />
        <StatCard flex emoji="🔥" label="streak" value={`${stats.currentStreak}d`} sub={`best ${stats.longestStreak}d`} />
      </View>
      <View style={styles.statsRow}>
        <StatCard flex emoji="📅" label="this week" value={formatHours(stats.weekHours)} />
      </View>

      <SectionTitle title="Calendar" />
      <AppCard>
        <CalendarMonthView dayMark={dayMark} compact />
        <View style={styles.legendRow}>
          <Legend color={colors.success} label="completed" />
          <Legend color={colors.warning} label="stopped early" />
          <Legend color={colors.textFaint} label="abandoned" />
        </View>
      </AppCard>

      <SectionTitle title="History" />
      {store.recentSessions.length === 0 ? (
        <EmptyState emoji="⏱️" title="No fasts yet" message="Start your first fast and the timer will handle the rest." />
      ) : (
        <View style={styles.historyList}>
          {store.recentSessions.map((session) => (
            <HistoryRow key={session.id} session={session} onPress={() => router.push(`/fast-detail?id=${session.id}`)} />
          ))}
        </View>
      )}

      <ConfirmDialog
        visible={confirmEnd && !!active?.progress.isComplete}
        title="Complete your fast?"
        message="You reached your target. Ending now will record this fast as completed."
        confirmLabel="Complete fast"
        onConfirm={() => endNow(reason)}
        onCancel={() => {
          setConfirmEnd(false);
          setReason(null);
        }}
      />

      <EndEarlySheet
        visible={endEarlyVisible && !!active && !active.progress.isComplete}
        reason={reason}
        onReason={setReason}
        onClose={() => {
          setEndEarlyVisible(false);
          setReason(null);
        }}
        onConfirm={() => endNow(reason)}
      />

      <ConfirmDialog
        visible={confirmCancel}
        title="Cancel this fast?"
        message="The fast will be recorded as abandoned and will not count toward any stats. Nothing else is lost."
        confirmLabel="Cancel fast"
        danger
        onConfirm={() => {
          store.abandonFast('Cancelled by user');
          setConfirmCancel(false);
        }}
        onCancel={() => setConfirmCancel(false)}
      />

      {editStartVisible && active ? (
        <EditStartSheet
          initialStartIso={active.session.start_time_utc}
          onClose={() => setEditStartVisible(false)}
          onSave={(iso) => {
            const result = store.updateStartTime(iso);
            setEditStartVisible(false);
            if (!result.ok) console.warn(result.error);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="label" color="faint">
        {label}
      </AppText>
    </View>
  );
}

function HistoryRow({ session, onPress }: { session: FastSession; onPress: () => void }) {
  const duration =
    session.status === 'active'
      ? 'in progress'
      : formatDurationHuman(
          new Date(session.actual_end_time_utc ?? session.scheduled_end_time_utc).getTime() -
            new Date(session.start_time_utc).getTime(),
        );
  const dateLabel = formatKeyShort(keyFromIso(session.start_time_utc));
  return (
    <ListItem
      title={`${dateLabel} · ${duration}`}
      subtitle={session.reason_for_stopping ?? undefined}
      onPress={onPress}
      right={<Badge label={session.status.replace('_', ' ')} tone={STATUS_TONE[session.status]} />}
    />
  );
}

/** Shown when ending before the target: captures an optional reason, records stopped_early. */
function EndEarlySheet({
  visible,
  reason,
  onReason,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  reason: string | null;
  onReason: (reason: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title="End fast early">
      <AppText variant="caption" color="dim" style={styles.sheetHint}>
        This fast will be recorded as “stopped early”. Your streak pauses, but your journey
        continues — no judgment, just data.
      </AppText>
      <View style={styles.reasonRow}>
        {EARLY_REASONS.map((r) => (
          <AppChip key={r} label={r} selected={reason === r} onPress={() => onReason(reason === r ? null : r)} />
        ))}
      </View>
      <AppButton label="End fast now" onPress={onConfirm} style={styles.sheetButton} />
    </ModalSheet>
  );
}

/**
 * Start-time correction sheet. Mounted only while open (fresh state each time);
 * the Modal is always "visible" because the parent controls mounting.
 */
function EditStartSheet({
  initialStartIso,
  onClose,
  onSave,
}: {
  initialStartIso: string;
  onClose: () => void;
  onSave: (iso: string) => void;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState(() => {
    const d = new Date(initialStartIso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const handleSave = () => {
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(value.trim());
    if (!match) return;
    const d = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    );
    if (Number.isNaN(d.getTime()) || d.getTime() > Date.now()) return;
    onSave(d.toISOString());
  };

  return (
    <ModalSheet visible onClose={onClose} title="Correct start time">
      <AppText variant="caption" color="dim" style={styles.sheetHint}>
        Format: YYYY-MM-DD HH:MM (your local time). The planned duration stays the same.
      </AppText>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="2026-09-28 18:30"
        placeholderTextColor={colors.textFaint}
        style={[styles.sheetInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
      />
      <AppButton label="Save start time" onPress={handleSave} style={styles.sheetButton} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  timerSection: { alignItems: 'center', paddingVertical: spacing.md },
  ringCenter: { alignItems: 'center', gap: 4, paddingHorizontal: 40 },
  bigTimer: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  flexButton: { flex: 1 },
  secondaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xs },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: spacing.md,
    fontSize: 14,
  },
  startButton: { marginTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  historyList: { gap: 8 },
  sheetHint: { marginBottom: spacing.md },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  sheetButton: { marginBottom: spacing.sm },
});
