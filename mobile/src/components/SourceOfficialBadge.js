import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

export function SourceOfficialBadge() {
  return (
    <View style={styles.badge}>
      <ShieldCheck size={10} color={colors.success} strokeWidth={2.5} />
      <Text style={styles.text}>Official</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 3,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    ...typography.eyebrow,
    color: colors.success,
    fontSize: 9,
  },
});
