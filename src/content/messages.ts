export const RECOVERY_MESSAGES: Record<'slip' | 'fail', string[]> = {
  slip: [
    'A slip is a moment, not a trend. Your challenge progress is still intact — today is a fresh page.',
    'You noticed, you logged it, and you are still here. That is exactly how recovery works.',
    'One off-plan bite never erased anyone’s progress. The next decision is what counts.',
  ],
  fail: [
    'Tough day. The challenge is still yours — pick it back up right now, no restart required.',
    'Streaks reset, journeys do not. Everything you learned is still with you.',
    'The strongest habit isn’t never falling — it’s how quickly you stand back up.',
  ],
};

export const CELEBRATION_MESSAGES: Record<string, { title: string; body: string[] }> = {
  fast: {
    title: 'Fast Complete!',
    body: [
      'You hit your target window. Your body thanks you — hydrate well and eat gently.',
      'Target reached! Notice how you feel right now. This is the win you came for.',
    ],
  },
  challenge: {
    title: 'Challenge Complete!',
    body: [
      'You finished the entire no-sugar challenge. Not perfect — finished. That is what matters.',
      'Full distance covered. The discipline you built here is portable — take it anywhere.',
    ],
  },
  milestone: {
    title: 'Milestone Unlocked!',
    body: ['You are building something bigger than a streak. Keep showing up.'],
  },
};

export const EMPTY_STATE_COPY = {
  habitsToday: {
    emoji: '🌤️',
    title: 'No habits scheduled today',
    message: 'Enjoy the rest day, or add a habit that fits your week.',
  },
  noChallenge: {
    emoji: '🍬',
    title: 'No challenge running',
    message: 'Start a no-sugar challenge and build momentum one day at a time.',
  },
  noFasts: {
    emoji: '⏱️',
    title: 'No fasts yet',
    message: 'Start your first fast and the timer will handle the rest.',
  },
  noInsights: {
    emoji: '📊',
    title: 'Not enough data yet',
    message: 'Track a few days and your charts will come to life here.',
  },
} as const;
