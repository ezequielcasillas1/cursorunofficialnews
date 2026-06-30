import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCallback, useEffect, useRef, useState } from 'react';

import {

  ActivityIndicator,

  FlatList,

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

} from '../api/newsClient';

import { API_BASE, FEED_PAGE_SIZE, getCategoryApiParam, getEmptyFeedMessage } from '../config/constants';

import { DisclaimerBanner } from '../components/DisclaimerBanner';

import { EditorialDivider } from '../components/EditorialDivider';

import { FeedCategoryFilter } from '../components/FeedCategoryFilter';

import { Masthead } from '../components/Masthead';

import { NewSinceBanner } from '../components/NewSinceBanner';

import { NewsListItem } from '../components/NewsListItem';

import { getLastSeenAt, setLastSeenAt } from '../services/notificationPrefs';

import { colors, fontFamilies, spacing, typography } from '../theme/tokens';



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

    'Failed to load feed. Start the API (npm run dev:server in mobile/) and, on a physical device, run adb reverse or set EXPO_PUBLIC_API_BASE to your PC LAN IP.'

  );

}



async function appendStatusHint(message) {

  try {

    const status = await fetchStatus();

    const parts = [message];

    parts.push(

      `Cache: ${status.itemCount} item${status.itemCount === 1 ? '' : 's'}.`,

    );

    if (status.scrapeConfigured === false) {

      parts.push('Blog scrape not configured on API (SCRAPE_API_URL).');

    }

    return parts.join(' ');

  } catch {

    return `${message} API may be unreachable — check npm run dev:server in mobile/.`;

  }

}



export function FeedScreen({ onOpenAbout, onOpenAlerts }) {

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

  const [newSinceCount, setNewSinceCount] = useState(0);

  const [bannerDismissed, setBannerDismissed] = useState(false);

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

    async ({ initial = false } = {}) => {

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
        limit: FEED_PAGE_SIZE,
      };



      try {

        const [newsResult, sourcesResult] = await Promise.all([

          fetchNews(newsOptions),

          fetchSources().catch(() => ({ sources: [] })),

        ]);

        let data = newsResult;

        if (requestId !== loadRequestId.current) return;

        setItems(data.items || []);

        setLastIngestAt(data.lastIngestAt || null);

        setSourceMap(buildSourceMap(sourcesResult.sources || []));



        const lastSeen = await getLastSeenAt();

        if (lastSeen && data.items?.length) {

          const seenTime = Date.parse(lastSeen);

          const count = data.items.filter(

            (item) => item.publishedAt && Date.parse(item.publishedAt) > seenTime,

          ).length;

          if (requestId === loadRequestId.current) setNewSinceCount(count);

        } else if (requestId === loadRequestId.current) {

          setNewSinceCount(0);

        }

        if (requestId === loadRequestId.current) {

          await setLastSeenAt(new Date().toISOString());

        }



        if (!data.items || data.items.length === 0) {

          try {

            const status = await fetchStatus();

            const hints = [];

            if (status.itemCount === 0) {

              hints.push('API cache is empty — start the server or run ingest from a trusted admin workflow.');

            } else {

              hints.push(

                `${status.itemCount} items in cache; none match this filter.`,

              );

            }

            if (status.scrapeConfigured === false) {

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
      await loadFeed();

    } catch (err) {

      setError(await appendStatusHint(err.message || 'Refresh failed'));

    } finally {

      setRefreshing(false);

    }

  }



  function renderEmpty() {

    const base = getEmptyFeedMessage(selectedCategory, officialOnly);

    const message = feedHint ? `${base} ${feedHint}` : base;

    return (

      <View style={styles.emptyWrap}>

        <Text style={styles.emptyTitle}>No headlines</Text>

        <Text style={styles.empty}>{message}</Text>

      </View>

    );

  }



  function renderHeader() {

    return (

      <View style={styles.headerBlock}>

        <Masthead

          onRefresh={handleRefresh}

          onOpenAbout={onOpenAbout}

          onOpenAlerts={onOpenAlerts}

          refreshing={refreshing || filterLoading}

        />

        <View style={styles.contentPad}>

          <DisclaimerBanner />

          <FeedCategoryFilter

            selectedCategory={selectedCategory}

            officialOnly={officialOnly}

            onCategoryChange={setSelectedCategory}

            onOfficialOnlyChange={setOfficialOnly}

          />

          {!bannerDismissed && newSinceCount > 0 ? (

            <NewSinceBanner

              count={newSinceCount}

              onDismiss={() => setBannerDismissed(true)}

              onOpenAlerts={onOpenAlerts}

            />

          ) : null}

          {filterLoading ? (

            <ActivityIndicator size="small" color={colors.navy} style={styles.filterSpinner} />

          ) : null}

          {lastIngestAt ? (

            <Text style={styles.status}>

              Last updated {new Date(lastIngestAt).toLocaleString()}

            </Text>

          ) : null}

          {__DEV__ ? (

            <Text style={styles.phaseHint}>

              API: {API_BASE} · {Object.keys(sourceMap).length} sources

            </Text>

          ) : null}

          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Text style={styles.phaseHint}>API: {API_BASE}</Text>
            </>
          ) : null}

          {items.length > 0 ? (

            <>

              <EditorialDivider />

              <Text style={styles.feedLabel}>Latest headlines</Text>

            </>

          ) : null}

        </View>

      </View>

    );

  }



  if (loading) {

    return (

      <View style={styles.centered}>

        <ActivityIndicator size="large" color={colors.navy} />

        <Text style={styles.loadingText}>Loading the edition…</Text>

      </View>

    );

  }



  return (

    <FlatList

      style={styles.listRoot}

      contentContainerStyle={styles.list}

      data={items}

      keyExtractor={(item) => item.id}

      ListEmptyComponent={renderEmpty}

      ListHeaderComponent={renderHeader}

      refreshControl={

        <RefreshControl

          refreshing={refreshing}

          onRefresh={handleRefresh}

          tintColor={colors.gold}

          colors={[colors.navy]}

        />

      }

      renderItem={({ item }) => (

        <View style={styles.itemPad}>

          <NewsListItem

            item={item}

            isOfficial={Boolean(sourceMap[item.sourceId]?.isOfficial)}

          />

        </View>

      )}

    />

  );

}



const styles = StyleSheet.create({

  listRoot: {

    backgroundColor: colors.paper,

    flex: 1,

  },

  list: {

    paddingBottom: spacing.xxl,

  },

  headerBlock: {

    marginBottom: spacing.sm,

  },

  contentPad: {

    paddingHorizontal: spacing.lg,

  },

  itemPad: {

    paddingHorizontal: spacing.lg,

  },

  feedLabel: {

    ...typography.sectionLabel,

    marginBottom: spacing.md,

  },

  filterSpinner: {

    marginTop: spacing.sm,

  },

  status: {

    ...typography.meta,

    marginTop: spacing.sm,

  },

  phaseHint: {

    ...typography.meta,

    marginTop: spacing.xs,

  },

  error: {

    ...typography.bodySmall,

    color: colors.error,

    marginTop: spacing.sm,

  },

  emptyWrap: {

    alignItems: 'center',

    paddingHorizontal: spacing.xl,

    paddingTop: spacing.xxl,

  },

  emptyTitle: {

    ...typography.headline,

    fontSize: 22,

    marginBottom: spacing.sm,

    textAlign: 'center',

  },

  empty: {

    ...typography.body,

    color: colors.inkMuted,

    textAlign: 'center',

  },

  centered: {

    alignItems: 'center',

    backgroundColor: colors.paper,

    flex: 1,

    justifyContent: 'center',

  },

  loadingText: {

    ...typography.body,

    color: colors.inkMuted,

    fontFamily: fontFamilies.ui,

    marginTop: spacing.md,

  },

});

