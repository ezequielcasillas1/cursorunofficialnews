import { BMAC_URL } from '../config.js';

export function SupporterSlot({ variant = 'block' }) {
  if (!BMAC_URL) return null;

  if (variant === 'inline') {
    return (
      <a
        href={BMAC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost"
      >
        Buy me a taco 🌮
      </a>
    );
  }

  return (
    <aside className="monetization-slot supporter-slot" aria-label="Support the project">
      <p className="monetization-slot-label">Support</p>
      <p className="supporter-message">
        Enjoying the feed? Help keep this unofficial project running.
      </p>
      <a
        href={BMAC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-supporter"
      >
        Buy me a taco 🌮
      </a>
    </aside>
  );
}
