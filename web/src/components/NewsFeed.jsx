import { AdSlot } from './AdSlot.jsx';
import { NewsCard } from './NewsCard.jsx';
import { SupporterSlot } from './SupporterSlot.jsx';

export function NewsFeed({ items, loading, error, sourceMap }) {
  if (loading) {
    return <p className="status-msg">Loading news…</p>;
  }

  if (error) {
    return (
      <div className="status-msg error" role="alert">
        <p>{error}</p>
        <p className="hint">
          Start the API: <code>npm run dev:api</code> from repo root, or{' '}
          <code>cd mobile/server &amp;&amp; npm run dev</code>
        </p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="status-msg">
        No items yet. Click <strong>Refresh feed</strong> to run ingest.
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
