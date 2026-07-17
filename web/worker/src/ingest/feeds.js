import Parser from 'rss-parser';
import { filterItemsByFeedPolicy } from '../shared/feed/feedPolicy.js';
import { listSources, getSourceMeta } from '../sources/registry.js';
import { normalizeFeedEntry, dedupeNewsItems } from '../normalize/news-item.js';
import { ingestScrapeSources } from './scrape.js';
import { ingestSitemapSources } from './sitemap.js';
import { ingestTwitterApiSources } from './twitter-api.js';

const DEFAULT_FEED_HEADERS = {
  'User-Agent': 'UnofficialCursorNews/1.0 (+https://cursorunofficial.news)',
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
};

/** Reddit requires a descriptive UA; datacenter IPs are rate-limited aggressively. */
const REDDIT_FEED_HEADERS = {
  'User-Agent': 'web:UnofficialCursorNews:1.0 (by /u/cursorunofficialnews)',
  Accept: 'application/atom+xml, application/xml, text/xml, */*',
};

const REDDIT_FETCH_DELAY_MS = 12_000;
const REDDIT_MAX_RETRIES = 4;
const REDDIT_MIN_RETRY_AFTER_SEC = 15;
const FEED_FETCH_TIMEOUT_MS = 20_000;

function isRedditFeed(source) {
  return Boolean(source.feedUrl?.includes('reddit.com'));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Prefer old.reddit.com, then www — both share the same RSS body when healthy. */
function redditFeedUrlCandidates(feedUrl) {
  const urls = [feedUrl];
  if (feedUrl.includes('://old.reddit.com/')) {
    urls.push(feedUrl.replace('://old.reddit.com/', '://www.reddit.com/'));
  } else if (feedUrl.includes('://www.reddit.com/')) {
    urls.push(feedUrl.replace('://www.reddit.com/', '://old.reddit.com/'));
  }
  return [...new Set(urls)];
}

/**
 * Workers cannot do the raw Node HTTP request `Parser.parseURL()` performs
 * internally, so fetch the XML ourselves and hand the text to
 * `Parser.parseString()` (pure string parsing — no network).
 */
async function fetchFeedSource(source) {
  if (!source.feedUrl) return [];

  const isReddit = isRedditFeed(source);
  const requestHeaders = {
    ...DEFAULT_FEED_HEADERS,
    ...(source.feedHeaders || {}),
    ...(isReddit ? REDDIT_FEED_HEADERS : {}),
  };

  const parser = new Parser({ headers: requestHeaders });
  const urlCandidates = isReddit
    ? redditFeedUrlCandidates(source.feedUrl)
    : [source.feedUrl];
  const maxAttempts = isReddit ? REDDIT_MAX_RETRIES : 1;
  let lastError = null;

  for (const feedUrl of urlCandidates) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await fetch(feedUrl, {
          headers: requestHeaders,
          signal: AbortSignal.timeout(FEED_FETCH_TIMEOUT_MS),
        });

        if (response.status === 429 && isReddit && attempt < maxAttempts - 1) {
          const headerRetry = Number(response.headers.get('retry-after'));
          const retryAfterSec = Number.isFinite(headerRetry) && headerRetry > 0
            ? headerRetry
            : Math.max(REDDIT_MIN_RETRY_AFTER_SEC, 2 ** attempt * 8);
          await delay(retryAfterSec * 1000);
          continue;
        }

        if (!response.ok) {
          lastError = new Error(`Feed fetch ${response.status} for ${feedUrl}`);
          // Try next Reddit host on hard failures; 429 exhausted retries → next host.
          break;
        }

        const xml = await response.text();
        if (!xml.trim()) {
          lastError = new Error(`Feed fetch empty body for ${feedUrl}`);
          break;
        }

        const feed = await parser.parseString(xml);
        return (feed.items || []).map((entry) => normalizeFeedEntry(source, entry));
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (isReddit && attempt < maxAttempts - 1) {
          await delay(Math.max(REDDIT_MIN_RETRY_AFTER_SEC, 2 ** attempt * 8) * 1000);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error(`Feed fetch exhausted retries for ${source.feedUrl}`);
}

async function ingestFeedSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'rss' || s.ingestMethod === 'atom');
  const redditSources = sources.filter(isRedditFeed);
  const otherSources = sources.filter((s) => !isRedditFeed(s));
  const failedSourceIds = [];

  const otherBatches = await Promise.all(
    otherSources.map(async (source) => {
      try {
        return await fetchFeedSource(source);
      } catch (err) {
        console.error('[ingest]', source.id, err.message);
        failedSourceIds.push(source.id);
        return [];
      }
    }),
  );

  const redditItems = [];
  for (const source of redditSources) {
    try {
      redditItems.push(...(await fetchFeedSource(source)));
    } catch (err) {
      console.error('[ingest]', source.id, err.message);
      failedSourceIds.push(source.id);
    }
    if (redditSources.indexOf(source) < redditSources.length - 1) {
      await delay(REDDIT_FETCH_DELAY_MS);
    }
  }

  return {
    items: [...otherBatches.flat(), ...redditItems],
    failedSourceIds,
  };
}

export async function ingestAllSources(env) {
  const [feedResult, scrapeItems, sitemapItems, twitterItems] = await Promise.all([
    ingestFeedSources(),
    ingestScrapeSources(env),
    ingestSitemapSources(),
    ingestTwitterApiSources(env),
  ]);

  const deduped = dedupeNewsItems(
    [...feedResult.items, ...scrapeItems, ...sitemapItems, ...twitterItems],
    { getSourceMeta },
  );
  return {
    items: filterItemsByFeedPolicy(deduped),
    failedSourceIds: feedResult.failedSourceIds,
  };
}
