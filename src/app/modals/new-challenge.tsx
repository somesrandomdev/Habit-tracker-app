import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppChip } from '@/components/ui/AppChip';
import { AppToggle } from '@/components/ui/AppToggle';
import { CHALLENGE_DURATIONS } from '@/constants/presets';
import { updateNotificationPref } from '@/repositories/settings.repo';
import * as notificationsService from '@/services/notifications.service';
import { addDaysToKey, formatKeyFriendly, todayKey } from '@/utils/dates';
import type { ChallengeType } from '@/types/models';

type TypeChoice = Exclude<ChallengeType, 'custom'> | 'custom';

const TYPES: { value: TypeChoice; label: string; rules: string }[] = [
  { value: 'no_added_sugar', label: 'No added sugar', rules: 'No added sugars: no candy, desserts, sugary drinks, or foods with added sugar in the label. Whole fruit is allowed.' },
  { value: 'strict_no_sugar', label: 'Strict no sugar', rules: 'No added sugar and no sweeteners of any kind, including honey, syrups, and fruit juice. Whole fresh fruit in moderation is allowed.' },
  { value: 'custom', label: 'Custom rules', rules: '' },
];

export default function NewChallengeModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const startNew = useChallengeStore((s) => s.startNew);

  const [type, setType] = useState<TypeChoice>('no_added_sugar');
  const [duration, setDuration] = useState(21);
  const [customRules, setCustomRules] = useState('');
  const [withReminder, setWithReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const end = addDaysToKey(todayKey(), duration - 1);
  const rulesText = type === 'custom' ? customRules : (TYPES.find((t) => t.value === type)?.rules ?? '');

  const handleStart = () => {
    if (type === 'custom' && !customRules.trim()) {
      setError('Describe your custom rules first.');
      return;
    }
    const title = TYPES.find((t) => t.value === type)?.label ?? 'No Sugar Challenge';
    const result = startNew({ type, title, rules: rulesText, durationDays: duration });
    if (result.ok) {
      if (withReminder) {
        updateNotificationPref('checkin_reminder', true, '19:00');
        notificationsService.syncNotifications();
      }
      router.back();
    } else {
      setError(result.error ?? 'Could not start the challenge.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="New no-sugar challenge" showBack />

      <AppCard>
        <AppText weight="medium">Rule set</AppText>
        <View style={styles.typeList}>
          {TYPES.map((t) => (
            <AppChip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
          ))}
        </View>
        {type !== 'custom' ? (
          <AppText variant="caption" color="dim" style={styles.rulesPreview}>
            {TYPES.find((t) => t.value === type)?.rules}
          </AppText>
        ) : (
          <View style={styles.customRules}>
            <AppTextInput
              label="Your rules"
              value={customRules}
              onChangeText={setCustomRules}
              placeholder="Write the rules you will follow…"
              multiline
              maxLength={500}
            />
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText weight="medium">Duration</AppText>
        <View style={styles.durationRow}>
          {CHALLENGE_DURATIONS.map((d) => (
            <AppChip key={d} label={`${d} days`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
        <AppText variant="caption" color="dim">
          {formatKeyFriendly(todayKey())} → {formatKeyFriendly(end)}
        </AppText>
      </AppCard>

      <AppCard>
        <AppToggle
          label="Remind me to check in daily"
          description="A gentle local notification each evening while the challenge runs. Time is configurable in Settings."
          value={withReminder}
          onValueChange={setWithReminder}
        />
      </AppCard>

      <AppCard>
        <AppText variant="caption" color="dim">
          💚 Remember: a slip resets your streak, not your challenge. Progress is never erased here.
        </AppText>
      </AppCard>

      <AppButton label="Start challenge" onPress={handleStart} />
      {error ? (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  typeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md, marginBottom: spacing.sm },
  rulesPreview: { marginTop: 4 },
  customRules: { marginTop: spacing.sm },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md, marginBottom: spacing.sm },
});
