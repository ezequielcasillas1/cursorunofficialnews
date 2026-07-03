import { AdSenseSlot } from './AdSenseSlot.jsx';
import { MembershipPanel, SupporterBadge } from './MembershipPanel.jsx';

function PausedMembershipNotice({ email }) {
  return (
    <section className="taco-panel taco-panel--muted">
      <p className="taco-supporter-msg">
        <span aria-hidden="true">⏸️</span> Membership paused
        {email ? ` for ${email}` : ''}. Newsletter access is locked until billing resumes.
      </p>
    </section>
  );
}

export function MonetizationSection({ membership }) {
  const {
    adFree,
    checking,
    checkingOut,
    claiming,
    claimError,
    claimNotice,
    memberEmail,
    membershipStatus,
    startCheckout,
    claimAdFree,
    clearMembership,
  } = membership;

  if (checking) {
    return (
      <section id="membership-section" className="monetization-section" aria-busy="true">
        <p className="hint">Checking membership status…</p>
      </section>
    );
  }

  if (adFree) {
    return (
      <section id="membership-section" className="monetization-section">
        <SupporterBadge
          email={memberEmail}
          onClear={clearMembership}
          refundEligibility={membership.refundEligibility}
          refunding={membership.refunding}
          refundError={membership.refundError}
          refundNotice={membership.refundNotice}
          onRequestRefund={membership.requestRefund}
        />
      </section>
    );
  }

  return (
    <section id="membership-section" className="monetization-section">
      {membershipStatus === 'paused' ? <PausedMembershipNotice email={memberEmail} /> : null}
      <MembershipPanel
        onCheckout={startCheckout}
        checkingOut={checkingOut}
        onClaim={claimAdFree}
        claiming={claiming}
        claimError={claimError}
        claimNotice={claimNotice}
      />
      <AdSenseSlot className="monetization-ad" />
    </section>
  );
}
