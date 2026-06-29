import { listSources } from '../sources/registry.js';
import { normalizeScrapedEntry } from '../normalize/news-item.js';

const SITEMAP_TIMEOUT_MS = 30_000;

function slugToTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function titleFromPathUrl(url, pathStrip = '/learn/') {
  try {
    const { pathname } = new URL(url);
    const stripRe = new RegExp(`^${String(pathStrip).replace(/\//g, '\\/')}\\/?`);
    const segments = pathname.replace(stripRe, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const lastSlug = segments[segments.length - 1];
    if (!lastSlug || lastSlug === 'page.mdx') return null;
    if (segments.length === 1) return slugToTitle(lastSlug);
    return segments.map((segment) => slugToTitle(segment)).join(' — ');
  } catch {
    return null;
  }
}

function parseSitemapUrls(xml, { urlPattern, skipPattern, titlePathStrip }) {
  const blocks = xml.split(/<url>/i).slice(1);
  const items = [];

  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/i)?.[1]?.trim();
    if (!loc || (urlPattern && !urlPattern.test(loc))) continue;
    if (skipPattern?.test(loc)) continue;

    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/i)?.[1]?.trim() || null;
    const title = titleFromPathUrl(loc, titlePathStrip);
    if (!title) continue;
    items.push({ link: loc, pubDate: lastmod, title });
  }

  return items;
}

async function fetchSitemapSource(source) {
  if (!source.sitemapUrl) return [];

  const response = await fetch(source.sitemapUrl, {
    headers: {
      Accept: 'application/xml,text/xml',
      'User-Agent': 'UnofficialCursorNews/1.0',
    },
    signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Sitemap fetch ${response.status} for ${source.sitemapUrl}`);
  }

  const xml = await response.text();
  const entries = parseSitemapUrls(xml, {
    urlPattern: source.urlPattern,
    skipPattern: source.skipPattern,
    titlePathStrip: source.titlePathStrip || '/learn/',
  });
  const defaultSummary =
    source.defaultExcerpt || 'Official Cursor tutorial — tap to open on cursor.com.';
  return entries.map((entry) =>
    normalizeScrapedEntry(source, {
      ...entry,
      summary: defaultSummary,
    }),
  );
}

export async function ingestSitemapSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'sitemap');
  if (sources.length === 0) return [];

  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchSitemapSource(source);
      } catch (err) {
        console.error('[sitemap]', source.id, err.message);
        return [];
      }
    }),
  );

  return batches.flat();
}
