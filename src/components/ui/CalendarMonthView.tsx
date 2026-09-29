import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { dateFromKey, diffDays, todayKey } from '@/utils/dates';

export interface DayMark {
  color: string;
  /** Optional short label rendered inside the dot (e.g. day number of a challenge). */
  label?: string;
}

interface CalendarMonthViewProps {
  /** Returns a mark for a day, or null for no mark. Future days never show marks. */
  dayMark?: (dateKey: string) => DayMark | null;
  selected?: string | null;
  onSelectDay?: (dateKey: string) => void;
  initialMonth?: string; // any date key within the month to show first
  compact?: boolean;
}

/** Month calendar with colored day dots. Monday-first. */
export const CalendarMonthView = memo(function CalendarMonthView({
  dayMark,
  selected = null,
  onSelectDay,
  initialMonth,
  compact = false,
}: CalendarMonthViewProps) {
  const { colors } = useTheme();
  const [cursor, setCursor] = useState(() => (initialMonth ? dateFromKey(initialMonth) : new Date()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = todayKey();

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }),
  ];

  // Reading the wall clock here is inherent to a calendar's forward-navigation guard.
  const canGoForward = new Date(year, month + 1, 1).getTime() <= Date.now();
  const circleSize = compact ? 28 : 32;

  return (
    <View>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          onPress={() => setCursor(new Date(year, month - 1, 1))}
          style={styles.navButton}
        >
          <AppText weight="bold" color="dim">
            ‹
          </AppText>
        </Pressable>
        <AppText weight="semibold">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </AppText>
        {canGoForward ? (
          <Pressable
            accessibilityLabel="Next month"
            accessibilityRole="button"
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={styles.navButton}
          >
            <AppText weight="bold" color="dim">
              ›
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.navButton} />
        )}
      </View>

      <View style={styles.weekRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <AppText key={`${d}-${i}`} variant="label" color="faint" style={styles.weekdayCell}>
            {d}
          </AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, index) => {
          if (!key) return <View key={`blank-${index}`} style={styles.dayCell} />;
          const isFuture = diffDays(key, today) > 0;
          const isToday = key === today;
          const isSelected = key === selected;
          const mark = isFuture ? null : (dayMark?.(key) ?? null);
          const dayNumber = Number(key.slice(-2));
          return (
            <Pressable
              key={key}
              accessibilityRole={onSelectDay ? 'button' : 'none'}
              accessibilityLabel={`${dayNumber}`}
              onPress={() => onSelectDay?.(key)}
              disabled={!onSelectDay}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.primarySoft, borderRadius: 10 },
              ]}
            >
              <View
                style={[
                  styles.dayCircle,
                  { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                  mark ? { backgroundColor: mark.color } : null,
                  isToday && !mark ? { borderColor: colors.primary, borderWidth: 1.5 } : null,
                ]}
              >
                <AppText
                  variant="caption"
                  style={{
                    fontSize: compact ? 11 : 13,
                    color: mark ? '#FFFFFF' : isFuture ? colors.textFaint : colors.text,
                    fontWeight: mark ? '700' : '400',
                  }}
                >
                  {dayNumber}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navButton: { width: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekdayCell: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { alignItems: 'center', justifyContent: 'center' },
});
