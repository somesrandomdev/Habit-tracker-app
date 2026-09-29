import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, tapTarget } from '@/theme/tokens';
import { AppText } from './AppText';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.surfaceAlt, fg: colors.text },
    ghost: { bg: 'transparent', fg: colors.primary },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[variant];

  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        fullWidth && { alignSelf: 'stretch' },
        variant !== 'ghost' && { backgroundColor: palette.bg },
        isInactive && { opacity: 0.45 },
        pressed && !isInactive && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <AppText weight="semibold" style={{ color: palette.fg, fontSize: size === 'lg' ? 17 : 15 }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    ...tapTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
});
