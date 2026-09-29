import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/tokens';
import { AppText } from './AppText';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'primary';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'default' }: BadgeProps) {
  const { colors } = useTheme();
  const map: Record<Tone, { bg: string; fg: string }> = {
    default: { bg: colors.surfaceAlt, fg: colors.textDim },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  };
  const t = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <AppText variant="label" weight="semibold" style={{ color: t.fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
