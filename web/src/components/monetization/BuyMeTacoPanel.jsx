import { useState } from 'react';
import {
  BMC_USERNAME,
  getTacoTierUrl,
  isBmcConfigured,
  TACO_TIER_AMOUNTS,
} from '../../monetization/config.js';

export function BuyMeTacoPanel({ onClaim, claiming, claimError, claimNotice, compact = false }) {
  const [email, setEmail] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);

  if (!isBmcConfigured()) {
    return (
      <section className="taco-panel taco-panel--muted">
        <p className="hint">
          Support tiers coming soon — set <code>VITE_BMC_USERNAME</code> to enable Buy Me a Coffee.
        </p>
      </section>
    );
  }

  async function handleClaimSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !onClaim) return;
    const ok = await onClaim(email.trim());
    if (ok) setShowClaimForm(false);
  }

  return (
    <section className={`taco-panel${compact ? ' taco-panel--compact' : ''}`}>
      <div className="taco-panel-header">
        <span className="taco-emoji" aria-hidden="true">
          🌮
        </span>
        <div>
          <h2 className="taco-title">Buy me a taco</h2>
          <p className="taco-subtitle">
            Monthly support removes ads and helps fund dev time for this unofficial feed.
          </p>
        </div>
      </div>

      <div className="taco-tiers" role="group" aria-label="Monthly support tiers">
        {TACO_TIER_AMOUNTS.map((amount) => {
          const href = getTacoTierUrl(amount);
          return (
            <a
              key={amount}
              className="taco-tier-btn"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="taco-tier-price">${amount}</span>
              <span className="taco-tier-label">/ mo</span>
            </a>
          );
        })}
      </div>

      <p className="taco-footnote">
        Subscriptions are handled on Buy Me a Coffee. After joining, request a one-time verification link sent to the same email to hide ads.
      </p>

      {!showClaimForm ? (
        <button type="button" className="taco-claim-toggle" onClick={() => setShowClaimForm(true)}>
          Already subscribed? Hide ads
        </button>
      ) : (
        <form className="taco-claim-form" onSubmit={handleClaimSubmit}>
          <label htmlFor="taco-claim-email">Membership email</label>
          <div className="taco-claim-row">
            <input
              id="taco-claim-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit" className="btn" disabled={claiming}>
              {claiming ? 'Sending…' : 'Email link'}
            </button>
          </div>
          {claimError ? <p className="taco-claim-error">{claimError}</p> : null}
        </form>
      )}
      {claimNotice ? <p className="hint">{claimNotice}</p> : null}
    </section>
  );
}

export function SupporterBadge({ onClear, email }) {
  return (
    <section className="taco-panel taco-panel--supporter">
      <p className="taco-supporter-msg">
        <span aria-hidden="true">🌮</span> Supporter — ads are off
        {email ? ` for ${email}` : ''}. Thank you!
      </p>
      {onClear ? (
        <button type="button" className="taco-claim-toggle" onClick={onClear}>
          Sign out of ad-free mode
        </button>
      ) : null}
    </section>
  );
}
