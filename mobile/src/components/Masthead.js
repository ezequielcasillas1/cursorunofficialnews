import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Info, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export function Masthead({
  onRefresh,
  onOpenAbout,
  onOpenAlerts,
  refreshing = false,
  showAlerts = true,
}) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.navy, colors.navySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.eyebrow}>Unofficial · Independent</Text>
        <Text style={styles.title}>Unofficial Cursor News</Text>
        <View style={styles.ruleRow}>
          <View style={styles.ruleGold} />
          <View style={styles.ruleThin} />
        </View>
        <Text style={styles.tagline}>
          Headlines from Cursor changelog, forum, blog and releases
        </Text>
      </LinearGradient>

      <View style={styles.toolbar}>
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.iconBtn,
            styles.iconBtnPrimary,
            (pressed || refreshing) && styles.iconBtnPressed,
          ]}
          accessibilityLabel="Refresh feed"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.chipActiveText} />
          ) : (
            <RefreshCw size={16} color={colors.chipActiveText} strokeWidth={2.2} />
          )}
        </Pressable>

        <View style={styles.toolbarSpacer} />

        {showAlerts ? (
          <Pressable
            onPress={onOpenAlerts}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnGhostPressed]}
            accessibilityLabel="Alert settings"
          >
            <Bell size={18} color={colors.inkSoft} strokeWidth={2} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onOpenAbout}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnGhostPressed]}
          accessibilityLabel="About this app"
        >
          <Info size={18} color={colors.inkSoft} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  banner: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  eyebrow: {
    ...typography.mastheadSub,
    color: colors.goldLight,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.masthead,
    color: colors.cardElevated,
    fontSize: 34,
    lineHeight: 40,
  },
  ruleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  ruleGold: {
    backgroundColor: colors.gold,
    height: 2,
    width: 48,
  },
  ruleThin: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  tagline: {
    ...typography.bodySmall,
    color: 'rgba(250, 247, 242, 0.72)',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 320,
  },
  toolbar: {
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toolbarSpacer: {
    flex: 1,
  },
  iconBtn: {
    alignItems: 'center',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconBtnPrimary: {
    backgroundColor: colors.navy,
  },
  iconBtnPressed: {
    opacity: 0.75,
  },
  iconBtnGhostPressed: {
    backgroundColor: colors.accentSoft,
  },
});
