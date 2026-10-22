import { snapshotVisitorDay, yesterdayUtcDateKey } from '../analytics/visitor-stats-payload.js';
import { isCloudflareAnalyticsConfigured } from '../analytics/cloudflare-graphql.js';

/**
 * Daily cron: store one aggregate unique-visitor count per UTC day in D1.
 */
export async function runVisitorAnalyticsSnapshot(db, env, { now = new Date(), dateKey } = {}) {
  if (!isCloudflareAnalyticsConfigured(env)) {
    return { skipped: true, reason: 'analytics_not_configured' };
  }

  const targetDate = dateKey || yesterdayUtcDateKey(now);
  return snapshotVisitorDay(db, env, targetDate);
}
