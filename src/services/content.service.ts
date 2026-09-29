import { COPING_STRATEGIES, FASTING_TIPS, QUOTES, SUGAR_TIPS } from '@/content/content';
import { CELEBRATION_MESSAGES, RECOVERY_MESSAGES } from '@/content/messages';
import type { CheckInStatus } from '@/types/models';
import { dayOfYear, todayKey } from '@/utils/dates';

/** Deterministic daily rotation — same quote for everyone on the same local day. */
export function getDailyQuote(dateKey: string): { text: string; author: string } {
  const index = dayOfYear(dateKey) % QUOTES.length;
  return QUOTES[index];
}

export function getTipOfDay(tipType: 'fasting' | 'sugar', dateKey: string): string {
  const tips = tipType === 'fasting' ? FASTING_TIPS : SUGAR_TIPS;
  return tips[dayOfYear(dateKey) % tips.length];
}

export function getCopingStrategy(dateKey: string): string {
  return COPING_STRATEGIES[dayOfYear(dateKey) % COPING_STRATEGIES.length];
}

export function getRecoveryMessage(status: Extract<CheckInStatus, 'slip' | 'fail'>, dateKey: string): string {
  const list = RECOVERY_MESSAGES[status];
  return list[dayOfYear(dateKey) % list.length];
}

export type CelebrationType = keyof typeof CELEBRATION_MESSAGES;

export function getCelebrationMessage(type: CelebrationType): string {
  const body = CELEBRATION_MESSAGES[type]?.body ?? CELEBRATION_MESSAGES.milestone.body;
  return body[dayOfYear(todayKey()) % body.length];
}
