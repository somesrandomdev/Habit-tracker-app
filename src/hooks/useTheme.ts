import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightPalette, darkPalette, type Palette } from '@/theme/palette';
import { useSettingsStore } from '@/stores/useSettingsStore';

export interface Theme {
  colors: Palette;
  isDark: boolean;
}

/**
 * Resolves the active palette from the user's theme preference (system/light/dark).
 * Falls back to light when used outside the store (e.g. isolated component tests).
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const theme = useSettingsStore((s) => s.settings.theme);
  return useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && scheme === 'dark');
    return { colors: isDark ? darkPalette : lightPalette, isDark };
  }, [theme, scheme]);
}
