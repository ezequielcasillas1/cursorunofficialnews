import {
  NEWSLETTER_CATEGORIES,
  NEWSLETTER_CATEGORY_LIMIT,
  NEWSLETTER_PANEL_DEFAULT_EXPANDED,
} from '../../newsletter/config.js';
import {
  useNewsletter,
} from '../../newsletter/useNewsletter.js';
import { CollapsiblePanel } from '../ui/CollapsiblePanel.jsx';

function digestStateLabel(prefs) {
  if (prefs.pendingVerification) return 'Pending — check your email';
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
    setCategoryLimit,
    setEnabled,
    subscribe,
    unsubscribe,
  } = useNewsletter();

  return (
    <CollapsiblePanel
      id="newsletter-settings"
      className="newsletter-panel"
      eyebrow="Email digest · Beta"
      title="Newsletter options"
      subtitle="Choose topics, manage your subscription, and save your preferences in this browser."
      summary={loading ? 'Loading newsletter settings…' : collapsedSummary(prefs)}
      defaultExpanded={NEWSLETTER_PANEL_DEFAULT_EXPANDED}
      loading={loading}
    >
      <p className="newsletter-beta-notice" role="note">
        <strong>Beta.</strong> This email digest is still in development. If you sign up
        now, you may or may not receive newsletters until we finish the feature. Already
        subscribed? We may email you to explain that delivery might not be possible during
        beta — but if digests are already going out, you could keep receiving them. We
        cannot promise either outcome yet.
      </p>

      {prefs.pendingVerification ? (
        <p className="newsletter-pending-notice" role="status">
          We sent a confirmation link to <strong>{prefs.email}</strong>. Open that email
          and click <strong>Confirm subscription</strong> to finish signing up. Digests
          start only after you confirm.
        </p>
      ) : null}

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
            community, social, videos, and tutorials. For each topic, choose how
            many headlines (1–{NEWSLETTER_CATEGORY_LIMIT.max}) to include per digest.
          </p>
        </div>

        <div className="newsletter-topic-list">
          {NEWSLETTER_CATEGORIES.map((category) => {
            const enabled = prefs.categories.includes(category.id);
            const limit =
              prefs.categoryLimits?.[category.id] ?? NEWSLETTER_CATEGORY_LIMIT.default;

            return (
              <div key={category.id} className="newsletter-topic-row">
                <label className="newsletter-topic-check" htmlFor={`topic-${category.id}`}>
                  <input
                    id={`topic-${category.id}`}
                    type="checkbox"
                    checked={enabled}
                    onChange={() => {
                      toggleCategory(category.id);
                    }}
                    disabled={syncing}
                  />
                </label>
                <div className="newsletter-topic-copy">
                  <strong>{category.label}</strong>
                  <small>{category.description}</small>
                  {enabled ? (
                    <label
                      className="newsletter-topic-limit"
                      htmlFor={`limit-${category.id}`}
                    >
                      <span>Headlines per digest</span>
                      <select
                        id={`limit-${category.id}`}
                        value={limit}
                        onChange={(event) => {
                          setCategoryLimit(category.id, event.target.value);
                        }}
                        disabled={syncing}
                        aria-label={`${category.label} headlines per digest`}
                      >
                        {Array.from(
                          {
                            length:
                              NEWSLETTER_CATEGORY_LIMIT.max -
                              NEWSLETTER_CATEGORY_LIMIT.min +
                              1,
                          },
                          (_, index) => NEWSLETTER_CATEGORY_LIMIT.min + index,
                        ).map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </div>
            );
          })}
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
        New sign-ups must confirm via the email we send before digests begin. This
        browser remembers your settings after you subscribe. You can also unsubscribe
        anytime from the link at the bottom of every digest email.
      </p>
    </CollapsiblePanel>
  );
}
