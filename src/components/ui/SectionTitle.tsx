import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface SectionTitleProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" weight="bold">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <AppText color="primary" weight="medium" onPress={onAction} style={styles.action} suppressHighlighting>
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  action: { padding: 4 },
});
