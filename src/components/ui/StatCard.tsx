import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  emoji?: string;
  flex?: boolean;
}

export function StatCard({ label, value, sub, emoji, flex = false }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        flex && styles.flex,
      ]}
    >
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <AppText weight="bold" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="label" color="dim" numberOfLines={1}>
        {label}
      </AppText>
      {sub ? (
        <AppText variant="label" color="faint" numberOfLines={1}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  flex: { flex: 1 },
  emoji: { fontSize: 20 },
  value: { fontSize: 19 },
});
