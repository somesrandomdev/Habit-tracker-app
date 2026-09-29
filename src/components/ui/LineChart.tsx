import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { spacing } from '@/theme/tokens';

export interface LinePoint {
  label: string;
  value: number | null;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

/** Minimal SVG line chart with dots; null values create gaps. Zero-data safe. */
export const LineChart = memo(function LineChart({ data, height = 130, color, min, max }: LineChartProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;
  const valid = data.filter((d) => d.value !== null) as { label: string; value: number }[];

  if (valid.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <AppText variant="caption" color="faint">
          Chart appears once there are at least two entries
        </AppText>
      </View>
    );
  }

  const width = 320;
  const paddingX = 14;
  const chartHeight = height - 26;
  const lo = min ?? Math.min(...valid.map((d) => d.value));
  const hi = max ?? Math.max(...valid.map((d) => d.value));
  const span = Math.max(hi - lo, 0.0001);

  const xFor = (i: number) => paddingX + (i * (width - paddingX * 2)) / Math.max(1, data.length - 1);
  const yFor = (v: number) => 8 + (1 - (v - lo) / span) * (chartHeight - 16);

  const points = data
    .map((d, i) => (d.value === null ? null : `${xFor(i)},${yFor(d.value)}`))
    .filter((p): p is string => p !== null);

  const axisStep = Math.max(1, Math.ceil(data.length / 6));
  const accessibilitySummary = `Line chart with ${valid.length} points, from ${valid[0].value} to ${valid[valid.length - 1].value}`;

  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilitySummary}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline
          points={points.join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {data.map((d, i) =>
          d.value === null ? null : (
            <Circle key={`dot-${d.label}-${i}`} cx={xFor(i)} cy={yFor(d.value)} r={3.5} fill={stroke} />
          ),
        )}
        {data.map((d, i) =>
          i % axisStep === 0 ? (
            <SvgText
              key={`axis-${d.label}-${i}`}
              x={xFor(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={9}
              fill={colors.textFaint}
            >
              {d.label}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.md },
});
