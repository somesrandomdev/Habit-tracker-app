import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { spacing } from '@/theme/tokens';

export interface BarDatum {
  label: string;
  value: number;
  highlighted?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  valueFormatter?: (value: number) => string;
}

/** Simple SVG bar chart. Renders a friendly zero-state when there is no data. */
export const BarChart = memo(function BarChart({ data, height = 140, color, valueFormatter }: BarChartProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;

  if (data.every((d) => d.value === 0)) {
    return (
      <View style={[styles.empty, { height }]}>
        <AppText variant="caption" color="faint">
          No data for this period yet
        </AppText>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 0.0001);
  const width = 320;
  const barGap = 8;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;
  const chartHeight = height - 34;
  const accessibilitySummary = `Bar chart: ${data.map((d) => `${d.label} ${valueFormatter ? valueFormatter(d.value) : d.value}`).join(', ')}`;

  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilitySummary}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * chartHeight);
          const x = i * (barWidth + barGap);
          return (
            <Rect
              key={`${d.label}-${i}`}
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={d.highlighted ? stroke : colors.surfaceAlt}
            />
          );
        })}
        {data.map((d, i) => (
          <SvgText
            key={`label-${d.label}-${i}`}
            x={i * (barWidth + barGap) + barWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize={10}
            fill={colors.textFaint}
          >
            {d.label}
          </SvgText>
        ))}
        {data.map((d, i) =>
          d.value > 0 && valueFormatter ? (
            <SvgText
              key={`value-${d.label}-${i}`}
              x={i * (barWidth + barGap) + barWidth / 2}
              y={chartHeight - Math.max(2, (d.value / max) * chartHeight) - 4}
              textAnchor="middle"
              fontSize={9}
              fill={colors.textDim}
            >
              {valueFormatter(d.value)}
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
