export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  accent: string;
  accentSoft: string;
  overlay: string;
  skeleton: string;
}

export const lightPalette: Palette = {
  background: '#F6F8F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F3',
  border: '#E2E9E9',
  text: '#16211F',
  textDim: '#5A6B69',
  textFaint: '#667876',
  primary: '#0F766E',
  primarySoft: '#CCECE8',
  onPrimary: '#FFFFFF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  accent: '#7C3AED',
  accentSoft: '#EDE9FE',
  overlay: 'rgba(15, 33, 31, 0.45)',
  skeleton: '#E5ECEC',
};

export const darkPalette: Palette = {
  background: '#0C1413',
  surface: '#15201F',
  surfaceAlt: '#1C2A28',
  border: '#263735',
  text: '#EDF4F3',
  textDim: '#9DB3B0',
  textFaint: '#6C8280',
  primary: '#2DD4BF',
  primarySoft: '#134E48',
  onPrimary: '#04211E',
  success: '#4ADE80',
  successSoft: '#14351F',
  warning: '#FBBF24',
  warningSoft: '#3B2F12',
  danger: '#F87171',
  dangerSoft: '#3B1717',
  accent: '#A78BFA',
  accentSoft: '#2E2447',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1C2A28',
};
