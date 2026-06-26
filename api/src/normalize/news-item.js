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

export function normalizeFeedEntry(source, entry) {
  const canonicalUrl = normalizeUrl(entry.link || entry.id || entry.guid);
  const title = stripHtml(entry.title) || 'Untitled';
  const publishedAt = parseDate(entry.isoDate || entry.pubDate || entry.updated);
  const rawExcerpt = stripHtml(entry.contentSnippet || entry.summary || entry.content);
  const maxChars = source.maxExcerptChars || DEFAULT_EXCERPT;
  const excerpt = rawExcerpt.slice(0, maxChars);

  return {
    id: buildDedupeKey({
      canonicalUrl,
      title,
      publishedAt,
      sourceId: source.id,
    }),
    title,
    excerpt,
    canonicalUrl,
    publishedAt,
    category: source.category,
    sourceId: source.id,
    sourceName: source.name,
    attributionLabel: source.attributionLabel || source.name,
  };
}