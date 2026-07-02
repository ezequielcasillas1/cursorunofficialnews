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

const REDDIT_FETCH_DELAY_MS = 2_000;
const FEED_FETCH_TIMEOUT_MS = 20_000;

function isRedditFeed(source) {
  return Boolean(source.feedUrl?.includes('reddit.com'));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Workers cannot do the raw Node HTTP request `Parser.parseURL()` performs
 * internally, so fetch the XML ourselves and hand the text to
 * `Parser.parseString()` (pure string parsing — no network).
 */
async function fetchFeedSource(source) {
  if (!source.feedUrl) return [];

  const parser = new Parser({
    headers: {
      ...DEFAULT_FEED_HEADERS,
      ...(source.feedHeaders || {}),
    },
  });

  const response = await fetch(source.feedUrl, {
    headers: {
      ...DEFAULT_FEED_HEADERS,
      ...(source.feedHeaders || {}),
    },
    signal: AbortSignal.timeout(FEED_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Feed fetch ${response.status} for ${source.feedUrl}`);
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);
  return (feed.items || []).map((entry) => normalizeFeedEntry(source, entry));
}

async function ingestFeedSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'rss' || s.ingestMethod === 'atom');
  const redditSources = sources.filter(isRedditFeed);
  const otherSources = sources.filter((s) => !isRedditFeed(s));

  const otherBatches = await Promise.all(
    otherSources.map(async (source) => {
      try {
        return await fetchFeedSource(source);
      } catch (err) {
        console.error('[ingest]', source.id, err.message);
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
    }
    if (redditSources.indexOf(source) < redditSources.length - 1) {
      await delay(REDDIT_FETCH_DELAY_MS);
    }
  }

  return [...otherBatches.flat(), ...redditItems];
}

export async function ingestAllSources(env) {
  const [feedItems, scrapeItems, sitemapItems, twitterItems] = await Promise.all([
    ingestFeedSources(),
    ingestScrapeSources(env),
    ingestSitemapSources(),
    ingestTwitterApiSources(env),
  ]);

  const deduped = dedupeNewsItems(
    [...feedItems, ...scrapeItems, ...sitemapItems, ...twitterItems],
    { getSourceMeta },
  );
  return filterItemsByFeedPolicy(deduped);
}
