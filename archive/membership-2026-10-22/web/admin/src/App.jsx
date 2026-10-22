import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearOverride,
  getAudit,
  getMembers,
  getSummary,
  hasAdminSecret,
  scanIntruders,
  setOverride,
} from './services/adminApi.js';

function StatusBadge({ label, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

function SummaryCards({ summary }) {
  if (!summary) return null;
  const items = [
    { label: 'Total members', value: summary.total, tone: 'neutral' },
    { label: 'Active', value: summary.active, tone: 'ok' },
    { label: 'Stripe-backed', value: summary.stripeBacked, tone: 'ok' },
    { label: 'Grandfathered', value: summary.grandfathered, tone: 'info' },
    { label: 'Pending intruders', value: summary.pendingIntruders, tone: 'warn' },
    { label: 'Blocked', value: summary.blocked, tone: 'danger' },
  ];

  return (
    <section className="summary-grid" aria-label="Membership summary">
      {items.map((item) => (
        <article key={item.label} className="summary-card">
          <p className="summary-label">{item.label}</p>
          <p className={`summary-value tone-${item.tone}`}>{item.value}</p>
        </article>
      ))}
    </section>
  );
}

function MemberRow({ member, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  async function handleOverride(status) {
    setBusy(true);
    try {
      await setOverride({
        email: member.email,
        overrideStatus: status,
        reason: reason.trim() || undefined,
      });
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClearOverride() {
    setBusy(true);
    try {
      await clearOverride(member.email);
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tone = member.blocked
    ? 'danger'
    : member.isIntruder
      ? 'warn'
      : member.active
        ? 'ok'
        : 'neutral';

  return (
    <tr>
      <td>{member.email}</td>
      <td>
        <StatusBadge label={member.active ? 'active' : member.status} tone={tone} />
        {member.blocked ? <StatusBadge label="blocked" tone="danger" /> : null}
        {member.isIntruder && member.active ? <StatusBadge label="intruder" tone="warn" /> : null}
        {member.isGrandfathered ? <StatusBadge label="grandfathered" tone="info" /> : null}
      </td>
      <td>{member.accessSource || '—'}</td>
      <td>{member.membershipStartedAt ? new Date(member.membershipStartedAt).toLocaleString() : '—'}</td>
      <td>{member.stripeSubscriptionId ? 'yes' : 'no'}</td>
      <td>
        <ul className="reason-list">
          {(member.classificationReasons || []).map((reasonText) => (
            <li key={reasonText}>{reasonText}</li>
          ))}
        </ul>
      </td>
      <td>
        <label className="sr-only" htmlFor={`reason-${member.email}`}>
          Override reason for {member.email}
        </label>
        <input
          id={`reason-${member.email}`}
          type="text"
          placeholder="Optional reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        />
        <div className="row-actions">
          <button type="button" disabled={busy} onClick={() => handleOverride('allow')}>
            Allow
          </button>
          <button type="button" disabled={busy} onClick={() => handleOverride('block')}>
            Block
          </button>
          {member.overrideStatus ? (
            <button type="button" disabled={busy} onClick={handleClearOverride}>
              Clear override
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function AuditPanel({ entries }) {
  if (!entries?.length) {
    return <p className="muted">No audit entries yet.</p>;
  }

  return (
    <ol className="audit-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
          <strong>{entry.action}</strong>
          {entry.email ? <span>{entry.email}</span> : null}
          <span className="muted">by {entry.actor}</span>
        </li>
      ))}
    </ol>
  );
}

export function App() {
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  const secretConfigured = hasAdminSecret();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, membersRes, auditRes] = await Promise.all([
        getSummary(),
        getMembers(),
        getAudit(),
      ]);
      setSummary(summaryRes.summary);
      setMembers(membersRes.members);
      setAudit(auditRes.entries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredMembers = useMemo(() => {
    switch (filter) {
      case 'intruders':
        return members.filter((m) => m.isIntruder && m.active);
      case 'blocked':
        return members.filter((m) => m.blocked);
      case 'active':
        return members.filter((m) => m.active);
      case 'grandfathered':
        return members.filter((m) => m.isGrandfathered);
      default:
        return members;
    }
  }, [members, filter]);

  async function handleScan(dryRun) {
    setScanMessage('');
    try {
      const result = await scanIntruders({ dryRun });
      setScanMessage(
        dryRun
          ? `Dry run: ${result.intrudersFound} intruder(s) would be blocked.`
          : `Blocked ${result.intrudersFound} intruder(s).`,
      );
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Local only · not deployed to production</p>
          <h1>Membership Admin</h1>
          <p className="lede">Review subscribers, detect intruders, and manage access overrides.</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => refresh()} disabled={loading}>
            Refresh
          </button>
          <button type="button" onClick={() => handleScan(true)}>
            Scan (dry run)
          </button>
          <button type="button" className="danger" onClick={() => handleScan(false)}>
            Scan &amp; block intruders
          </button>
        </div>
      </header>

      {!secretConfigured ? (
        <div className="banner banner-warn" role="alert">
          Set <code>LOCAL_ADMIN_SECRET</code> or <code>INGEST_SECRET</code> in{' '}
          <code>env/server/.env</code>, then restart <code>npm run dev:admin</code>.
        </div>
      ) : null}

      {error ? (
        <div className="banner banner-danger" role="alert">
          {error}
        </div>
      ) : null}

      {scanMessage ? <div className="banner banner-ok">{scanMessage}</div> : null}

      <SummaryCards summary={summary} />

      <section className="panel">
        <div className="panel-head">
          <h2>Members</h2>
          <label htmlFor="member-filter">Filter</label>
          <select id="member-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="intruders">Pending intruders</option>
            <option value="blocked">Blocked</option>
            <option value="grandfathered">Grandfathered</option>
          </select>
        </div>

        {loading ? (
          <p className="muted">Loading members…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Access source</th>
                  <th scope="col">Started</th>
                  <th scope="col">Stripe sub</th>
                  <th scope="col">Classification</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <MemberRow key={member.email} member={member} onRefresh={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Audit log</h2>
        <AuditPanel entries={audit} />
      </section>
    </div>
  );
}
