import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, tapTarget } from '@/theme/tokens';
import { AppText } from './AppText';

interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

export function AppChip({ label, selected = false, onPress, tone = 'default', disabled = false }: AppChipProps) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? toneColor : colors.surfaceAlt,
          borderColor: selected ? toneColor : colors.border,
        },
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <AppText variant="caption" weight={selected ? 'semibold' : 'medium'} style={{ color: selected ? colors.onPrimary : colors.textDim }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...tapTarget,
    minHeight: 36,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
