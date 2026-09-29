import * as achievementsRepo from '@/repositories/achievements.repo';
import * as challengeService from './challenge.service';
import * as fastingService from './fasting.service';
import * as habitsRepo from '@/repositories/habits.repo';
import type { Achievement } from '@/types/models';
import { diffDays, todayKey } from '@/utils/dates';

export interface AchievementDef {
  key: string;
  title: string;
  emoji: string;
  description: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: 'first_fast', title: 'First Fast', emoji: '🎯', description: 'Complete your first fast.' },
  { key: 'fast_streak_3', title: '3-Day Fast Streak', emoji: '🔥', description: 'Fast to target 3 days in a row.' },
  { key: 'fast_streak_7', title: '7-Day Fast Streak', emoji: '🏆', description: 'Fast to target 7 days in a row.' },
  { key: 'sugar_day_1', title: 'Sugar-Free Day One', emoji: '🍬', description: 'Complete your first sugar-free day.' },
  { key: 'sugar_streak_3', title: '3-Day Sugar Streak', emoji: '🛡️', description: 'Stay on track with the challenge 3 days in a row.' },
  { key: 'sugar_streak_7', title: '7-Day Sugar Streak', emoji: '💎', description: 'Stay on track with the challenge 7 days in a row.' },
  { key: 'hours_30', title: '30 Fasting Hours', emoji: '⏳', description: 'Accumulate 30 total fasting hours.' },
  { key: 'hours_100', title: '100 Fasting Hours', emoji: '🌙', description: 'Accumulate 100 total fasting hours.' },
  { key: 'habits_5_one_day', title: 'Perfect Day', emoji: '✨', description: 'Complete 5 habits in a single day.' },
  { key: 'challenge_completed', title: 'Challenge Finisher', emoji: '🎉', description: 'Complete a full no-sugar challenge.' },
  { key: 'comeback', title: 'Comeback Kid', emoji: '🌅', description: 'Slipped yesterday, showed up today. That is the skill.' },
];

export interface AchievementContext {
  totalCompletedFasts: number;
  currentFastStreak: number;
  totalFastingHours: number;
  currentSugarStreak: number;
  sugarSuccessDays: number;
  habitsCompletedToday: number;
  completedChallenges: number;
  comebackToday: boolean;
}

export function buildContext(): AchievementContext {
  const dateKey = todayKey();
  const fasting = fastingService.getFastingStats(dateKey);
  const state = challengeService.getChallengeState(dateKey);
  const completions = habitsRepo.getCompletions(1, dateKey).filter(
    (c) => c.local_date === dateKey && c.status === 'completed',
  );
  return {
    totalCompletedFasts: fasting.totalCompleted,
    currentFastStreak: fasting.currentStreak,
    totalFastingHours: fasting.totalHours,
    currentSugarStreak: state?.stats.currentStreak ?? 0,
    sugarSuccessDays: state ? state.stats.successDays + state.stats.cravingDays : 0,
    habitsCompletedToday: completions.length,
    completedChallenges: challengeService.countCompletedChallenges(),
    comebackToday: state
      ? challengeService.isComebackDay(state.checkins, dateKey)
      : false,
  };
}

function isSatisfied(key: string, ctx: AchievementContext): boolean {
  switch (key) {
    case 'first_fast':
      return ctx.totalCompletedFasts >= 1;
    case 'fast_streak_3':
      return ctx.currentFastStreak >= 3;
    case 'fast_streak_7':
      return ctx.currentFastStreak >= 7;
    case 'sugar_day_1':
      return ctx.sugarSuccessDays >= 1;
    case 'sugar_streak_3':
      return ctx.currentSugarStreak >= 3;
    case 'sugar_streak_7':
      return ctx.currentSugarStreak >= 7;
    case 'hours_30':
      return ctx.totalFastingHours >= 30;
    case 'hours_100':
      return ctx.totalFastingHours >= 100;
    case 'habits_5_one_day':
      return ctx.habitsCompletedToday >= 5;
    case 'challenge_completed':
      return ctx.completedChallenges >= 1;
    case 'comeback':
      return ctx.comebackToday;
    default:
      return false;
  }
}

/** Persists any newly satisfied achievements and returns them (empty = nothing new). */
export function evaluateAchievements(): Achievement[] {
  const ctx = buildContext();
  const newlyUnlocked = ACHIEVEMENT_DEFS.filter(
    (def) => isSatisfied(def.key, ctx) && !achievementsRepo.isUnlocked(def.key),
  ).map((def) => def.key);
  if (newlyUnlocked.length === 0) return [];
  return achievementsRepo.unlockMany(newlyUnlocked);
}

export function getUnlocked(): Achievement[] {
  return achievementsRepo.getUnlockedAchievements();
}

/** Days since the latest slip/fail check-in of the active challenge (for recovery UI). */
export function recoveryInfo(state: challengeService.ChallengeState | null, dateKey = todayKey()): {
  lastSetback: string | null;
  daysSince: number | null;
} {
  if (!state) return { lastSetback: null, daysSince: null };
  const setbacks = state.checkins
    .filter((c) => c.status === 'slip' || c.status === 'fail')
    .map((c) => c.local_date)
    .sort();
  const last = setbacks.at(-1) ?? null;
  if (!last) return { lastSetback: null, daysSince: null };
  return { lastSetback: last, daysSince: diffDays(dateKey, last) };
}
