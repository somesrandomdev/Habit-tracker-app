import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useLogsStore } from '@/stores/useLogsStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppChip } from '@/components/ui/AppChip';
import { formatKeyFriendly, todayKey } from '@/utils/dates';

const SCALE_5 = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

export default function WellnessLogModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const todayLog = useLogsStore((s) => s.todayLog);
  const saveLog = useLogsStore((s) => s.saveLog);

  const [mood, setMood] = useState<number | null>(todayLog?.mood ?? null);
  const [hunger, setHunger] = useState<number | null>(todayLog?.hunger ?? null);
  const [energy, setEnergy] = useState<number | null>(todayLog?.energy ?? null);
  const [craving, setCraving] = useState(todayLog?.craving_intensity ?? 3);
  const [water, setWater] = useState(todayLog?.water_cups ?? 0);
  const [note, setNote] = useState(todayLog?.note ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveLog({ mood, hunger, energy, craving_intensity: craving, water_cups: water, note: note.trim() || null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
    setTimeout(() => router.back(), 450);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Daily wellness log" subtitle={formatKeyFriendly(todayKey())} showBack />

      <AppCard>
        <ScaleRow label="😊 Mood" hint="1 = low · 5 = great" value={mood} onChange={setMood} />
      </AppCard>
      <AppCard>
        <ScaleRow label="🍽️ Hunger" hint="1 = none · 5 = constant" value={hunger} onChange={setHunger} />
      </AppCard>
      <AppCard>
        <ScaleRow label="🔋 Energy" hint="1 = drained · 5 = buzzing" value={energy} onChange={setEnergy} />
      </AppCard>

      <AppCard>
        <View style={styles.waterRow}>
          <AppText weight="medium">💧 Water: {water} cups</AppText>
          <View style={styles.stepperRow}>
            <AppButton label="−" variant="secondary" onPress={() => setWater((w) => Math.max(0, w - 1))} style={styles.stepper} />
            <AppButton label="＋" variant="secondary" onPress={() => setWater((w) => Math.min(20, w + 1))} style={styles.stepper} />
          </View>
        </View>

        <AppText weight="medium" style={styles.cravingLabel}>
          🍬 Craving intensity: {craving}/10
        </AppText>
        <View style={styles.cravingChips}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <AppChip key={v} label={String(v)} selected={craving === v} onPress={() => setCraving(v)} />
          ))}
        </View>
      </AppCard>

      <AppTextInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="How did today feel?" multiline maxLength={500} />

      <AppButton label={saved ? 'Saved ✓' : todayLog ? 'Update today’s log' : 'Save today’s log'} onPress={handleSave} />
    </ScrollView>
  );
}

function ScaleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <View>
      <View style={styles.scaleHeader}>
        <AppText weight="medium">{label}</AppText>
        <AppText variant="label" color="faint">
          {hint}
        </AppText>
      </View>
      <View style={styles.scaleRow}>
        {SCALE_5.map((option) => (
          <AppChip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(value === option.value ? null : option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  scaleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperRow: { flexDirection: 'row', gap: spacing.sm },
  stepper: { minWidth: 52, paddingHorizontal: 0 },
  cravingLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  cravingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
