import cors from 'cors';
import express from 'express';
import { ingestAllSources } from './ingest/feeds.js';
import { listSources } from './sources/registry.js';
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
  res.json(getStatus());
});

app.get('/v1/sources', (_req, res) => {
  res.json({ sources: listSources() });
});

app.get('/v1/news', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const category = req.query.category ? String(req.query.category) : undefined;
  res.json({
    items: getNews({ category, limit: Number.isFinite(limit) ? limit : 50 }),
    lastIngestAt: getLastIngestAt(),
  });
});

app.post('/v1/ingest', async (_req, res) => {
  try {
    const items = await ingestAllSources();
    replaceItems(items);
    const ingestedAt = new Date().toISOString();
    setLastIngestAt(ingestedAt);
    res.json({ ok: true, count: items.length, lastIngestAt: ingestedAt });
  } catch (err) {
    console.error('[POST /v1/ingest]', err);
    res.status(500).json({ error: err.message || 'Ingest failed' });
  }
});

app.listen(port, () => {
  console.log(`Unofficial Cursor News API listening on http://127.0.0.1:${port}`);
});