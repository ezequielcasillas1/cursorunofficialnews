import { useCallback, useEffect, useState } from 'react';
import { AboutPanel, StatusBar } from './components/AboutPanel.jsx';
import { CategoryFilter } from './components/CategoryFilter.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { MonetizationSection } from './components/monetization/MonetizationSection.jsx';
import { NewsletterSettings } from './components/newsletter/NewsletterSettings.jsx';
import { NewsFeed } from './components/NewsFeed.jsx';
import { getCategoryApiParam } from './config/feedCategories.js';
import { INGEST_SECRET } from './config.js';
import {
  buildSourceMap,
  fetchNews,
  fetchSources,
  fetchStatus,
  triggerIngest,
} from './services/newsApi.js';
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [items, setItems] = useState([]);
  const [sourceMap, setSourceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ lastIngestAt: null, sourceCount: 0 });

  useEffect(() => {
    const prefs = loadFilterPrefs();
    if (prefs?.category) setSelectedCategory(prefs.category);
    if (typeof prefs?.officialOnly === 'boolean') setOfficialOnly(prefs.officialOnly);

    fetchSources()
      .then((data) => setSourceMap(buildSourceMap(data.sources || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    saveFilterPrefs(selectedCategory, officialOnly);
  }, [selectedCategory, officialOnly]);

  const loadNews = useCallback(async (categoryId, official) => {
    setError('');
    setLoading(true);
    try {
      const [news, meta] = await Promise.all([
        fetchNews({
          category: getCategoryApiParam(categoryId),
          official: official ? true : undefined,
        }),
        fetchStatus().catch(() => null),
      ]);
      setItems(news.items || []);
      if (meta) setStatus(meta);
    } catch (err) {
      setError(err.message || 'Failed to load news');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(selectedCategory, officialOnly);
  }, [selectedCategory, officialOnly, loadNews]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      // Public prod: reload cached feed only. Ingest needs X-API-Secret (dev / admin).
      if (INGEST_SECRET) {
        await triggerIngest();
      }
      await loadNews(selectedCategory, officialOnly);
    } catch (err) {
      setError(err.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <Header onRefresh={handleRefresh} refreshing={refreshing} />
      <div className="app-body">
        <StatusBar lastIngestAt={status.lastIngestAt} sourceCount={status.sourceCount} />
        <CategoryFilter
          selectedCategory={selectedCategory}
          officialOnly={officialOnly}
          onCategoryChange={setSelectedCategory}
          onOfficialOnlyChange={setOfficialOnly}
        />
        <MonetizationSection />
        <NewsletterSettings />
        <main className="app-main">
          <NewsFeed
            items={items}
            loading={loading}
            error={error}
            sourceMap={sourceMap}
            selectedCategory={selectedCategory}
            officialOnly={officialOnly}
          />
        </main>
        <AboutPanel />
      </div>
      <Footer />
    </div>
  );
}
