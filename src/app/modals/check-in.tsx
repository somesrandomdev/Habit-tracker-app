import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppChip } from '@/components/ui/AppChip';
import { getRecoveryMessage } from '@/services/content.service';
import { diffDays, formatKeyFriendly, todayKey } from '@/utils/dates';
import type { CheckInStatus } from '@/types/models';

const STATUS_OPTIONS: { value: CheckInStatus; label: string; emoji: string; description: string }[] = [
  { value: 'success', label: 'Success', emoji: '✅', description: 'Fully followed the rules today.' },
  { value: 'craving_only', label: 'Cravings only', emoji: '💪', description: 'Stayed on track despite cravings.' },
  { value: 'slip', label: 'Slip', emoji: '😳', description: 'A minor off-plan moment.' },
  { value: 'fail', label: 'Fail', emoji: '🌧️', description: 'A major off-plan day.' },
];

const TRIGGERS = ['stress', 'boredom', 'social event', 'tiredness', 'habit', 'other'];

export default function DailyCheckInModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const store = useChallengeStore();
  const challenge = store.state?.challenge ?? null;
  const existing = store.state?.checkins.find((c) => c.local_date === todayKey()) ?? null;

  const [status, setStatus] = useState<CheckInStatus>(existing?.status ?? 'success');
  const [craving, setCraving] = useState(existing?.craving_intensity ?? 3);
  const [trigger, setTrigger] = useState<string | null>(existing?.trigger_type ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSave = () => {
    setBusy(true);
    const result = store.checkIn({
      status,
      craving_intensity: craving,
      trigger_type: trigger,
      note: note.trim() || null,
    });
    setBusy(false);
    if (result.ok) {
      Haptics.notificationAsync(
        status === 'slip' || status === 'fail'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      if (status === 'slip' || status === 'fail') {
        setRecovery(getRecoveryMessage(status, todayKey()));
      } else {
        router.back();
      }
    } else {
      setError(result.error ?? 'Could not save check-in.');
    }
  };

  if (!challenge) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xl }]}>
        <AppHeader title="Check-in" showBack />
        <AppText color="dim" style={styles.noChallenge}>
          There is no active challenge to check in against.
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
          automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
>
      <AppHeader
        title={existing ? 'Update today’s check-in' : 'Daily check-in'}
        subtitle={challenge ? `${formatKeyFriendly(todayKey())}` : undefined}
        showBack
      />
      <AppCard>
        <AppText variant="caption" color="dim">
          {challenge.title} · Day {Math.min(diffDays(todayKey(), challenge.start_date) + 1, diffDays(challenge.end_date, challenge.start_date) + 1)}
          {' '}of {diffDays(challenge.end_date, challenge.start_date) + 1}
        </AppText>
      </AppCard>

      {STATUS_OPTIONS.map((option) => (
        <AppCard
          key={option.value}
          onPress={() => setStatus(option.value)}
          style={status === option.value && [styles.selected, { borderColor: colors.primary }]}
        >
          <View style={styles.statusRow}>
            <AppText style={styles.statusEmoji}>{option.emoji}</AppText>
            <View style={styles.statusText}>
              <AppText weight="semibold">{option.label}</AppText>
              <AppText variant="caption" color="dim">
                {option.description}
              </AppText>
            </View>
          </View>
        </AppCard>
      ))}

      <AppCard>
        <AppText weight="medium">Craving intensity: {craving}/10</AppText>
        <Slider
          accessibilityLabel="Craving intensity"
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={craving}
          onSlidingComplete={(v) => setCraving(v)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          style={styles.slider}
        />
        <View style={styles.sliderLabels}>
          <AppText variant="label" color="faint">none</AppText>
          <AppText variant="label" color="faint">overwhelming</AppText>
        </View>

        <AppText weight="medium" style={styles.sectionLabel}>
          What triggered cravings? (optional)
        </AppText>
        <View style={styles.chipsRow}>
          {TRIGGERS.map((t) => (
            <AppChip key={t} label={t} selected={trigger === t} onPress={() => setTrigger(trigger === t ? null : t)} />
          ))}
        </View>
      </AppCard>

      <AppTextInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="Anything worth remembering about today…"
        multiline
        maxLength={500}
      />

      {recovery ? (
        <AppCard style={{ backgroundColor: colors.successSoft }}>
          <AppText weight="semibold" color="success">
            💚 Check-in saved
          </AppText>
          <AppText variant="caption">{recovery}</AppText>
          <AppButton label="Back to challenge" onPress={() => router.back()} style={styles.recoveryButton} />
        </AppCard>
      ) : (
        <>
          <AppButton label={existing ? 'Update check-in' : 'Save check-in'} onPress={handleSave} loading={busy} />
          {error ? (
            <AppText variant="caption" color="danger" align="center">
              {error}
            </AppText>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusEmoji: { fontSize: 24 },
  statusText: { flex: 1, gap: 2 },
  selected: { borderWidth: 2 },
  slider: { marginTop: spacing.md },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noChallenge: { padding: spacing.xl },
  recoveryButton: { marginTop: spacing.md },
});
