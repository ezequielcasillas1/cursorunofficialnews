import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchNews, triggerIngest } from '../api/newsClient';
import { API_BASE } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { NewsListItem } from '../components/NewsListItem';

export function FeedScreen({ onOpenAbout }) {
  const [items, setItems] = useState([]);
  const [lastIngestAt, setLastIngestAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async () => {
    setError('');
    const data = await fetchNews();
    setItems(data.items || []);
    setLastIngestAt(data.lastIngestAt || null);
  }, []);

  useEffect(() => {
    loadFeed()
      .catch((err) => setError(err.message || 'Failed to load feed'))
      .finally(() => setLoading(false));
  }, [loadFeed]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      await triggerIngest();
      await loadFeed();
    } catch (err) {
      setError(err.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  function renderHeader() {
    return (
      <View style={styles.headerBlock}>
        <DisclaimerBanner />
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.heading}>Cursor News</Text>
            <Text style={styles.apiHint}>API: {API_BASE}</Text>
          </View>
          <View style={styles.toolbarRight}>
            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              style={[styles.button, refreshing && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Text>
            </Pressable>
            <Pressable onPress={onOpenAbout} style={styles.linkButton}>
              <Text style={styles.linkText}>About</Text>
            </Pressable>
          </View>
        </View>
        {lastIngestAt ? (
          <Text style={styles.status}>
            Last ingest: {new Date(lastIngestAt).toLocaleString()}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading feed…</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.empty}>
          No items yet. Tap Refresh to run ingest.
        </Text>
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => <NewsListItem item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 12,
  },
  toolbar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  toolbarLeft: {
    flex: 1,
    paddingRight: 8,
  },
  toolbarRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
  },
  apiHint: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkText: {
    color: '#0066cc',
    fontSize: 14,
  },
  status: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  error: {
    color: '#b00020',
    fontSize: 13,
    marginTop: 8,
  },
  empty: {
    color: '#666',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 12,
  },
});
