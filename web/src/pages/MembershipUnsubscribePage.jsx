import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import {
  getStoredMembershipToken,
  setStoredMembershipToken,
} from '../monetization/membershipStorage.js';
import { useMembership } from '../monetization/useMembership.js';
import { getStaticPageMeta } from '../seo/pageMeta.js';

function formatPeriodEnd(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function NotSignedInPanel({ onVerifyToken, verifying, verifyError }) {
  const [tokenDraft, setTokenDraft] = useState(getStoredMembershipToken());

  return (
    <section className="taco-panel membership-unsubscribe-panel">
      <h2 className="taco-title">Restore membership on this device</h2>
      <p className="taco-subtitle">
        To cancel your monthly membership, we need your membership token from this browser or another
        device where you joined. You can also{' '}
        <Link to="/newsletter#membership-section">join or restore membership</Link> first, then return
        here.
      </p>
      <form
        className="taco-claim-form"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = tokenDraft.trim();
          if (!trimmed) return;
          setStoredMembershipToken(trimmed);
          onVerifyToken(trimmed);
        }}
      >
        <label htmlFor="membership-cancel-token">Membership token</label>
        <div className="taco-claim-row">
          <input
            id="membership-cancel-token"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste membership token"
            value={tokenDraft}
            onChange={(event) => setTokenDraft(event.target.value)}
            required
          />
          <button type="submit" className="btn" disabled={verifying}>
            {verifying ? 'Checking…' : 'Continue'}
          </button>
        </div>
      </form>
      {verifyError ? (
        <p className="taco-claim-error" role="alert">
          {verifyError}
        </p>
      ) : null}
    </section>
  );
}

function CancelMembershipPanel({
  email,
  cancelEligibility,
  cancelNotice,
  cancelError,
  cancelling,
  onConfirmCancel,
  refundEligibility,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scheduledEnd = formatPeriodEnd(cancelEligibility?.currentPeriodEnd);
  const stripeMember = Boolean(cancelEligibility?.hasStripeSubscription);

  return (
    <section className="taco-panel membership-unsubscribe-panel">
      <h2 className="taco-title">Cancel membership</h2>
      <p className="taco-subtitle">
        {email ? (
          <>
            Signed in as <strong>{email}</strong>.
          </>
        ) : (
          'Membership found on this device.'
        )}
      </p>

      <ul className="membership-unsubscribe-details">
        <li>
          This cancels your <strong>monthly membership</strong> (Stripe subscription), not just email
          digests.
        </li>
        {stripeMember ? (
          <li>
            Billing stops at the end of your current period. Newsletter access stays unlocked until
            then.
          </li>
        ) : (
          <li>Your membership access and newsletter unlock will end immediately.</li>
        )}
        <li>
          To stop digest emails only, use{' '}
          <Link to="/newsletter">newsletter settings</Link> or the unsubscribe link in any email.
        </li>
        {refundEligibility?.eligible ? (
          <li>
            Paid $4/mo or more? You can{' '}
            <Link to="/newsletter#membership-section">request a full refund</Link> instead of waiting
            for period end.
          </li>
        ) : null}
      </ul>

      {cancelNotice ? <p className="hint membership-unsubscribe-success">{cancelNotice}</p> : null}
      {cancelError ? (
        <p className="taco-claim-error" role="alert">
          {cancelError}
        </p>
      ) : null}

      {!cancelNotice && cancelEligibility?.alreadyScheduled ? (
        <p className="hint">
          Cancellation is already scheduled
          {scheduledEnd ? ` — access until ${scheduledEnd}` : ''}.
        </p>
      ) : null}

      {!cancelNotice && cancelEligibility?.cancellable !== false && !cancelEligibility?.alreadyScheduled ? (
        !confirmOpen ? (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
            Cancel my membership
          </button>
        ) : (
          <div className="taco-refund-confirm" role="group" aria-label="Confirm membership cancellation">
            <p className="hint">
              {stripeMember
                ? 'Your subscription will not renew. You keep access until the current billing period ends.'
                : 'This ends membership access on your account immediately. Continue?'}
            </p>
            <div className="taco-claim-row">
              <button type="button" className="btn btn-danger" disabled={cancelling} onClick={onConfirmCancel}>
                {cancelling ? 'Cancelling…' : 'Yes, cancel membership'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={cancelling}
                onClick={() => setConfirmOpen(false)}
              >
                Keep membership
              </button>
            </div>
          </div>
        )
      ) : null}

      {scheduledEnd && !cancelNotice ? (
        <p className="hint">Current period ends {scheduledEnd}.</p>
      ) : null}
    </section>
  );
}

function InactiveMembershipPanel({ membershipStatus }) {
  return (
    <section className="taco-panel membership-unsubscribe-panel">
      <h2 className="taco-title">No active membership</h2>
      <p className="taco-subtitle">
        {membershipStatus === 'cancelled'
          ? 'This membership is already cancelled.'
          : 'We could not find an active membership on this device.'}
      </p>
      <p className="hint">
        Need to stop emails only? Visit the{' '}
        <Link to="/newsletter">newsletter page</Link> or use the unsubscribe link from a digest email.
      </p>
      <Link to="/newsletter#membership-section" className="btn">
        Membership options
      </Link>
    </section>
  );
}

export function MembershipUnsubscribePage() {
  const pageMeta = getStaticPageMeta('membershipUnsubscribe');
  const membership = useMembership();
  const {
    adFree,
    newsletterUnlocked,
    checking,
    memberEmail,
    membershipStatus,
    cancelEligibility,
    cancelling,
    cancelError,
    cancelNotice,
    refundEligibility,
    cancelActiveMembership,
    refreshStatus,
  } = membership;

  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  async function handleVerifyToken(token) {
    setVerifyError('');
    setVerifying(true);
    try {
      setStoredMembershipToken(token);
      const ok = await refreshStatus();
      if (!ok) {
        setVerifyError('That membership token is invalid or inactive.');
      }
    } finally {
      setVerifying(false);
    }
  }

  const hasEntitlement = adFree || newsletterUnlocked;
  const cancelLoaded = cancelEligibility !== null;
  const canCancel = hasEntitlement && cancelLoaded && cancelEligibility.cancellable;

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main static-page membership-unsubscribe-page">
        <section className="static-page-intro">
          <h1>Cancel membership</h1>
          <p>
            End your monthly Unofficial Cursor News membership. This is separate from unsubscribing
            from email digests — use this page when you want to stop your Stripe subscription.
          </p>
        </section>

        {checking ? <p className="hint">Checking membership status…</p> : null}

        {!checking && !hasEntitlement ? (
          <NotSignedInPanel
            onVerifyToken={handleVerifyToken}
            verifying={verifying}
            verifyError={verifyError}
          />
        ) : null}

        {!checking && hasEntitlement && !cancelLoaded ? (
          <p className="hint">Loading cancellation options…</p>
        ) : null}

        {!checking && hasEntitlement && cancelLoaded && canCancel ? (
          <CancelMembershipPanel
            email={memberEmail}
            cancelEligibility={cancelEligibility}
            cancelNotice={cancelNotice}
            cancelError={cancelError}
            cancelling={cancelling}
            onConfirmCancel={() => cancelActiveMembership()}
            refundEligibility={refundEligibility}
          />
        ) : null}

        {!checking && hasEntitlement && cancelLoaded && !canCancel ? (
          <InactiveMembershipPanel membershipStatus={membershipStatus} />
        ) : null}
      </main>
    </AppShell>
  );
}
