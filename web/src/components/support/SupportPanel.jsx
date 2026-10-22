import { AdSenseSlot } from '../ads/AdSenseSlot.jsx';

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/casiezeq';

export function SupportPanel() {
  return (
    <section id="support-section" className="support-section monetization-section" aria-label="Support the project">
      <div className="support-panel taco-panel">
        <p className="monetization-slot-label">Support</p>
        <h2 className="taco-title">Keep Cursor News free</h2>
        <p className="hint">
          This feed stays free for everyone. If it helps you stay on top of Cursor updates, you can
          chip in for hosting and ingest costs — no account required.
        </p>
        <a
          className="btn btn-primary support-coffee-link"
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy me a coffee
        </a>
      </div>
      <AdSenseSlot className="monetization-ad" />
    </section>
  );
}

export { BUY_ME_A_COFFEE_URL };
