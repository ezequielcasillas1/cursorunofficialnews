import { useSiteViews } from '../../hooks/useSiteViews.js';
import { useVisitorStats } from '../../hooks/useVisitorStats.js';

function formatCount(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString();
}

function VisitorHistoryChart({ history }) {
  if (!history?.length) {
    return <p className="visitor-stats-chart-empty">Daily history will appear after the first snapshot.</p>;
  }

  const max = Math.max(...history.map((row) => row.visitors), 1);

  return (
    <div className="visitor-stats-chart" role="img" aria-label="Daily unique visitors, last 30 days">
      {history.map((row) => {
        const heightPct = Math.max(4, Math.round((row.visitors / max) * 100));
        const label = row.date.slice(5);
        return (
          <div key={row.date} className="visitor-stats-chart-bar-wrap">
            <div
              className="visitor-stats-chart-bar"
              style={{ height: `${heightPct}%` }}
              title={`${row.date}: ${row.visitors.toLocaleString()} visitors`}
            />
            <span className="visitor-stats-chart-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function VisitorStatsPanel({ status = null }) {
  const liveOnline = useSiteViews();
  const { stats, error } = useVisitorStats();

  const online = typeof liveOnline === 'number' ? liveOnline : stats?.online ?? null;
  const lastIngest = status?.lastIngestAt ? new Date(status.lastIngestAt) : null;
  const updatedLabel =
    lastIngest && !Number.isNaN(lastIngest.getTime())
      ? lastIngest.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : null;

  return (
    <section className="visitor-stats-panel" aria-label="Site visitor statistics">
      <div className="visitor-stats-panel-header">
        <p className="visitor-stats-kicker">Public dashboard</p>
        <h2 className="visitor-stats-title">Visitors</h2>
        <p className="visitor-stats-subtitle">
          Aggregate counts from Cloudflare Analytics (bots excluded). Live presence uses lightweight heartbeats.
        </p>
      </div>

      <div className="visitor-stats-live" aria-live="polite">
        <span className="visitor-stats-live-value">{formatCount(online)}</span>
        <span className="visitor-stats-live-label">on the site right now</span>
      </div>

      <dl className="visitor-stats-grid">
        <div>
          <dt>Today</dt>
          <dd>{formatCount(stats?.today)}</dd>
        </div>
        <div>
          <dt>Last 7 days</dt>
          <dd>{formatCount(stats?.last7Days)}</dd>
        </div>
        <div>
          <dt>Last 30 days</dt>
          <dd>{formatCount(stats?.last30Days)}</dd>
        </div>
      </dl>

      {error ? (
        <p className="visitor-stats-hint">Visitor totals are temporarily unavailable. Live count may still update.</p>
      ) : stats?.aggregatesSource === 'unavailable' ? (
        <p className="visitor-stats-hint">
          Historical totals need Cloudflare Analytics configured on the Worker. Live presence still works.
        </p>
      ) : null}

      <VisitorHistoryChart history={stats?.history} />

      <footer className="visitor-stats-feed-meta">
        <span>
          Feed{' '}
          <strong className="visitor-stats-feed-active">active</strong>
          {updatedLabel ? ` · ingest ${updatedLabel}` : ''}
        </span>
        {status?.sourceCount ? (
          <span>{status.sourceCount} sources tracked</span>
        ) : null}
      </footer>
    </section>
  );
}
