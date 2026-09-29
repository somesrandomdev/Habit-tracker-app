export interface FastingPlanPreset {
  key: string;
  name: string;
  fasting_hours: number;
  eating_window_hours: number;
  description: string;
}

export const FASTING_PLAN_PRESETS: FastingPlanPreset[] = [
  {
    key: '14:10',
    name: '14:10',
    fasting_hours: 14,
    eating_window_hours: 10,
    description: 'A gentle start. Great for beginners.',
  },
  {
    key: '16:8',
    name: '16:8',
    fasting_hours: 16,
    eating_window_hours: 8,
    description: 'The most popular plan. Balanced and sustainable.',
  },
  {
    key: '18:6',
    name: '18:6',
    fasting_hours: 18,
    eating_window_hours: 6,
    description: 'A step up. Deeper fasts, tighter eating window.',
  },
  {
    key: '20:4',
    name: '20:4',
    fasting_hours: 20,
    eating_window_hours: 4,
    description: 'Advanced. Often called the "Warrior" schedule.',
  },
  {
    key: 'OMAD',
    name: 'OMAD',
    fasting_hours: 23,
    eating_window_hours: 1,
    description: 'One meal a day. For experienced fasters only.',
  },
  {
    key: 'custom',
    name: 'Custom',
    fasting_hours: 16,
    eating_window_hours: 8,
    description: 'Set your own fasting and eating hours.',
  },
];

export interface ChallengePreset {
  type: 'no_added_sugar' | 'strict_no_sugar' | 'custom';
  title: string;
  rules: string;
  description: string;
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    type: 'no_added_sugar',
    title: 'No Added Sugar',
    rules:
      'No added sugars: no candy, desserts, sugary drinks, or foods with added sugar in the label. Whole fruit is allowed.',
    description: 'Cut added sugar while keeping whole fruit.',
  },
  {
    type: 'strict_no_sugar',
    title: 'Strict No Sugar',
    rules:
      'No added sugar and no sweeteners of any kind, including honey, syrups, and fruit juice. Whole fresh fruit in moderation is allowed.',
    description: 'A stricter rule set for a deeper reset.',
  },
  {
    type: 'custom',
    title: 'Custom Challenge',
    rules: '',
    description: 'Write your own rules in your own words.',
  },
];

export const CHALLENGE_DURATIONS = [7, 14, 21, 30, 60];

export interface PresetHabit {
  key: string;
  title: string;
  emoji: string;
}

export const PRESET_HABITS: PresetHabit[] = [
  { key: 'water', title: 'Drink 8 cups of water', emoji: '💧' },
  { key: 'walk', title: 'Walk daily', emoji: '🚶' },
  { key: 'no_late_eating', title: 'No late-night eating', emoji: '🌙' },
  { key: 'sleep', title: 'Sleep 7+ hours', emoji: '😴' },
  { key: 'no_sugary_drinks', title: 'No sugary drinks', emoji: '🥤' },
];

export const CUSTOM_HABIT_EMOJI = '⭐';
export const DEFAULT_HABIT_EMOJI = '🎯';
