import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, Play } from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { SourceOfficialBadge } from './SourceOfficialBadge';

function extractYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

function getYouTubeThumbnail(url) {
  const id = extractYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function formatShortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return formatShortDate(iso);

  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  return formatShortDate(iso);
}

function formatCategoryLabel(category, sourceName) {
  const labels = {
    changelog: 'Changelog',
    release: 'Release',
    blog: 'Blog',
    forum: 'Forum',
    video: 'Video',
    tutorial: 'Tutorial',
  };
  return labels[category] || category || sourceName || 'News';
}

export function NewsListItem({ item, isOfficial = false }) {
  const isVideo = item.category === 'video';
  const thumbnailUrl = isVideo ? getYouTubeThumbnail(item.canonicalUrl) : null;
  const categoryLabel = formatCategoryLabel(item.category, item.sourceName);

  async function openArticle() {
    if (!item.canonicalUrl) return;
    await Linking.openURL(item.canonicalUrl);
  }

  return (
    <Pressable
      onPress={openArticle}
      style={({ pressed }) => [
        styles.card,
        isOfficial && styles.cardOfficial,
        pressed && styles.cardPressed,
      ]}
    >
      {thumbnailUrl ? (
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
          <View style={styles.playOverlay}>
            <View style={styles.playBadge}>
              <Play size={18} color={colors.cardElevated} fill={colors.cardElevated} />
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.eyebrow}>{categoryLabel}</Text>
        <View style={styles.dot} />
        <Text style={styles.dateline}>{formatRelativeDate(item.publishedAt)}</Text>
        {isVideo ? (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>Video</Text>
          </View>
        ) : null}
        {isOfficial ? <SourceOfficialBadge /> : null}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title}</Text>
        <ExternalLink size={16} color={colors.goldMuted} strokeWidth={2} style={styles.linkIcon} />
      </View>

      <Text style={styles.sourceLine}>{item.sourceName}</Text>

      {item.excerpt ? (
        <Text style={styles.excerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
      ) : null}

      <View style={styles.footerRule} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadows.card,
  },
  cardOfficial: {
    borderLeftColor: colors.gold,
    borderLeftWidth: 3,
  },
  cardPressed: {
    opacity: 0.92,
  },
  thumbnailWrap: {
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.paperDeep,
    width: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 27, 42, 0.85)',
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
  },
  dot: {
    backgroundColor: colors.goldMuted,
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  dateline: {
    ...typography.dateline,
  },
  videoBadge: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  videoBadgeText: {
    ...typography.eyebrow,
    color: colors.error,
    fontSize: 9,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.cardTitle,
    flex: 1,
  },
  linkIcon: {
    marginTop: 4,
  },
  sourceLine: {
    ...typography.meta,
    marginBottom: spacing.sm,
  },
  excerpt: {
    ...typography.excerpt,
  },
  footerRule: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
});
