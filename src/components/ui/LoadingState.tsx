import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme/tokens';

/** Pulsing skeleton placeholder shown while stores hydrate. */
export function LoadingState({ lines = 3 }: { lines?: number }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container} accessibilityLabel="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Animated.View
          key={i}
          style={[styles.line, { backgroundColor: colors.skeleton, opacity, width: i === lines - 1 ? '55%' : '100%' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingVertical: spacing.md },
  line: { height: 18, borderRadius: radius.md },
});
