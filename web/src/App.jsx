import { useCallback, useEffect, useState } from 'react';
import { AboutPanel, StatusBar } from './components/AboutPanel.jsx';
import { CategoryFilter } from './components/CategoryFilter.jsx';
import { DisclaimerBanner, Header } from './components/Header.jsx';
import { NewsFeed } from './components/NewsFeed.jsx';
import {
  buildSourceMap,
  fetchNews,
  fetchSources,
  fetchStatus,
  triggerIngest,
} from './services/newsApi.js';
import './App.css';

export default function App() {
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [sourceMap, setSourceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ lastIngestAt: null, sourceCount: 0 });

  useEffect(() => {
    fetchSources()
      .then((data) => setSourceMap(buildSourceMap(data.sources || [])))
      .catch(() => {});
  }, []);

  const loadNews = useCallback(async (cat) => {
    setError('');
    setLoading(true);
    try {
      const [news, meta] = await Promise.all([
        fetchNews({ category: cat || undefined }),
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
    loadNews(category);
  }, [category, loadNews]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      await triggerIngest();
      await loadNews(category);
    } catch (err) {
      setError(err.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <Header onRefresh={handleRefresh} refreshing={refreshing} />
      <DisclaimerBanner />
      <StatusBar lastIngestAt={status.lastIngestAt} sourceCount={status.sourceCount} />
      <CategoryFilter value={category} onChange={setCategory} />
      <main>
        <NewsFeed items={items} loading={loading} error={error} sourceMap={sourceMap} />
      </main>
      <AboutPanel />
    </div>
  );
}
