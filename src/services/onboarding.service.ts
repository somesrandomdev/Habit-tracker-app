import { getDb } from '@/db/database';
import * as challengeRepo from '@/repositories/challenge.repo';
import * as fastingRepo from '@/repositories/fasting.repo';
import * as habitsRepo from '@/repositories/habits.repo';
import { markOnboarded, upsertProfile } from '@/repositories/profile.repo';
import { ensureNotificationPrefs, updateNotificationPref } from '@/repositories/settings.repo';
import { CUSTOM_HABIT_EMOJI, DEFAULT_HABIT_EMOJI, FASTING_PLAN_PRESETS, PRESET_HABITS } from '@/constants/presets';
import type { OnboardingDraft } from '@/types/models';
import { addDaysToKey, hoursPlanLabel, todayKey } from '@/utils/dates';

export interface OnboardingResult {
  ok: boolean;
  error?: string;
}

export function defaultOnboardingDraft(): OnboardingDraft {
  return {
    name: '',
    goal: 'all',
    safetyAccepted: false,
    planKey: '16:8',
    customFastingHours: null,
    customEatingHours: null,
    challengeType: 'no_added_sugar',
    customRules: '',
    durationDays: 21,
    presetHabitKeys: ['water', 'no_sugary_drinks'],
    customHabits: [],
    notificationsEnabled: true,
  };
}

export function validateDraft(draft: OnboardingDraft): string | null {
  if (draft.planKey === 'custom') {
    const f = draft.customFastingHours;
    const e = draft.customEatingHours;
    if (f === null || e === null) return 'Set both fasting and eating hours for a custom plan.';
    if (!(f > 0 && f < 24) || !(e > 0 && e < 24)) return 'Fasting and eating hours must be between 1 and 23.';
    if (f + e !== 24) return 'Fasting and eating hours must add up to 24.';
  }
  if (draft.challengeType === 'custom' && !draft.customRules.trim()) {
    return 'Describe your custom challenge rules (one line is enough).';
  }
  if (draft.presetHabitKeys.length === 0 && draft.customHabits.length === 0) {
    return 'Pick at least one habit, or add your own.';
  }
  return null;
}

/** Creates everything onboarding promised, in one transaction. */
export function completeOnboarding(draft: OnboardingDraft): OnboardingResult {
  const validationError = validateDraft(draft);
  if (validationError) return { ok: false, error: validationError };

  const db = getDb();
  try {
    db.withTransactionSync(() => {
      upsertProfile({
        name: draft.name.trim(),
        goal: draft.goal,
        experience: 'beginner',
        onboarded_at: null, // flipped after everything below succeeds
      });

      const preset = FASTING_PLAN_PRESETS.find((p) => p.key === draft.planKey) ?? FASTING_PLAN_PRESETS[1];
      const isCustom = preset.key === 'custom';
      fastingRepo.createPlan({
        name: isCustom
          ? hoursPlanLabel(draft.customFastingHours as number, draft.customEatingHours as number)
          : preset.name,
        fasting_hours: isCustom ? (draft.customFastingHours as number) : preset.fasting_hours,
        eating_window_hours: isCustom ? (draft.customEatingHours as number) : preset.eating_window_hours,
        is_custom: isCustom,
      });

      const challengePresetKey = draft.challengeType;
      const title =
        challengePresetKey === 'no_added_sugar'
          ? 'No Added Sugar'
          : challengePresetKey === 'strict_no_sugar'
            ? 'Strict No Sugar'
            : 'Custom Challenge';
      const rulesText =
        challengePresetKey === 'custom' ? draft.customRules.trim() : defaultRulesFor(challengePresetKey);
      const start = todayKey();
      challengeRepo.createChallenge({
        title,
        challenge_type: draft.challengeType,
        rules_text: rulesText,
        start_date: start,
        end_date: addDaysToKey(start, draft.durationDays - 1),
      });

      for (const key of draft.presetHabitKeys) {
        const presetHabit = PRESET_HABITS.find((h) => h.key === key);
        if (!presetHabit) continue;
        habitsRepo.createHabit({
          title: presetHabit.title,
          emoji: presetHabit.emoji,
          schedule_type: 'daily',
          scheduled_days: [],
          reminder_time: null,
        });
      }
      for (const titleText of draft.customHabits) {
        if (!titleText.trim()) continue;
        habitsRepo.createHabit({
          title: titleText.trim().slice(0, 60),
          emoji: CUSTOM_HABIT_EMOJI || DEFAULT_HABIT_EMOJI,
          schedule_type: 'daily',
          scheduled_days: [],
          reminder_time: null,
        });
      }

      ensureNotificationPrefs();
      if (draft.notificationsEnabled) {
        updateNotificationPref('fast_end', true, null);
        updateNotificationPref('checkin_reminder', true, '19:00');
      }

      markOnboarded();
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `Setup failed: ${error.message}` : 'Setup failed.',
    };
  }
}

function defaultRulesFor(type: 'no_added_sugar' | 'strict_no_sugar' | 'custom'): string {
  if (type === 'no_added_sugar') {
    return 'No added sugars: no candy, desserts, sugary drinks, or foods with added sugar in the label. Whole fruit is allowed.';
  }
  if (type === 'strict_no_sugar') {
    return 'No added sugar and no sweeteners of any kind, including honey, syrups, and fruit juice. Whole fresh fruit in moderation is allowed.';
  }
  return '';
}
