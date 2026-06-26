import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function NewsListItem({ item }) {
  async function openArticle() {
    if (!item.canonicalUrl) return;
    await Linking.openURL(item.canonicalUrl);
  }

  return (
    <Pressable onPress={openArticle} style={styles.card}>
      <Text style={styles.category}>{item.category || item.sourceName}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {formatDate(item.publishedAt)} · {item.sourceName}
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
    padding: 12,
  },
  category: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
