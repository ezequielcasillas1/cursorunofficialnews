import Parser from 'rss-parser';
import { listSources, getSourceMeta } from '../sources/registry.js';
import { normalizeFeedEntry, dedupeNewsItems } from '../normalize/news-item.js';
import { ingestScrapeSources } from './scrape.js';

const parser = new Parser();

async function fetchFeedSource(source) {
  if (!source.feedUrl) return [];
  const feed = await parser.parseURL(source.feedUrl);
  return (feed.items || []).map((entry) => normalizeFeedEntry(source, entry));
}

async function ingestFeedSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'rss' || s.ingestMethod === 'atom');
  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchFeedSource(source);
      } catch (err) {
        console.error('[ingest]', source.id, err.message);
        return [];
      }
    }),
  );
  return batches.flat();
}

export async function ingestAllSources() {
  const [feedItems, scrapeItems] = await Promise.all([
    ingestFeedSources(),
    ingestScrapeSources(),
  ]);

  return dedupeNewsItems([...feedItems, ...scrapeItems], { getSourceMeta });
}