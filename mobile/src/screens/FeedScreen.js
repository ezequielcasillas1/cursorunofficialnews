import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchNews, fetchSources, buildSourceMap, triggerIngest } from '../api/newsClient';
import { API_BASE, getCategoryApiParam, getEmptyFeedMessage } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { FeedCategoryFilter } from '../components/FeedCategoryFilter';
import { NewsListItem } from '../components/NewsListItem';

export function FeedScreen({ onOpenAbout }) {
  const [items, setItems] = useState([]);
  const [sourceMap, setSourceMap] = useState({});
  const [lastIngestAt, setLastIngestAt] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isInitialLoad = useRef(true);
  const loadRequestId = useRef(0);

  const loadFeed = useCallback(
    async ({ initial = false, skipEmptyIngest = false } = {}) => {
      const requestId = ++loadRequestId.current;
      setError('');
      if (initial) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }

      const categoryParam = getCategoryApiParam(selectedCategory);
      const newsOptions = {
        category: categoryParam,
        official: officialOnly ? true : undefined,
      };

      try {
        const [newsResult, sourcesResult] = await Promise.all([
          fetchNews(newsOptions),
          fetchSources().catch(() => ({ sources: [] })),
        ]);
        let data = newsResult;
        if (
          !skipEmptyIngest &&
          selectedCategory === 'all' &&
          !officialOnly &&
          (!data.items || data.items.length === 0)
        ) {
          await triggerIngest();
          if (requestId !== loadRequestId.current) return;
          data = await fetchNews(newsOptions);
        }
        if (requestId !== loadRequestId.current) return;
        setItems(data.items || []);
        setLastIngestAt(data.lastIngestAt || null);
        setSourceMap(buildSourceMap(sourcesResult.sources || []));
      } finally {
        if (requestId !== loadRequestId.current) return;
        if (initial) {
          setLoading(false);
        } else {
          setFilterLoading(false);
        }
      }
    },
    [selectedCategory, officialOnly],
  );

  useEffect(() => {
    loadFeed({ initial: isInitialLoad.current })
      .catch((err) =>
        setError(
          err.message ||
            'Failed to load feed. Start the API (npm run dev in api/) and, on a physical device, run adb reverse or set EXPO_PUBLIC_API_BASE to your PC LAN IP.',
        ),
      )
      .finally(() => {
        isInitialLoad.current = false;
      });
  }, [loadFeed]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      await triggerIngest();
      await loadFeed({ skipEmptyIngest: true });
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
              disabled={refreshing || filterLoading}
              style={[styles.button, (refreshing || filterLoading) && styles.buttonDisabled]}
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
        <FeedCategoryFilter
          selectedCategory={selectedCategory}
          officialOnly={officialOnly}
          onCategoryChange={setSelectedCategory}
          onOfficialOnlyChange={setOfficialOnly}
        />
        {filterLoading ? (
          <ActivityIndicator size="small" style={styles.filterSpinner} />
        ) : null}
        {lastIngestAt ? (
          <Text style={styles.status}>
            Last ingest: {new Date(lastIngestAt).toLocaleString()}
          </Text>
        ) : null}
        <Text style={styles.phaseHint}>
          Phase 4 · category filters · {Object.keys(sourceMap).length} sources
        </Text>
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
          {getEmptyFeedMessage(selectedCategory, officialOnly)}
        </Text>
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <NewsListItem
          item={item}
          isOfficial={Boolean(sourceMap[item.sourceId]?.isOfficial)}
        />
      )}
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
  filterSpinner: {
    marginTop: 8,
  },
  status: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  phaseHint: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
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
