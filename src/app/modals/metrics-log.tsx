import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useLogsStore } from '@/stores/useLogsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { latestEntry, displayWeight, displayLength, toStoredWeight, toStoredLength } from '@/utils/metrics';
import { formatKeyFriendly, todayKey } from '@/utils/dates';

export default function MetricsLogModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const metrics = useLogsStore((s) => s.metrics);
  const saveMetric = useLogsStore((s) => s.saveMetric);
  const units = useSettingsStore((s) => s.settings.units);

  const existing = useMemoLatest(metrics);
  const [weight, setWeight] = useState(
    existing?.weight !== null && existing?.weight !== undefined ? String(displayWeight(existing.weight, units)) : '',
  );
  const [waist, setWaist] = useState(
    existing?.waist !== null && existing?.waist !== undefined ? String(displayLength(existing.waist, units)) : '',
  );
  const [bodyFat, setBodyFat] = useState(
    existing?.body_fat !== null && existing?.body_fat !== undefined ? String(existing.body_fat) : '',
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const weightNum = weight.trim() === '' ? null : Number(weight.replace(',', '.'));
    const waistNum = waist.trim() === '' ? null : Number(waist.replace(',', '.'));
    const fatNum = bodyFat.trim() === '' ? null : Number(bodyFat.replace(',', '.'));
    if (weightNum !== null && (!Number.isFinite(weightNum) || weightNum <= 0 || weightNum > 1000)) {
      setError('Weight looks off — please check it.');
      return;
    }
    if (fatNum !== null && (!Number.isFinite(fatNum) || fatNum < 0 || fatNum > 70)) {
      setError('Body fat must be a percentage between 0 and 70.');
      return;
    }
    saveMetric({
      weight: weightNum !== null ? toStoredWeight(weightNum, units) : null,
      waist: waistNum !== null ? toStoredLength(waistNum, units) : null,
      body_fat: fatNum,
      note: note.trim() || null,
    });
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader
        title="Log body metrics"
        subtitle={`${formatKeyFriendly(todayKey())}${existing ? ' · editing today' : ''}`}
        showBack
      />

      <AppCard>
        <AppText variant="caption" color="dim">
          All fields optional. Values are stored privately on your device in
          {units === 'metric' ? ' kilograms and centimeters.' : ' pounds and inches.'}
        </AppText>
      </AppCard>

      <AppTextInput
        label={`Weight (${units === 'metric' ? 'kg' : 'lb'})`}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder={units === 'metric' ? 'e.g. 78.5' : 'e.g. 173'}
      />
      <AppTextInput
        label={`Waist (${units === 'metric' ? 'cm' : 'in'})`}
        value={waist}
        onChangeText={setWaist}
        keyboardType="numeric"
        placeholder={units === 'metric' ? 'e.g. 86' : 'e.g. 34'}
      />
      <AppTextInput label="Body fat (%)" value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" placeholder="e.g. 23.5" />
      <AppTextInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="Morning, after workout…" multiline maxLength={300} />

      <AppButton label="Save metrics" onPress={handleSave} />
      {error ? (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

function useMemoLatest(metrics: Parameters<typeof latestEntry>[0]) {
  const latest = latestEntry(metrics);
  const today = todayKey();
  if (latest && latest.local_date === today) return latest;
  return null;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
