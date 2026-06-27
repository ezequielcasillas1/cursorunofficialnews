import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

export function NewSinceBanner({ count, onDismiss, onOpenAlerts }) {
  if (!count || count <= 0) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>Since your last visit</Text>
        <Text style={styles.headline}>
          {count} new {count === 1 ? 'headline' : 'headlines'}
        </Text>
        <Text style={styles.body}>
          Scroll the feed or enable digest alerts to stay current.
        </Text>
      </View>
      <View style={styles.actions}>
        {onOpenAlerts ? (
          <Pressable onPress={onOpenAlerts} style={styles.primaryBtn}>
            <Bell size={14} color={colors.chipActiveText} strokeWidth={2} />
            <Text style={styles.primaryBtnText}>Set up alerts</Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable onPress={onDismiss} style={styles.dismissBtn}>
            <X size={16} color={colors.inkMuted} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderLeftColor: colors.gold,
    borderLeftWidth: 3,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  textBlock: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.cardTitle,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodySmall,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryBtnText: {
    ...typography.uiButton,
    color: colors.chipActiveText,
    fontSize: 11,
  },
  dismissBtn: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
