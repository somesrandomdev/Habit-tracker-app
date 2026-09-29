import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, tapTarget } from '@/theme/tokens';
import { AppText } from './AppText';

interface ListItemProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export function ListItem({ title, subtitle, emoji, right, onPress, disabled = false }: ListItemProps) {
  const { colors } = useTheme();
  const body = (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, disabled && { opacity: 0.5 }]}>
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <View style={styles.textCol}>
        <AppText weight="medium" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="dim" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? <AppText color="faint">›</AppText>}
    </View>
  );
  if (onPress && !disabled) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: {
    ...tapTarget,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emoji: { fontSize: 22 },
  textCol: { flex: 1, gap: 2 },
});
