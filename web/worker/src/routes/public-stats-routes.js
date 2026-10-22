import { buildPublicVisitorStats } from '../analytics/visitor-stats-payload.js';
import { getActiveVisitorCount, pruneStalePresence } from '../store/site-views.js';
import { isAutomatedVisitorRequest } from '../security/visitor-bot.js';

const STATS_CACHE_SECONDS = 120;

export function registerPublicStatsRoutes(app) {
  app.get('/v1/public/visitor-stats', async (c) => {
    const db = c.env.DB;

    try {
      await pruneStalePresence(db);
      const online = await getActiveVisitorCount(db);
      const payload = await buildPublicVisitorStats(db, c.env, { online });

      c.header('Cache-Control', `public, max-age=${STATS_CACHE_SECONDS}, stale-while-revalidate=60`);
      return c.json(payload);
    } catch (err) {
      console.error('[GET /v1/public/visitor-stats]', err.message || err);
      c.header('Cache-Control', 'public, max-age=30');
      return c.json({
        online: 0,
        today: null,
        last7Days: null,
        last30Days: null,
        history: [],
        aggregatesSource: 'unavailable',
        sampleData: false,
        asOf: new Date().toISOString(),
      });
    }
  });
}
