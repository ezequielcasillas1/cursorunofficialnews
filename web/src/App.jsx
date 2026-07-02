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
import { useMembership } from './monetization/useMembership.js';
import {
  buildSourceMap,
  fetchNews,
  fetchSources,
  fetchStatus,
  triggerIngest,
} from './services/newsApi.js';
import { filterNewsItems } from './feed/filterNewsItems.js';
import {
  createInitialFilterPrefs,
  loadFilterPrefs,
  saveFilterPrefs,
} from './feed/filterPrefsStorage.js';
import {
  buildFeedQueryFilters,
  getActiveCategoryFilter,
  normalizeCategoryFilter,
} from './feed/categoryFilterPrefs.js';
import './App.css';

export default function App() {
  const initialPrefs = useMemo(() => loadFilterPrefs() || createInitialFilterPrefs(), []);
  const [selectedCategory, setSelectedCategory] = useState(initialPrefs.category);
  const [categoryFilters, setCategoryFilters] = useState(initialPrefs.categoryFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedMeta, setFeedMeta] = useState({ total: 0, totalPages: 1, pageSize: FEED_PAGE_SIZE });
  const [sources, setSources] = useState([]);
  const [sourceMap, setSourceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ lastIngestAt: null, sourceCount: 0, feedPublishedAfter: null });
  const membership = useMembership();

  const activeCategoryFilter = useMemo(
    () => getActiveCategoryFilter(categoryFilters, selectedCategory),
    [categoryFilters, selectedCategory],
  );

  useEffect(() => {
    fetchSources()
      .then((data) => {
        const nextSources = data.sources || [];
        setSources(nextSources);
        setSourceMap(buildSourceMap(nextSources));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    saveFilterPrefs({ category: selectedCategory, categoryFilters });
  }, [selectedCategory, categoryFilters]);

  const loadNews = useCallback(async (categoryId, filter, page, searching) => {
    setError('');
    setLoading(true);
    try {
      const limit = searching ? FEED_SEARCH_FETCH_LIMIT : FEED_PAGE_SIZE;
      const requestPage = searching ? 1 : page;
      const queryFilters = buildFeedQueryFilters(filter);
      const [news, meta] = await Promise.all([
        fetchNews({
          category: getCategoryApiParam(categoryId),
          official: queryFilters.official,
          sources: queryFilters.sources,
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

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    loadNews(selectedCategory, activeCategoryFilter, feedPage, isSearching);
  }, [selectedCategory, activeCategoryFilter, feedPage, isSearching, loadNews]);

  useEffect(() => {
    if (!loading && feedPage > 1 && !isSearching) {
      document.querySelector('.app-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [feedPage, loading, isSearching]);

  const filteredItems = useMemo(
    () => filterNewsItems(items, searchQuery),
    [items, searchQuery],
  );

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      if (INGEST_SECRET) {
        await triggerIngest();
      }
      await loadNews(selectedCategory, activeCategoryFilter, feedPage, isSearching);
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

  function handleCategoryFilterChange(nextFilter) {
    setFeedPage(1);
    setCategoryFilters((prev) => ({
      ...prev,
      [selectedCategory]: normalizeCategoryFilter(nextFilter),
    }));
  }

  function handleSearchChange(nextQuery) {
    setFeedPage(1);
    setSearchQuery(nextQuery);
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > feedMeta.totalPages || nextPage === feedPage) return;
    setFeedPage(nextPage);
  }

  const showPagination = !isSearching && feedMeta.totalPages > 1;

  return (
    <div className="app-shell">
      <Header onRefresh={handleRefresh} refreshing={refreshing} />
      <div className="app-body">
        <StatusBar
          lastIngestAt={status.lastIngestAt}
          sourceCount={status.sourceCount}
          feedPublishedAfter={status.feedPublishedAfter}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          categoryFilter={activeCategoryFilter}
          sources={sources}
          onCategoryChange={handleCategoryChange}
          onCategoryFilterChange={handleCategoryFilterChange}
        />
        <FeedSearch
          value={searchQuery}
          onChange={handleSearchChange}
          resultCount={filteredItems.length}
          totalCount={isSearching ? items.length : feedMeta.total}
        />
        <MonetizationSection membership={membership} />
        <NewsletterSettings membership={membership} />
        <main className="app-main">
          <NewsFeed
            items={filteredItems}
            loading={loading}
            error={error}
            sourceMap={sourceMap}
            selectedCategory={selectedCategory}
            categoryFilter={activeCategoryFilter}
            searchQuery={searchQuery}
            showFeaturedLead={feedPage === 1 && !isSearching}
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
        <AboutPanel />
      </div>
      <Footer />
    </div>
  );
}
