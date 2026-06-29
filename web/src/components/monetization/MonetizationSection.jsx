import { isMonetizationConfigured, getBmcMembershipUrl, getBmcPageUrl } from '../../monetization/config.js';
import { useMembership } from '../../monetization/useMembership.js';
import { AdSenseSlot } from './AdSenseSlot.jsx';
import { BuyMeTacoPanel, SupporterBadge } from './BuyMeTacoPanel.jsx';

function PausedMembershipNotice({ email }) {
  const manageUrl = getBmcMembershipUrl() || getBmcPageUrl() || 'https://www.buymeacoffee.com';

  return (
    <section className="taco-panel taco-panel--muted">
      <p className="taco-supporter-msg">
        <span aria-hidden="true">⏸️</span> Membership paused
        {email ? ` for ${email}` : ''}. Ads are shown until you resume on Buy Me a Coffee.
      </p>
      <a className="taco-claim-toggle" href={manageUrl} target="_blank" rel="noopener noreferrer">
        Manage membership
      </a>
    </section>
  );
}

export function MonetizationSection() {
  const {
    adFree,
    checking,
    claiming,
    claimError,
    supporterEmail,
    membershipStatus,
    claimAdFree,
    clearAdFree,
  } = useMembership();

  if (!isMonetizationConfigured()) return null;

  if (checking) {
    return (
      <section className="monetization-section" aria-busy="true">
        <p className="hint">Checking supporter status…</p>
      </section>
    );
  }

  if (adFree) {
    return (
      <section className="monetization-section">
        <SupporterBadge email={supporterEmail} onClear={clearAdFree} />
      </section>
    );
  }

  return (
    <section className="monetization-section">
      {membershipStatus === 'paused' ? (
        <PausedMembershipNotice email={supporterEmail} />
      ) : null}
      <BuyMeTacoPanel
        onClaim={claimAdFree}
        claiming={claiming}
        claimError={claimError}
      />
      <AdSenseSlot className="monetization-ad" />
    </section>
  );
}
