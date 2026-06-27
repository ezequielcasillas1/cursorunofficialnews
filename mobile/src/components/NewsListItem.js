import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function NewsListItem({ item, isOfficial = false }) {
  const isVideo = item.category === 'video';
  const thumbnailUrl = isVideo ? getYouTubeThumbnail(item.canonicalUrl) : null;

  async function openArticle() {
    if (!item.canonicalUrl) return;
    await Linking.openURL(item.canonicalUrl);
  }

  return (
    <Pressable onPress={openArticle} style={styles.card}>
      {thumbnailUrl ? (
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.categoryRow}>
        <Text style={styles.category}>{item.category || item.sourceName}</Text>
        {isVideo ? (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>Video</Text>
          </View>
        ) : null}
        {isOfficial ? <SourceOfficialBadge /> : null}
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.externalCue}>↗</Text>
      </View>
      <Text style={styles.meta}>
        {formatRelativeDate(item.publishedAt)} · {item.sourceName}
      </Text>
      {item.excerpt ? (
        <Text style={styles.excerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 12,
  },
  thumbnailWrap: {
    borderRadius: 4,
    marginBottom: 10,
    marginHorizontal: -12,
    marginTop: -12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
    width: '100%',
  },
  playOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playIcon: {
    color: '#fff',
    fontSize: 28,
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  category: {
    color: '#666',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  videoBadge: {
    backgroundColor: '#fce4ec',
    borderColor: '#c62828',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  videoBadgeText: {
    color: '#c62828',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: '#111',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  externalCue: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 1,
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  excerpt: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
});
