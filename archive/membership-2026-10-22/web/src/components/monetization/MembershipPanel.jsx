import { useRef, useState } from 'react';
import { MEMBERSHIP_TIER_AMOUNTS } from '../../monetization/config.js';
import { resolveMembershipCheckout } from '../../monetization/resolveMembershipCheckout.js';
import { TurnstileWidget } from '../../monetization/TurnstileWidget.jsx';

const MEMBERSHIP_EMAIL_INFO =
  'Enter the email you used at checkout (or want to use). We send a one-time verification link to confirm your active membership, then the email newsletter unlocks on this device. Ad-free browsing will follow once AdSense is enabled.';

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
        <button
          type="button"
          className="btn taco-info-dialog-close"
          onClick={() => dialogRef.current?.close()}
        >
          Got it
        </button>
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
  claimCaptchaRequired = false,
  claimCaptchaSiteKey = '',
  compact = false,
}) {
  const [email, setEmail] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(MEMBERSHIP_TIER_AMOUNTS[0]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const claimOpen = showClaimForm || claimCaptchaRequired;

  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    if (!onCheckout || checkingOut) return;
    const result = resolveMembershipCheckout({
      email,
      amount: selectedAmount,
      allowedAmounts: MEMBERSHIP_TIER_AMOUNTS,
    });
    if (!result.ok) {
      setEmailError(result.error);
      return;
    }
    setEmailError('');
    await onCheckout(result.amount, result.email);
  }

  async function handleClaimSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !onClaim) return;
    if (claimCaptchaRequired && claimCaptchaSiteKey && !turnstileToken) {
      setEmailError('Complete the CAPTCHA to send another restore link.');
      return;
    }
    setEmailError('');
    await onClaim(email.trim(), { turnstileToken });
    setTurnstileToken('');
    setTurnstileResetKey((value) => value + 1);
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
            Choose a monthly amount to unlock the email newsletter and help fund dev time for this
            unofficial feed. Ad-free browsing is coming soon once AdSense is enabled.
          </p>
        </div>
      </div>

      <form className="taco-checkout-form" onSubmit={handleCheckoutSubmit}>
        <div className="taco-claim-label-row">
          <label htmlFor="taco-membership-email">Membership email</label>
          <MembershipEmailInfoButton />
        </div>
        <div className="taco-claim-row">
          <input
            id="taco-membership-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError('');
            }}
            required
          />
          <button type="submit" className="btn" disabled={checkingOut || !onCheckout}>
            {checkingOut ? 'Opening…' : 'Continue'}
          </button>
        </div>

        <div className="taco-tiers" role="radiogroup" aria-label="Monthly membership amount">
          {MEMBERSHIP_TIER_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              role="radio"
              aria-checked={selectedAmount === amount}
              className={`taco-tier-btn${selectedAmount === amount ? ' taco-tier-btn--selected' : ''}`}
              onClick={() => setSelectedAmount(amount)}
              disabled={checkingOut}
            >
              <span className="taco-tier-price">${amount}</span>
              <span className="taco-tier-label">/ mo</span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary taco-checkout-submit"
          disabled={checkingOut || !onCheckout}
        >
          {checkingOut ? 'Opening checkout…' : `Continue to checkout · $${selectedAmount}/mo`}
        </button>
      </form>

      <p className="taco-footnote">
        Secure checkout via Stripe.{' '}
        <a href="/membership/unsubscribe">Cancel membership</a> anytime — newsletter access stays
        unlocked for as long as your membership is active. Ad-free browsing will be enabled when
        AdSense goes live.
      </p>

      {!claimOpen ? (
        <div className="taco-claim-actions">
          <button type="button" className="taco-claim-toggle" onClick={() => setShowClaimForm(true)}>
            Already a member on another device? Restore access
          </button>
        </div>
      ) : (
        <form className="taco-claim-form" onSubmit={handleClaimSubmit}>
          {claimCaptchaRequired && claimCaptchaSiteKey ? (
            <TurnstileWidget
              key={turnstileResetKey}
              siteKey={claimCaptchaSiteKey}
              onToken={setTurnstileToken}
            />
          ) : null}
          <button
            type="submit"
            className="btn"
            disabled={
              claiming || !email.trim() || (claimCaptchaRequired && Boolean(claimCaptchaSiteKey) && !turnstileToken)
            }
          >
            {claiming ? 'Sending…' : 'Email restore link'}
          </button>
        </form>
      )}
      {checkingOut ? <p className="hint">Opening secure checkout…</p> : null}
      {emailError ? (
        <p className="taco-claim-error" role="alert">
          {emailError}
        </p>
      ) : null}
      {claimError ? <p className="taco-claim-error">{claimError}</p> : null}
      {claimNotice ? <p className="hint">{claimNotice}</p> : null}
    </section>
  );
}

export function SupporterBadge({
  onClear,
  email,
  refundEligibility,
  refunding,
  refundError,
  refundNotice,
  onRequestRefund,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const showRefund = Boolean(refundEligibility?.eligible);

  async function handleConfirmRefund() {
    if (!onRequestRefund) return;
    const ok = await onRequestRefund();
    if (ok) setConfirmOpen(false);
  }

  return (
    <section className="taco-panel taco-panel--supporter">
      <p className="taco-supporter-msg">
        <span aria-hidden="true">💛</span> Member — the email newsletter is unlocked
        {email ? ` for ${email}` : ''}. Ad-free browsing is coming soon once AdSense is enabled.
        Thank you!
      </p>
      {showRefund ? (
        <div className="taco-refund-block">
          <p className="taco-footnote">
            Not happy with your membership? Members at $4/mo and above can request a full refund of
            their latest payment.
          </p>
          {!confirmOpen ? (
            <button type="button" className="taco-claim-toggle" onClick={() => setConfirmOpen(true)}>
              Request a refund
            </button>
          ) : (
            <div className="taco-refund-confirm" role="group" aria-label="Confirm refund">
              <p className="hint">
                This refunds your latest payment, cancels your subscription, and removes member access
                on this device. Continue?
              </p>
              <div className="taco-claim-row">
                <button type="button" className="btn" disabled={refunding} onClick={handleConfirmRefund}>
                  {refunding ? 'Processing…' : 'Yes, refund me'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={refunding}
                  onClick={() => setConfirmOpen(false)}
                >
                  Keep membership
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {refundError ? (
        <p className="taco-claim-error" role="alert">
          {refundError}
        </p>
      ) : null}
      {refundNotice ? <p className="hint">{refundNotice}</p> : null}
      {onClear ? (
        <>
          <a href="/membership/unsubscribe" className="taco-claim-toggle">
            Cancel membership
          </a>
          <button type="button" className="taco-claim-toggle" onClick={onClear}>
            Sign out of membership
          </button>
        </>
      ) : null}
    </section>
  );
}
