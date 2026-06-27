import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export function EditorialDivider({ style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.gold} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  gold: {
    backgroundColor: colors.gold,
    height: 1,
    width: 32,
  },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
