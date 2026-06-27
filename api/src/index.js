import cors from 'cors';
import express from 'express';
import { ingestAllSources } from './ingest/feeds.js';
import { isScrapeConfigured } from './ingest/scrape.js';
import { listSourcesForApi } from './sources/registry.js';
import {
  getLastIngestAt,
  getNews,
  getStatus,
  replaceItems,
  setLastIngestAt,
} from './store/memory-cache.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/v1/status', (_req, res) => {
  res.json({
    ...getStatus(),
    scrapeConfigured: isScrapeConfigured(),
  });
});

app.get('/v1/sources', (_req, res) => {
  res.json({ sources: listSourcesForApi() });
});

app.get('/v1/news', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const category = req.query.category ? String(req.query.category) : undefined;
  const official = req.query.official === 'true';
  res.json({
    items: getNews({
      category,
      official,
      limit: Number.isFinite(limit) ? limit : 50,
    }),
    lastIngestAt: getLastIngestAt(),
  });
});

function applyIngestResult(items) {
  if (items.length === 0) {
    console.warn('[ingest] No items returned — keeping existing cache');
    return getLastIngestAt();
  }
  replaceItems(items);
  const ingestedAt = new Date().toISOString();
  setLastIngestAt(ingestedAt);
  return ingestedAt;
}

app.post('/v1/ingest', async (_req, res) => {
  try {
    const items = await ingestAllSources();
    const lastIngestAt = applyIngestResult(items);
    res.json({
      ok: true,
      count: items.length,
      cachedCount: getStatus().itemCount,
      lastIngestAt,
    });
  } catch (err) {
    console.error('[POST /v1/ingest]', err);
    res.status(500).json({ error: err.message || 'Ingest failed' });
  }
});

async function bootstrapIngestIfEmpty() {
  if (getStatus().itemCount > 0) return;
  try {
    console.log('[bootstrap] Cache empty — running ingest…');
    const items = await ingestAllSources();
    const lastIngestAt = applyIngestResult(items);
    if (items.length > 0) {
      console.log(`[bootstrap] Ingested ${items.length} items`);
    } else {
      console.warn('[bootstrap] Ingest returned 0 items — cache still empty');
    }
    if (lastIngestAt) {
      console.log(`[bootstrap] lastIngestAt ${lastIngestAt}`);
    }
  } catch (err) {
    console.error('[bootstrap]', err.message || err);
  }
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Unofficial Cursor News API listening on http://0.0.0.0:${port}`);
  bootstrapIngestIfEmpty();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] Port ${port} already in use — stop the other process and restart`);
    process.exit(1);
  }
  throw err;
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);