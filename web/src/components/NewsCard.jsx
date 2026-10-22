import { Link } from 'react-router-dom';
import { itemPublicPath } from '../../../mobile/shared/seo/publicPaths.js';
import { sanitizeExternalUrl } from '../../../mobile/shared/url/safe-external-url.js';
import { formatCategoryLabel } from '../utils/articleMedia.js';
import { ArticleMedia } from './media/ArticleMedia.jsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function NewsCard({ item, isOfficial = false, featured = false }) {
  const safeUrl = sanitizeExternalUrl(item?.canonicalUrl);
  const articlePath = item?.id ? itemPublicPath(item.id) : null;

  return (
    <article className="h-full">
      <Card
        className={cn(
          'h-full gap-3 py-6 transition-transform duration-300 hover:-translate-y-0.5',
          featured && 'bg-gradient-to-br from-primary/10 to-transparent ring-primary/25',
        )}
      >
        <CardHeader className="gap-3">
          {featured ? (
            <p className="m-0 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-gold)]" />
              Top Story
            </p>
          ) : null}
          <ArticleMedia item={item} featured={featured} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-md border-primary/30 text-[10px] font-bold uppercase tracking-[0.14em] text-primary"
            >
              {formatCategoryLabel(item.category)}
            </Badge>
            {isOfficial ? (
              <Badge className="rounded-md text-[10px] font-bold uppercase tracking-[0.14em]">
                Official
              </Badge>
            ) : null}
            <time
              dateTime={item.publishedAt || undefined}
              className="font-mono text-[11px] tracking-wide text-muted-foreground"
            >
              {formatDate(item.publishedAt)}
            </time>
          </div>
          <CardTitle className={cn('font-display text-xl leading-snug', featured && 'text-2xl')}>
            {articlePath ? (
              <Link to={articlePath} className="text-foreground no-underline hover:text-primary">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </CardTitle>
        </CardHeader>
        {item.excerpt ? (
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">{item.excerpt}</CardDescription>
          </CardContent>
        ) : null}
        <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
          <span>{item.attributionLabel || item.sourceName}</span>
          {safeUrl ? (
            <Button asChild variant="link" className="h-auto px-0 text-[11px] font-bold uppercase tracking-[0.12em]">
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                Read original →
              </a>
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </article>
  );
}
