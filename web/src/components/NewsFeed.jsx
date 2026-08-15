import { AlertCircle } from 'lucide-react';
import { getEmptyFeedMessage } from '../config/feedCategories.js';
import { AdSlot } from './AdSlot.jsx';
import { NewsCard } from './NewsCard.jsx';
import { SupporterSlot } from './SupporterSlot.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      Start the API: <code>npm run dev:api</code> from repo root (runs{' '}
      <code>wrangler dev</code>)
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" aria-live="polite">
      <Card className="md:col-span-2">
        <CardHeader className="gap-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
      {['a', 'b', 'c', 'd'].map((key) => (
        <Card key={key}>
          <CardHeader className="gap-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-4/5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NewsFeed({
  items,
  loading,
  error,
  sourceMap,
  selectedCategory = 'all',
  categoryFilter = {},
  searchQuery = '',
  showFeaturedLead = true,
}) {
  if (loading) {
    return <FeedSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="px-4 py-3">
        <AlertCircle />
        <AlertTitle>{error}</AlertTitle>
        <AlertDescription>{errorHint(error)}</AlertDescription>
      </Alert>
    );
  }

  if (!items.length) {
    const trimmedSearch = searchQuery.trim();
    const emptyMessage = trimmedSearch
      ? `No items match "${trimmedSearch}". Try different keywords or clear the search.`
      : getEmptyFeedMessage(selectedCategory, categoryFilter);
    return (
      <Alert className="px-4 py-3">
        <AlertTitle>Nothing in this section yet</AlertTitle>
        <AlertDescription>
          {import.meta.env.PROD
            ? `${emptyMessage} The feed updates automatically — try again in a few minutes.`
            : (
                <>
                  {emptyMessage} Click <strong>Refresh</strong> to run ingest (set{' '}
                  <code>VITE_INGEST_SECRET</code> in local dev if the API requires it).
                </>
              )}
        </AlertDescription>
      </Alert>
    );
  }

  const [lead, ...rest] = showFeaturedLead ? items : [null, ...items];
  const listItems = showFeaturedLead ? rest : items;

  return (
    <ul className="news-list">
      {showFeaturedLead && lead ? (
        <li key={lead.id}>
          <NewsCard
            item={lead}
            isOfficial={Boolean(sourceMap?.[lead.sourceId]?.isOfficial)}
            featured
          />
        </li>
      ) : null}
      {listItems.map((item, index) => (
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
  );
}
