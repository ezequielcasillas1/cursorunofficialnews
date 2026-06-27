const DEFAULT_EXCERPT = 300;

function stripHtml(value) {
  if (!value) return '';
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return String(url).trim();
  }
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function buildDedupeKey({ canonicalUrl, title, publishedAt, sourceId }) {
  const url = normalizeUrl(canonicalUrl);
  if (url) return `url:${url}`;
  return `meta:${sourceId}:${title}:${publishedAt || ''}`;
}

const DEFAULT_SOURCE_PRIORITY = 999;

function sourceRank(item, getSourceMeta) {
  const meta = getSourceMeta?.(item.sourceId) || {};
  const officialRank = meta.isOfficial ? 0 : 1;
  const priority = meta.priority ?? DEFAULT_SOURCE_PRIORITY;
  return [officialRank, priority];
}

function compareSourceRank(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

export function sortNewsItemsByDate(items) {
  return [...items].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export function dedupeNewsItems(items, { getSourceMeta } = {}) {
  const byKey = new Map();
  for (const item of items) {
    const key = buildDedupeKey({
      canonicalUrl: item.canonicalUrl,
      title: item.title,
      publishedAt: item.publishedAt,
      sourceId: item.sourceId,
    });
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    if (compareSourceRank(sourceRank(item, getSourceMeta), sourceRank(existing, getSourceMeta)) < 0) {
      byKey.set(key, item);
    }
  }
  return sortNewsItemsByDate([...byKey.values()]);
}

function buildNewsItem(source, { canonicalUrl, title, publishedAt, rawExcerpt }) {
  const maxChars = source.maxExcerptChars || DEFAULT_EXCERPT;
  const excerpt = stripHtml(rawExcerpt).slice(0, maxChars);

  return {
    id: buildDedupeKey({
      canonicalUrl,
      title,
      publishedAt,
      sourceId: source.id,
    }),
    title: stripHtml(title) || 'Untitled',
    excerpt,
    canonicalUrl,
    publishedAt,
    category: source.category,
    sourceId: source.id,
    sourceName: source.name,
    attributionLabel: source.attributionLabel || source.name,
  };
}

export function normalizeFeedEntry(source, entry) {
  return buildNewsItem(source, {
    canonicalUrl: normalizeUrl(entry.link || entry.id || entry.guid),
    title: entry.title,
    publishedAt: parseDate(entry.isoDate || entry.pubDate || entry.updated),
    rawExcerpt: entry.contentSnippet || entry.summary || entry.content,
  });
}

export function normalizeScrapedEntry(source, entry) {
  return buildNewsItem(source, {
    canonicalUrl: normalizeUrl(entry.link || entry.url),
    title: entry.title,
    publishedAt: parseDate(entry.pubDate || entry.publishedAt || entry.date),
    rawExcerpt: entry.summary || entry.description || entry.excerpt || '',
  });
}