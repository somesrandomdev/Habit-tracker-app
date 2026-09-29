import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface StreakPillProps {
  count: number;
  label?: string;
  emoji?: string;
}

/** Flame-style streak indicator. Hidden when the streak is zero. */
export function StreakPill({ count, label = 'day streak', emoji = '🔥' }: StreakPillProps) {
  if (count <= 0) return null;
  return (
    <View style={styles.pill} accessibilityLabel={`${count} ${label}`}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText weight="bold">{count}</AppText>
      <AppText variant="caption" color="dim">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emoji: { fontSize: 15 },
});
