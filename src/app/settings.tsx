import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import expoConfig from 'expo-constants';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { upsertProfile } from '@/repositories/profile.repo';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppToggle } from '@/components/ui/AppToggle';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ListItem } from '@/components/ui/ListItem';
import type { Goal, NotificationCategory } from '@/types/models';

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'Lose weight',
  quit_sugar: 'Quit sugar',
  build_habits: 'Build habits',
  improve_energy: 'Improve energy',
  all: 'All of the above',
};

const CATEGORY_INFO: Record<NotificationCategory, { label: string; description: string; hasTime: boolean }> = {
  fast_start: { label: 'Fasting start reminder', description: 'A daily nudge to begin your fast', hasTime: true },
  fast_end: { label: 'Fast complete', description: 'When your fast hits its target', hasTime: false },
  checkin_reminder: { label: 'Challenge check-in', description: 'Daily reminder to check in', hasTime: true },
  habit_reminder: { label: 'Habit reminders', description: 'Per-habit times, set on each habit', hasTime: false },
  wellness_reminder: { label: 'Daily wellness log', description: 'Reminder to log mood and water', hasTime: true },
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const settings = useSettingsStore((s) => s.settings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const notifPrefs = useSettingsStore((s) => s.notifPrefs);
  const setNotifPref = useSettingsStore((s) => s.setNotifPref);
  const plans = useFastingStore((s) => s.plans);
  const activatePlan = useFastingStore((s) => s.activatePlan);
  const permissionGranted = useSettingsStore((s) => s.permissionGranted);

  const notifEnabled = (category: NotificationCategory) =>
    notifPrefs.find((p) => p.category === category)?.enabled === 1;

  const notifTime = (category: NotificationCategory) =>
    notifPrefs.find((p) => p.category === category)?.time ?? null;

  const updateProfileField = (patch: { name?: string; goal?: Goal }) => {
    upsertProfile({
      name: patch.name ?? profile?.name ?? '',
      goal: patch.goal ?? profile?.goal ?? 'all',
      experience: profile?.experience ?? 'beginner',
    });
    refreshProfile();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <AppHeader title="Settings" showBack />

      <SectionTitle title="Profile" />
      <AppCard>
        <AppTextInput
          label="Display name"
          value={profile?.name ?? ''}
          onChangeText={(name) => updateProfileField({ name })}
          placeholder="Your name"
          maxLength={40}
        />
        <AppSelect
          label="Primary goal"
          value={profile?.goal ?? 'all'}
          options={Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(value) => updateProfileField({ goal: value as Goal })}
        />
      </AppCard>

      <SectionTitle title="Preferences" />
      <AppCard>
        <AppSelect
          label="Theme"
          value={settings.theme}
          options={[
            { value: 'system', label: 'Follow system' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(v) => setTheme(v as 'system' | 'light' | 'dark')}
        />
        <AppSelect
          label="Units"
          value={settings.units}
          options={[
            { value: 'metric', label: 'Metric (kg, cm)' },
            { value: 'imperial', label: 'Imperial (lb, in)' },
          ]}
          onChange={(v) => setUnits(v as 'metric' | 'imperial')}
        />
      </AppCard>

      <SectionTitle title="Default fasting plan" />
      <AppCard>
        {plans.map((plan) => (
          <ListItem
            key={plan.id}
            title={plan.name}
            subtitle={`${plan.fasting_hours}h fasting / ${plan.eating_window_hours}h eating`}
            onPress={() => activatePlan(plan.id)}
            right={<AppText color={plan.active === 1 ? 'primary' : 'faint'} weight="medium">{plan.active === 1 ? 'Active' : 'Use'}</AppText>}
          />
        ))}
      </AppCard>

      <SectionTitle title="Notifications" />
      <AppCard>
        <AppText variant="caption" color={permissionGranted ? 'success' : 'warning'} style={styles.permissionNote}>
          {permissionGranted ? 'Permission granted ✓' : 'Permission not granted — the app will show in-app reminder cards instead.'}
        </AppText>
        {(Object.keys(CATEGORY_INFO) as NotificationCategory[]).map((category) => (
          <AppToggle
            key={category}
            label={CATEGORY_INFO[category].label}
            description={CATEGORY_INFO[category].description}
            value={notifEnabled(category)}
            onValueChange={(enabled) => {
              setNotifPref(category, enabled, notifTime(category));
            }}
          />
        ))}
        {(['fast_start', 'checkin_reminder', 'wellness_reminder'] as NotificationCategory[])
          .filter((c) => notifEnabled(c))
          .map((category) => (
            <View key={`time-${category}`} style={styles.timeRow}>
              <AppText variant="label" color="dim">
                {CATEGORY_INFO[category].label} time
              </AppText>
              <View style={styles.timeChips}>
                {['08:00', '12:30', '18:00', '19:00', '21:00'].map((t) => (
                  <AppText
                    key={t}
                    variant="caption"
                    color={notifTime(category) === t ? 'primary' : 'dim'}
                    weight={notifTime(category) === t ? 'semibold' : 'regular'}
                    onPress={() => setNotifPref(category, true, t)}
                    style={styles.timeChip}
                  >
                    {t}
                  </AppText>
                ))}
              </View>
            </View>
          ))}
      </AppCard>

      <SectionTitle title="Data" />
      <AppCard>
        <ListItem title="Export, import & reset" subtitle="Back up your data as JSON, load demo data, or start fresh" onPress={() => router.push('/data-management')} />
      </AppCard>

      <SectionTitle title="Safety" />
      <AppCard>
        <AppText variant="caption" color="dim">
          🩺 FastHabit is not medical advice. If you are pregnant, under 18, have a medical
          condition or a history of eating disorders, consult a professional before fasting. Be kind
          to yourself — slips are part of the process, and every day is a fresh start.
        </AppText>
      </AppCard>

      <SectionTitle title="About" />
      <AppCard>
        <AppText variant="label" color="dim">
          PRIVACY
        </AppText>
        <AppText variant="caption" color="dim" style={styles.aboutText}>
          FastHabit is local-first: no account, no analytics, no tracking, no network calls. Every
          fast, check-in, habit, and measurement lives only in this device&apos;s database. Data leaves
          the device only when you explicitly export or share a backup file.
        </AppText>
        <AppText variant="label" color="dim" style={styles.aboutLabel}>
          HOW TO USE THIS APP RESPONSIBLY
        </AppText>
        <AppText variant="caption" color="dim" style={styles.aboutText}>
          FastHabit is a tracking and motivation tool, not a diet plan. Fast within your comfort
          level, never fast through genuine distress, and break a fast whenever your body asks you
          to. Slips are expected and never erase your progress here.
        </AppText>
        <AppText variant="label" color="dim" style={styles.aboutLabel}>
          VERSION
        </AppText>
        <AppText variant="caption" color="dim">
          FastHabit v{expoConfig?.version ?? '1.0.0'} · offline-first · made for personal use
        </AppText>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  permissionNote: { marginBottom: spacing.sm },
  timeRow: { marginTop: spacing.sm, gap: 6 },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { paddingVertical: 6, paddingHorizontal: 4 },
  aboutLabel: { marginTop: spacing.md, marginBottom: 4 },
  aboutText: { lineHeight: 20 },
});
