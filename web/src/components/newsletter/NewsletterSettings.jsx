import {
  NEWSLETTER_CATEGORIES,
  NEWSLETTER_PANEL_DEFAULT_EXPANDED,
} from '../../newsletter/config.js';
import {
  useNewsletter,
} from '../../newsletter/useNewsletter.js';
import { CollapsiblePanel } from '../ui/CollapsiblePanel.jsx';

function digestStateLabel(prefs) {
  return prefs.enabled ? 'Subscribed · Digest mode' : 'Off — no emails sent';
}

function collapsedSummary(prefs) {
  if (prefs.enabled && prefs.email) {
    return `${digestStateLabel(prefs)} · ${prefs.email}`;
  }
  return digestStateLabel(prefs);
}

export function NewsletterSettings() {
  const {
    prefs,
    loading,
    syncing,
    statusMessage,
    errorMessage,
    setEmail,
    toggleCategory,
    setEnabled,
    subscribe,
    unsubscribe,
  } = useNewsletter();

  return (
    <CollapsiblePanel
      id="newsletter-settings"
      className="newsletter-panel"
      eyebrow="Email digest"
      title="Newsletter options"
      subtitle="Mirror the mobile app’s digest controls on web: choose topics, manage your subscription, and keep state on this browser with a secure manage token."
      summary={loading ? 'Loading newsletter settings…' : collapsedSummary(prefs)}
      defaultExpanded={NEWSLETTER_PANEL_DEFAULT_EXPANDED}
      loading={loading}
    >
      <div className="newsletter-grid">
        <label className="newsletter-field" htmlFor="newsletter-email">
          <span className="newsletter-field-label">Email address</span>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={prefs.email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={syncing}
          />
        </label>

        <label className="newsletter-toggle">
          <span className="newsletter-field-label">Enable email digest</span>
          <span className="newsletter-toggle-row">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(event) => {
                void setEnabled(event.target.checked);
              }}
              disabled={syncing}
            />
            <span className="newsletter-toggle-copy">
              <strong>{prefs.enabled ? 'On' : 'Off'}</strong>
              <small>{digestStateLabel(prefs)}</small>
            </span>
          </span>
        </label>
      </div>

      <div className="newsletter-topics">
        <div className="newsletter-topics-header">
          <h3>Email topics</h3>
          <p className="hint">
            Same digest topic options as mobile: changelog, releases, blog, forum,
            community, social, videos, and tutorials.
          </p>
        </div>

        <div className="newsletter-topic-list">
          {NEWSLETTER_CATEGORIES.map((category) => (
            <label key={category.id} className="newsletter-topic-row">
              <span className="newsletter-topic-check">
                <input
                  type="checkbox"
                  checked={prefs.categories.includes(category.id)}
                  onChange={() => {
                    toggleCategory(category.id);
                  }}
                  disabled={syncing}
                />
              </span>
              <span className="newsletter-topic-copy">
                <strong>{category.label}</strong>
                <small>{category.description}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      {syncing ? <p className="hint">Saving newsletter settings…</p> : null}
      {statusMessage ? (
        <p className="newsletter-status newsletter-status-success">{statusMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="newsletter-status newsletter-status-error">{errorMessage}</p>
      ) : null}

      <div className="newsletter-actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            void subscribe();
          }}
          disabled={syncing}
        >
          {prefs.enabled && prefs.manageToken ? 'Save changes' : 'Subscribe'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void unsubscribe();
          }}
          disabled={syncing}
        >
          Unsubscribe
        </button>
      </div>

      <p className="hint newsletter-footer-note">
        This browser stores a secure manage token after subscribe/update so status
        checks and unsubscribe stay tokenized. The secure unsubscribe link in each
        digest email also works if this browser loses local state.
      </p>
    </CollapsiblePanel>
  );
}
