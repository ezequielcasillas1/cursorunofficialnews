import { getEmptyFeedMessage } from '../config/feedCategories.js';
import { AdSlot } from './AdSlot.jsx';
import { NewsCard } from './NewsCard.jsx';
import { SupporterSlot } from './SupporterSlot.jsx';

function errorHint(message) {
  if (import.meta.env.PROD) {
    if (message.includes('Unauthorized')) {
      return 'The feed reload failed. News updates automatically on the server every ~30 minutes.';
    }
    if (message.includes('timed out')) {
      return 'The API may be waking up — wait a few seconds and try again.';
    }
    if (message.includes('HTML instead of JSON')) {
      return 'The /api proxy may be missing. Redeploy with wrangler — see docs/CLOUDFLARE-DEPLOY.md.';
    }
    return 'Try again shortly. If this persists, see docs/CLOUDFLARE-DEPLOY.md.';
  }

  return (
    <>
      Start the API: <code>npm run dev:api</code> from repo root, or{' '}
      <code>cd mobile/server &amp;&amp; npm run dev</code>
    </>
  );
}

export function NewsFeed({
  items,
  loading,
  error,
  sourceMap,
  selectedCategory = 'all',
  officialOnly = false,
  searchQuery = '',
}) {
  if (loading) {
    return <p className="status-msg">Loading news…</p>;
  }

  if (error) {
    return (
      <div className="status-msg error" role="alert">
        <p>{error}</p>
        <p className="hint">{errorHint(error)}</p>
      </div>
    );
  }

  if (!items.length) {
    const trimmedSearch = searchQuery.trim();
    const emptyMessage = trimmedSearch
      ? `No items match "${trimmedSearch}". Try different keywords or clear the search.`
      : getEmptyFeedMessage(selectedCategory, officialOnly);
    return (
      <p className="status-msg">
        {import.meta.env.PROD
          ? `${emptyMessage} The feed updates automatically — try again in a few minutes.`
          : (
              <>
                {emptyMessage} Click <strong>Refresh feed</strong> to run ingest (set{' '}
                <code>VITE_INGEST_SECRET</code> in local dev if the API requires it).
              </>
            )}
      </p>
    );
  }

  const [lead, ...rest] = items;

  return (
    <>
      <ul className="news-list">
        <li key={lead.id}>
          <NewsCard
            item={lead}
            isOfficial={Boolean(sourceMap?.[lead.sourceId]?.isOfficial)}
            featured
          />
        </li>
        {rest.map((item, index) => (
          <li key={item.id}>
            <NewsCard
              item={item}
              isOfficial={Boolean(sourceMap?.[item.sourceId]?.isOfficial)}
            />
            {index === 2 ? <AdSlot /> : null}
            {index === 5 ? <SupporterSlot /> : null}
          </li>
        ))}
      </ul>
    </>
  );
}
