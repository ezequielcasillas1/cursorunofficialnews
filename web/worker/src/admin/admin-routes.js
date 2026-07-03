import { requireLocalAdmin } from '../middleware/require-local-admin.js';
import {
  deleteAccessOverride,
  getAdminSummary,
  listAdminAudit,
  listMembersForAdmin,
  scanAndBlockIntruders,
  upsertAccessOverride,
} from './membership-admin-store.js';
import { normalizeEmail, isValidEmail } from '../store/email-subscribers.js';

/**
 * Local-only membership admin API — never registered in production responses
 * (middleware returns 404). Bind admin UI to localhost via `npm run dev:admin`.
 */
export function registerAdminRoutes(app) {
  app.use('/v1/admin/*', requireLocalAdmin);

  app.get('/v1/admin/summary', async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({ ok: true, summary: await getAdminSummary(c.env.DB, c.env) });
  });

  app.get('/v1/admin/members', async (c) => {
    c.header('Cache-Control', 'no-store');
    const members = await listMembersForAdmin(c.env.DB, c.env);
    return c.json({ ok: true, members });
  });

  app.post('/v1/admin/intruders/scan', async (c) => {
    c.header('Cache-Control', 'no-store');
    const body = await c.req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const result = await scanAndBlockIntruders(c.env.DB, c.env, {
      actor: 'local_admin',
      dryRun,
    });
    return c.json({ ok: true, ...result });
  });

  app.post('/v1/admin/overrides', async (c) => {
    c.header('Cache-Control', 'no-store');
    const body = await c.req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const overrideStatus = String(body?.overrideStatus || '').trim();
    const reason = body?.reason ? String(body.reason).trim() : null;

    if (!isValidEmail(email)) {
      return c.json({ error: 'Valid email required' }, 400);
    }
    if (!['allow', 'block'].includes(overrideStatus)) {
      return c.json({ error: 'overrideStatus must be allow or block' }, 400);
    }

    const override = await upsertAccessOverride(c.env.DB, {
      email,
      overrideStatus,
      reason,
      actor: 'local_admin',
    });
    return c.json({ ok: true, override });
  });

  app.delete('/v1/admin/overrides/:email', async (c) => {
    c.header('Cache-Control', 'no-store');
    const email = normalizeEmail(c.req.param('email'));
    if (!isValidEmail(email)) {
      return c.json({ error: 'Valid email required' }, 400);
    }
    await deleteAccessOverride(c.env.DB, email, 'local_admin');
    return c.json({ ok: true });
  });

  app.get('/v1/admin/audit', async (c) => {
    c.header('Cache-Control', 'no-store');
    const limit = Number(c.req.query('limit') || 100);
    const entries = await listAdminAudit(c.env.DB, { limit });
    return c.json({ ok: true, entries });
  });
}
