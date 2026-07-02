import { useRef, useState } from 'react';
import { MEMBERSHIP_TIER_AMOUNTS } from '../../monetization/config.js';

const MEMBERSHIP_EMAIL_INFO =
  'Enter the email you used at checkout (or want to use). We send a one-time verification link to confirm your active membership, then ad-free browsing and the email newsletter unlock on this device.';

function MembershipEmailInfoButton() {
  const dialogRef = useRef(null);

  return (
    <>
      <button
        type="button"
        className="taco-info-btn"
        aria-label="Why is email required?"
        onClick={() => dialogRef.current?.showModal()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="taco-info-icon">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 11v5M12 8.5h.01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <dialog ref={dialogRef} className="taco-info-dialog">
        <p className="taco-info-dialog-text">{MEMBERSHIP_EMAIL_INFO}</p>
        <form method="dialog">
          <button type="submit" className="btn taco-info-dialog-close">
            Got it
          </button>
        </form>
      </dialog>
    </>
  );
}

export function MembershipPanel({
  onCheckout,
  checkingOut,
  onClaim,
  claiming,
  claimError,
  claimNotice,
  compact = false,
}) {
  const [email, setEmail] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);

  async function handleTierClick(amount) {
    if (!onCheckout) return;
    await onCheckout(amount);
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
          💛
        </span>
        <div>
          <h2 className="taco-title">Become a member</h2>
          <p className="taco-subtitle">
            Choose a monthly amount to unlock ad-free browsing and the email newsletter, and help fund
            dev time for this unofficial feed.
          </p>
        </div>
      </div>

      <div className="taco-tiers" role="group" aria-label="Monthly membership tiers">
        {MEMBERSHIP_TIER_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            className="taco-tier-btn"
            onClick={() => handleTierClick(amount)}
            disabled={checkingOut}
          >
            <span className="taco-tier-price">${amount}</span>
            <span className="taco-tier-label">/ mo</span>
          </button>
        ))}
      </div>

      <p className="taco-footnote">
        Secure checkout via Stripe. Cancel anytime — ad-free browsing and the newsletter stay unlocked
        for as long as your membership is active.
      </p>

      {!showClaimForm ? (
        <div className="taco-claim-actions">
          <button type="button" className="taco-claim-toggle" onClick={() => setShowClaimForm(true)}>
            Already a member on another device? Restore access
          </button>
          <MembershipEmailInfoButton />
        </div>
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
        </form>
      )}
      {checkingOut ? <p className="hint">Opening secure checkout…</p> : null}
      {claimError ? <p className="taco-claim-error">{claimError}</p> : null}
      {claimNotice ? <p className="hint">{claimNotice}</p> : null}
    </section>
  );
}

export function SupporterBadge({ onClear, email }) {
  return (
    <section className="taco-panel taco-panel--supporter">
      <p className="taco-supporter-msg">
        <span aria-hidden="true">💛</span> Member — ads are off and the newsletter is unlocked
        {email ? ` for ${email}` : ''}. Thank you!
      </p>
      {onClear ? (
        <button type="button" className="taco-claim-toggle" onClick={onClear}>
          Sign out of membership
        </button>
      ) : null}
    </section>
  );
}
