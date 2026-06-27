import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

const CATEGORY_LABELS = {
  changelog: 'Changelog',
  release: 'Release',
  blog: 'Blog',
  forum: 'Forum',
  video: 'Video',
  tutorial: 'Tutorial',
};

/**
 * Newsletter-style preview of how a push alert will appear.
 */
export function NotificationPreviewCard({ item, compact = false }) {
  const sample = item || {
    category: 'changelog',
    sourceName: 'Cursor Changelog',
    title: 'New Cursor release with improved agent workflows',
    excerpt:
      'Tap to open the full release note on cursor.com — we never republish articles in-app.',
    publishedAt: new Date().toISOString(),
  };

  const categoryLabel = CATEGORY_LABELS[sample.category] || sample.category;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.eyebrow}>Preview · Digest alert</Text>
      <View style={styles.headerRow}>
        <Text style={styles.category}>{categoryLabel}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.source}>{sample.sourceName}</Text>
      </View>
      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {sample.title}
      </Text>
      {!compact && sample.excerpt ? (
        <Text style={styles.excerpt} numberOfLines={2}>
          {sample.excerpt}
        </Text>
      ) : null}
      <Text style={styles.footer}>Tap opens original · Unofficial Cursor News</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderLeftColor: colors.gold,
    borderLeftWidth: 3,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardCompact: {
    padding: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  category: {
    ...typography.dateline,
    color: colors.goldMuted,
  },
  dot: {
    ...typography.meta,
    marginHorizontal: 4,
  },
  source: {
    ...typography.meta,
  },
  title: {
    ...typography.cardTitle,
    marginBottom: spacing.sm,
  },
  excerpt: {
    ...typography.excerpt,
    marginBottom: spacing.sm,
  },
  footer: {
    ...typography.meta,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
});
