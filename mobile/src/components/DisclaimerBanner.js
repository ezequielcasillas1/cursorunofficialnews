import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { DISCLAIMER } from '../config/constants';
import { colors, radii, spacing, typography } from '../theme/tokens';

export function DisclaimerBanner() {
  return (
    <View style={styles.banner}>
      <AlertTriangle size={14} color={colors.gold} strokeWidth={2} style={styles.icon} />
      <Text style={styles.text}>{DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'flex-start',
    backgroundColor: colors.disclaimerBg,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    ...typography.bodySmall,
    color: colors.disclaimerText,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
