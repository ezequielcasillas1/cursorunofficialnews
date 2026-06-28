import { isMonetizationConfigured } from '../../monetization/config.js';
import { useMembership } from '../../monetization/useMembership.js';
import { AdSenseSlot } from './AdSenseSlot.jsx';
import { BuyMeTacoPanel, SupporterBadge } from './BuyMeTacoPanel.jsx';

export function MonetizationSection() {
  const {
    adFree,
    checking,
    claiming,
    claimError,
    supporterEmail,
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
      <BuyMeTacoPanel
        onClaim={claimAdFree}
        claiming={claiming}
        claimError={claimError}
      />
      <AdSenseSlot className="monetization-ad" />
    </section>
  );
}
