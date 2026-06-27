import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fetchNews,
  fetchSources,
  fetchStatus,
  buildSourceMap,
  triggerIngest,
} from '../api/newsClient';
import { API_BASE, getCategoryApiParam, getEmptyFeedMessage } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { FeedCategoryFilter } from '../components/FeedCategoryFilter';
import { NewsListItem } from '../components/NewsListItem';

const FILTER_PREFS_KEY = '@cursor_news_filter_prefs';

async function loadFilterPrefs() {
  try {
    const raw = await AsyncStorage.getItem(FILTER_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt prefs */
  }
  return null;
}

async function saveFilterPrefs(category, officialOnly) {
  try {
    await AsyncStorage.setItem(
      FILTER_PREFS_KEY,
      JSON.stringify({ category, officialOnly }),
    );
  } catch {
    /* non-fatal */
  }
}

function buildApiDownMessage(err) {
  return (
    err.message ||
    'Failed to load feed. Start the API (npm run dev in api/) and, on a physical device, run adb reverse or set EXPO_PUBLIC_API_BASE to your PC LAN IP.'
  );
}

async function appendStatusHint(message) {
  try {
    const status = await fetchStatus();
    const parts = [message];
    parts.push(
      `Cache: ${status.itemCount} item${status.itemCount === 1 ? '' : 's'}.`,
    );
    if (!status.scrapeConfigured) {
      parts.push('Blog scrape not configured on API (SCRAPE_API_URL).');
    }
    return parts.join(' ');
  } catch {
    return `${message} API may be unreachable — check npm run dev in api/.`;
  }
}

export function FeedScreen({ onOpenAbout }) {
  const [items, setItems] = useState([]);
  const [sourceMap, setSourceMap] = useState({});
  const [lastIngestAt, setLastIngestAt] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedHint, setFeedHint] = useState('');
  const isInitialLoad = useRef(true);
  const loadRequestId = useRef(0);

  useEffect(() => {
    loadFilterPrefs().then((prefs) => {
      if (prefs?.category) setSelectedCategory(prefs.category);
      if (typeof prefs?.officialOnly === 'boolean') {
        setOfficialOnly(prefs.officialOnly);
      }
      setPrefsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    saveFilterPrefs(selectedCategory, officialOnly);
  }, [selectedCategory, officialOnly, prefsLoaded]);

  const loadFeed = useCallback(
    async ({ initial = false, skipEmptyIngest = false } = {}) => {
      const requestId = ++loadRequestId.current;
      setError('');
      setFeedHint('');
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

        if (!data.items || data.items.length === 0) {
          try {
            const status = await fetchStatus();
            const hints = [];
            if (status.itemCount === 0) {
              hints.push('API cache is empty — pull down or tap Refresh to ingest.');
            } else {
              hints.push(
                `${status.itemCount} items in cache; none match this filter.`,
              );
            }
            if (!status.scrapeConfigured) {
              hints.push('Blog scrape not configured (SCRAPE_API_URL on API).');
            }
            if (requestId === loadRequestId.current) setFeedHint(hints.join(' '));
          } catch {
            /* status optional */
          }
        }
      } catch (err) {
        if (requestId !== loadRequestId.current) return;
        setError(await appendStatusHint(buildApiDownMessage(err)));
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
    if (!prefsLoaded) return;
    loadFeed({ initial: isInitialLoad.current }).finally(() => {
      isInitialLoad.current = false;
    });
  }, [loadFeed, prefsLoaded]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    setFeedHint('');
    try {
      await triggerIngest();
      await loadFeed({ skipEmptyIngest: true });
    } catch (err) {
      setError(await appendStatusHint(err.message || 'Refresh failed'));
    } finally {
      setRefreshing(false);
    }
  }

  function renderEmpty() {
    const base = getEmptyFeedMessage(selectedCategory, officialOnly);
    const message = feedHint ? `${base} ${feedHint}` : base;
    return <Text style={styles.empty}>{message}</Text>;
  }

  function renderHeader() {
    return (
      <View style={styles.headerBlock}>
        <DisclaimerBanner />
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.heading}>Cursor News</Text>
            {__DEV__ ? (
              <Text style={styles.apiHint}>API: {API_BASE}</Text>
            ) : null}
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
        {__DEV__ ? (
          <Text style={styles.phaseHint}>
            Phase 4 · category filters · {Object.keys(sourceMap).length} sources
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
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
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
    lineHeight: 20,
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
