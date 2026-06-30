import { listSources } from '../sources/registry.js';
import { normalizeScrapedEntry } from '../normalize/news-item.js';

const SCRAPE_TIMEOUT_MS = 30_000;
const DEFAULT_BLOG_PATH_PATTERN = /^\/blog\/[^/]+/;

export function isScrapeConfigured() {
  return Boolean(process.env.SCRAPE_API_URL?.trim() && process.env.SCRAPE_API_KEY?.trim());
}

function parseBlogAnchorText(rawText) {
  const inner = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!inner || inner.length < 8) return null;

  const dated = inner.match(/^([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})\s*[·•|-]\s*(.+)$/);
  if (dated) {
    return {
      title: dated[2].trim().slice(0, 200),
      pubDate: dated[1],
    };
  }

  return {
    title: inner.slice(0, 200),
    pubDate: null,
  };
}

function parseGenericAnchorText(rawText) {
  const inner = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!inner || inner.length < 4) return null;

  return {
    title: inner.slice(0, 200),
    pubDate: null,
  };
}

function resolveLinkPathPatterns(source) {
  if (source.linkPathPatterns?.length) return source.linkPathPatterns;
  if (source.linkPathPattern) return [source.linkPathPattern];
  return [DEFAULT_BLOG_PATH_PATTERN];
}

function pathMatchesPatterns(path, patterns) {
  return patterns.some((pattern) => pattern.test(path));
}

export function extractPageLinks(html, baseUrl, source = {}) {
  if (!html) return [];

  const origin = new URL(baseUrl).origin;
  const pagePath = new URL(baseUrl).pathname.replace(/\/$/, '') || '/';
  const patterns = resolveLinkPathPatterns(source);
  const parseAnchor =
    source.scrapeLinkMode === 'blog' ? parseBlogAnchorText : parseGenericAnchorText;
  const skipPattern = source.skipPathPattern;
  const seen = new Set();
  const items = [];

  const anchorRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
      continue;
    }

    const parsed = parseAnchor(match[2]);
    if (!parsed?.title) continue;

    let absolute;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }

    if (!absolute.startsWith(origin)) continue;

    const path = new URL(absolute).pathname;
    if (!pathMatchesPatterns(path, patterns)) continue;
    if (skipPattern?.test(path)) continue;
    if (path.replace(/\/$/, '') === pagePath) continue;

    if (source.scrapeLinkMode === 'blog' || !source.linkPathPattern) {
      if (path === '/blog' || path === '/blog/') continue;
      if (/^\/blog\/topic\//.test(path)) continue;
    }

    if (seen.has(absolute)) continue;
    seen.add(absolute);

    items.push({
      title: parsed.title,
      link: absolute,
      summary: '',
      pubDate: parsed.pubDate,
    });
  }

  return items;
}

async function fetchPageHtml(pageUrl) {
  const response = await fetch(pageUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'UnofficialCursorNews/1.0',
    },
    signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Direct fetch ${response.status} for ${pageUrl}`);
  }

  return response.text();
}

async function callScrapeApi(pageUrl) {
  const apiUrl = process.env.SCRAPE_API_URL.trim();
  const apiKey = process.env.SCRAPE_API_KEY.trim();

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: pageUrl,
      formats: ['html', 'markdown'],
      onlyMainContent: true,
    }),
    signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Scrape API ${response.status}: ${body.slice(0, 120)}`);
  }

  const payload = await response.json();
  const data = payload.data || payload;
  return {
    html: data.html || '',
    markdown: data.markdown || '',
    metadata: data.metadata || {},
  };
}

async function fetchScrapeSource(source) {
  const pageUrls =
    source.scrapePageUrls?.length > 0
      ? source.scrapePageUrls
      : source.pageUrl
        ? [source.pageUrl]
        : [];
  if (pageUrls.length === 0) return [];

  const seenLinks = new Set();
  const mergedEntries = [];

  for (const pageUrl of pageUrls) {
    let html;
    let metadata = {};

    if (isScrapeConfigured()) {
      ({ html, metadata } = await callScrapeApi(pageUrl));
    } else {
      html = await fetchPageHtml(pageUrl);
    }

    let entries = extractPageLinks(html, pageUrl, source);

    if (entries.length === 0 && metadata.title && metadata.sourceURL) {
      entries = [{
        title: metadata.title,
        link: metadata.sourceURL,
        summary: metadata.description || '',
        pubDate: metadata.publishedTime || metadata.modifiedTime || null,
      }];
    }

    for (const entry of entries) {
      const link = entry.link || entry.url;
      if (!link || seenLinks.has(link)) continue;
      seenLinks.add(link);
      mergedEntries.push(entry);
    }
  }

  const defaultSummary = source.defaultExcerpt || '';
  return mergedEntries.map((entry) =>
    normalizeScrapedEntry(source, {
      ...entry,
      summary: entry.summary || defaultSummary,
    }),
  );
}

export async function ingestScrapeSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'scrape' && s.enabled);
  if (sources.length === 0) return [];

  if (!isScrapeConfigured()) {
    console.warn('[scrape] SCRAPE_API_URL/SCRAPE_API_KEY not set — using direct page fetch');
  }
  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchScrapeSource(source);
      } catch (err) {
        console.error('[scrape]', source.id, err.message);
        return [];
      }
    }),
  );

  return batches.flat();
}
