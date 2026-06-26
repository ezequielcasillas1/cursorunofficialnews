import Parser from 'rss-parser';
import { listSources } from '../sources/registry.js';
import { normalizeFeedEntry, buildDedupeKey } from '../normalize/news-item.js';

const parser = new Parser();

async function fetchSource(source) {
  if (!source.feedUrl) return [];
  const feed = await parser.parseURL(source.feedUrl);
  return (feed.items || []).map((entry) => normalizeFeedEntry(source, entry));
}

export async function ingestAllSources() {
  const sources = listSources().filter((s) => s.ingestMethod === 'rss' || s.ingestMethod === 'atom');
  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchSource(source);
      } catch (err) {
        console.error('[ingest]', source.id, err.message);
        return [];
      }
    }),
  );

  const merged = batches.flat();
  const byKey = new Map();
  for (const item of merged) {
    const key = buildDedupeKey({
      canonicalUrl: item.canonicalUrl,
      title: item.title,
      publishedAt: item.publishedAt,
      sourceId: item.sourceId,
    });
    if (!byKey.has(key)) byKey.set(key, item);
  }

  return [...byKey.values()];
}