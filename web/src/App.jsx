import { useCallback, useEffect, useMemo, useState } from 'react';
import { AboutPanel, StatusBar } from './components/AboutPanel.jsx';
import { CategoryFilter } from './components/CategoryFilter.jsx';
import { FeedSearch } from './components/FeedSearch.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { MonetizationSection } from './components/monetization/MonetizationSection.jsx';
import { NewsletterSettings } from './components/newsletter/NewsletterSettings.jsx';
import { FeedPagination } from './components/FeedPagination.jsx';
import { NewsFeed } from './components/NewsFeed.jsx';
import { getCategoryApiParam, FEED_PAGE_SIZE, FEED_SEARCH_FETCH_LIMIT } from './config/feedCategories.js';
import { INGEST_SECRET } from './config.js';
import {
  buildSourceMap,
  fetchNews,
  fetchSources,
  fetchStatus,
  triggerIngest,
} from './services/newsApi.js';
import { filterNewsItems } from './feed/filterNewsItems.js';
import { useCookieConsent } from './consent/useCookieConsent.js';
import { CookieConsent } from './components/CookieConsent.jsx';
import { SourceVisibilityControls } from './components/sources/SourceVisibilityControls.jsx';
import { TacoUnlockDialog } from './components/sources/TacoUnlockDialog.jsx';
import { useTacoUnlock } from './taco-unlock/useTacoUnlock.js';
import './App.css';

const FILTER_PREFS_KEY = 'cursor_news_filter_prefs';

function loadFilterPrefs() {
  try {
    const raw = localStorage.getItem(FILTER_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt prefs */
  }
  return null;
}

function saveFilterPrefs(category, officialOnly) {
  try {
    localStorage.setItem(FILTER_PREFS_KEY, JSON.stringify({ category, officialOnly }));
  } catch {
    /* non-fatal */
  }
}

export default function App() {
  const { hasConsent, acceptConsent } = useCookieConsent();
  const { tacoUnlocked, sourcesHidden, loaded: tacoPrefsLoaded, hideSources, unlockFeatures } =
    useTacoUnlock({ enabled: hasConsent });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUnlockOpen, setSearchUnlockOpen] = useState(false);
  const [showSourcesNavHint, setShowSourcesNavHint] = useState(false);
  const [items, setItems] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedMeta, setFeedMeta] = useState({ total: 0, totalPages: 1, pageSize: FEED_PAGE_SIZE });
  const [sourceMap, setSourceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ lastIngestAt: null, sourceCount: 0 });

  useEffect(() => {
    if (!hasConsent) return;
    const prefs = loadFilterPrefs();
    if (prefs?.category) setSelectedCategory(prefs.category);
    if (typeof prefs?.officialOnly === 'boolean') setOfficialOnly(prefs.officialOnly);

    fetchSources()
      .then((data) => setSourceMap(buildSourceMap(data.sources || [])))
      .catch(() => {});
  }, [hasConsent]);

  useEffect(() => {
    if (!hasConsent) return;
    saveFilterPrefs(selectedCategory, officialOnly);
  }, [selectedCategory, officialOnly, hasConsent]);

  const loadNews = useCallback(async (categoryId, official, page, searching) => {
    setError('');
    setLoading(true);
    try {
      const limit = searching ? FEED_SEARCH_FETCH_LIMIT : FEED_PAGE_SIZE;
      const requestPage = searching ? 1 : page;
      const [news, meta] = await Promise.all([
        fetchNews({
          category: getCategoryApiParam(categoryId),
          official: official ? true : undefined,
          limit,
          page: requestPage,
        }),
        fetchStatus().catch(() => null),
      ]);
      setItems(news.items || []);
      setFeedMeta({
        total: news.total ?? news.items?.length ?? 0,
        totalPages: news.totalPages ?? 1,
        pageSize: news.pageSize ?? limit,
        page: news.page ?? requestPage,
      });
      if (meta) setStatus(meta);
    } catch (err) {
      setError(err.message || 'Failed to load news');
      setItems([]);
      setFeedMeta({ total: 0, totalPages: 1, pageSize: FEED_PAGE_SIZE, page: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  const isSearching = tacoPrefsLoaded && tacoUnlocked && searchQuery.trim().length > 0;

  useEffect(() => {
    if (!hasConsent) return;
    loadNews(selectedCategory, officialOnly, feedPage, isSearching);
  }, [hasConsent, selectedCategory, officialOnly, feedPage, isSearching, loadNews]);

  useEffect(() => {
    if (!loading && feedPage > 1 && !isSearching) {
      document.querySelector('.app-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [feedPage, loading, isSearching]);

  const filteredItems = useMemo(
    () => (tacoPrefsLoaded && tacoUnlocked ? filterNewsItems(items, searchQuery) : items),
    [items, searchQuery, tacoUnlocked, tacoPrefsLoaded],
  );

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      // Public prod: reload cached feed only. Ingest needs X-API-Secret (dev / admin).
      if (INGEST_SECRET) {
        await triggerIngest();
      }
      await loadNews(selectedCategory, officialOnly, feedPage, isSearching);
    } catch (err) {
      setError(err.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  function handleCategoryChange(categoryId) {
    setFeedPage(1);
    setSelectedCategory(categoryId);
  }

  function handleOfficialOnlyChange(nextOfficialOnly) {
    setFeedPage(1);
    setOfficialOnly(nextOfficialOnly);
  }

  function handleSearchChange(nextQuery) {
    if (!tacoPrefsLoaded || !tacoUnlocked) {
      setSearchUnlockOpen(true);
      return;
    }
    setFeedPage(1);
    setSearchQuery(nextQuery);
  }

  useEffect(() => {
    if (sourcesHidden) setShowSourcesNavHint(false);
  }, [sourcesHidden]);

  function handleUnlockSources() {
    unlockFeatures();
    setShowSourcesNavHint(true);
  }

  function handleSearchUnlock() {
    handleUnlockSources();
    setSearchUnlockOpen(false);
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > feedMeta.totalPages || nextPage === feedPage) return;
    setFeedPage(nextPage);
  }

  const sourcesHiddenSafe = !tacoPrefsLoaded || sourcesHidden;

  const showPagination = !isSearching && feedMeta.totalPages > 1;

  if (!hasConsent) {
    return (
      <div className="app-shell" data-consent="pending">
        <CookieConsent onAccept={acceptConsent} />
      </div>
    );
  }

  return (
    <div className="app-shell" data-consent="accepted">
      <div className="app-interactive">
      <Header onRefresh={handleRefresh} refreshing={refreshing} />
      <div className="app-body">
        <StatusBar
          lastIngestAt={status.lastIngestAt}
          sourceCount={status.sourceCount}
          sourcesHidden={sourcesHiddenSafe}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          officialOnly={officialOnly}
          onCategoryChange={handleCategoryChange}
          onOfficialOnlyChange={handleOfficialOnlyChange}
        />
        {tacoPrefsLoaded ? (
          <SourceVisibilityControls
            sourcesHidden={sourcesHidden}
            onHide={hideSources}
            onUnlock={handleUnlockSources}
            showUnhideHint={showSourcesNavHint}
          />
        ) : null}
        <FeedSearch
          locked={!tacoPrefsLoaded || !tacoUnlocked}
          onLockedInteract={() => setSearchUnlockOpen(true)}
          value={searchQuery}
          onChange={handleSearchChange}
          resultCount={filteredItems.length}
          totalCount={isSearching ? items.length : feedMeta.total}
        />
        <TacoUnlockDialog
          open={searchUnlockOpen}
          onClose={() => setSearchUnlockOpen(false)}
          onUnlock={handleSearchUnlock}
        />
        <MonetizationSection />
        <NewsletterSettings />
        <main className="app-main">
          <NewsFeed
            items={filteredItems}
            loading={loading}
            error={error}
            sourceMap={sourceMap}
            selectedCategory={selectedCategory}
            officialOnly={officialOnly}
            searchQuery={searchQuery}
            showFeaturedLead={feedPage === 1 && !isSearching}
            hideSources={sourcesHiddenSafe}
          />
          {showPagination ? (
            <FeedPagination
              page={feedPage}
              totalPages={feedMeta.totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          ) : null}
          {!loading && !error && !isSearching && feedMeta.total > 0 ? (
            <p className="feed-pagination-summary" aria-live="polite">
              Page {feedMeta.page} of {feedMeta.totalPages} · {feedMeta.total}{' '}
              {feedMeta.total === 1 ? 'item' : 'items'}
            </p>
          ) : null}
        </main>
        <AboutPanel
          sourcesHidden={sourcesHiddenSafe}
          onUnlock={unlockFeatures}
        />
      </div>
      <Footer />
      </div>
    </div>
  );
}
