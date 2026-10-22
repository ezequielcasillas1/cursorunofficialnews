import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import {
  getStoredMembershipToken,
  setStoredMembershipToken,
} from '../monetization/membershipStorage.js';
import { useMembership } from '../monetization/useMembership.js';
import { resolveCancelPageView } from '../monetization/resolveCancelPageView.js';
import { canShowResubscribe } from '../monetization/resolveResumeNotice.js';
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

function CancelReceipt({ receipt }) {
  if (!receipt) return null;
  const invoice = receipt.invoice;

  return (
    <div className="membership-cancel-receipt" role="status">
      <p className="membership-cancel-receipt-kicker">Cancellation notice</p>
      <h3 className="membership-cancel-receipt-title">{receipt.headline}</h3>
      <p className="hint membership-unsubscribe-success">{receipt.summary}</p>
      {receipt.emailedTo ? (
        <p className="hint">
          {receipt.emailed
            ? `A confirmation was emailed to ${receipt.emailedTo}.`
            : `Keep this receipt. We could not email ${receipt.emailedTo} right now.`}
        </p>
      ) : null}
      {invoice ? (
        <div className="membership-cancel-invoice">
          <p className="membership-cancel-invoice-label">Last invoice</p>
          <p>
            {[invoice.number, invoice.amountLabel].filter(Boolean).join(' · ') || 'Paid membership invoice'}
          </p>
          <div className="taco-claim-row">
            {invoice.hostedInvoiceUrl ? (
              <a
                className="btn"
                href={invoice.hostedInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View invoice
              </a>
            ) : null}
            {invoice.invoicePdf ? (
              <a
                className="btn btn-ghost"
                href={invoice.invoicePdf}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CancelMembershipPanel({
  email,
  cancelEligibility,
  cancelNotice,
  cancelReceipt,
  cancelError,
  cancelling,
  onConfirmCancel,
  refundEligibility,
  resuming,
  resumeError,
  resumeNotice,
  onResubscribe,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scheduledEnd = formatPeriodEnd(cancelEligibility?.currentPeriodEnd);
  const stripeMember = Boolean(cancelEligibility?.hasStripeSubscription);
  const showResubscribe = canShowResubscribe({ cancelReceipt, cancelEligibility, resumeNotice });

  return (
    <section className="taco-panel membership-unsubscribe-panel">
      <h2 className="taco-title">
        {resumeNotice ? 'Membership resumed' : cancelReceipt ? 'Cancellation notice' : 'Cancel membership'}
      </h2>
      <p className="taco-subtitle">
        {email ? (
          <>
            Signed in as <strong>{email}</strong>.
          </>
        ) : (
          'Membership found on this device.'
        )}
      </p>

      {!cancelReceipt && !resumeNotice ? (
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
      ) : null}

      {resumeNotice ? (
        <div className="membership-cancel-receipt" role="status">
          <p className="membership-cancel-receipt-kicker">Membership</p>
          <h3 className="membership-cancel-receipt-title">{resumeNotice.headline}</h3>
          <p className="hint membership-unsubscribe-success">{resumeNotice.summary}</p>
        </div>
      ) : cancelReceipt ? (
        <CancelReceipt receipt={cancelReceipt} />
      ) : cancelNotice ? (
        <p className="hint membership-unsubscribe-success">{cancelNotice}</p>
      ) : null}
      {cancelError ? (
        <p className="taco-claim-error" role="alert">
          {cancelError}
        </p>
      ) : null}
      {resumeError ? (
        <p className="taco-claim-error" role="alert">
          {resumeError}
        </p>
      ) : null}

      {showResubscribe ? (
        <div className="membership-resume-row">
          <p className="hint">Changed your mind? Resubscribe to keep billing and access going.</p>
          <button
            type="button"
            className="btn"
            disabled={resuming}
            aria-busy={resuming}
            onClick={onResubscribe}
          >
            {resuming ? 'Resubscribing…' : 'Resubscribe'}
          </button>
        </div>
      ) : null}

      {cancelReceipt?.immediate ? (
        <div className="membership-resume-row">
          <p className="hint">This membership has ended. Start a new one to resubscribe.</p>
          <Link to="/newsletter#membership-section" className="btn">
            Join again
          </Link>
        </div>
      ) : null}

      {!cancelNotice && !cancelReceipt && !showResubscribe && cancelEligibility?.alreadyScheduled ? (
        <p className="hint">
          Cancellation is already scheduled
          {scheduledEnd ? ` — access until ${scheduledEnd}` : ''}.
        </p>
      ) : null}

      {!cancelNotice &&
      !resumeNotice &&
      cancelEligibility?.cancellable !== false &&
      !cancelEligibility?.alreadyScheduled ? (
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

      {scheduledEnd && !cancelNotice && !resumeNotice ? (
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
    membershipToken,
    cancelEligibility,
    cancelling,
    cancelError,
    cancelNotice,
    cancelReceipt,
    refundEligibility,
    cancelActiveMembership,
    resuming,
    resumeError,
    resumeNotice,
    resumeScheduledCancellation,
    refreshCancelEligibility,
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
  const view = cancelReceipt || resumeNotice
    ? 'cancel'
    : resolveCancelPageView({
        checking,
        hasEntitlement,
        hasToken: Boolean(membershipToken),
        cancelEligibility,
      });

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

        {view === 'checking' ? <p className="hint">Checking membership status…</p> : null}

        {view === 'restore' ? (
          <NotSignedInPanel
            onVerifyToken={handleVerifyToken}
            verifying={verifying}
            verifyError={verifyError}
          />
        ) : null}

        {view === 'loading' ? <p className="hint">Loading cancellation options…</p> : null}

        {view === 'error' ? (
          <section className="taco-panel membership-unsubscribe-panel">
            <h2 className="taco-title">Could not load cancellation options</h2>
            <p className="taco-claim-error" role="alert">
              {cancelEligibility?.error || 'The membership API did not return cancellation details.'}
            </p>
            <button type="button" className="btn" onClick={() => refreshCancelEligibility()}>
              Try again
            </button>
          </section>
        ) : null}

        {view === 'cancel' ? (
          <CancelMembershipPanel
            email={memberEmail}
            cancelEligibility={cancelEligibility}
            cancelNotice={cancelNotice}
            cancelReceipt={cancelReceipt}
            cancelError={cancelError}
            cancelling={cancelling}
            onConfirmCancel={() => cancelActiveMembership()}
            resuming={resuming}
            resumeError={resumeError}
            resumeNotice={resumeNotice}
            onResubscribe={() => resumeScheduledCancellation()}
            refundEligibility={refundEligibility}
          />
        ) : null}

        {view === 'inactive' ? (
          <InactiveMembershipPanel membershipStatus={membershipStatus} />
        ) : null}
      </main>
    </AppShell>
  );
}
