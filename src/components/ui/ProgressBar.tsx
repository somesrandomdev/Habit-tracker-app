import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/tokens';

interface ProgressBarProps {
  ratio: number; // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ ratio, height = 8, color, trackColor }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor ?? colors.surfaceAlt }]}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
