import { BUY_ME_A_COFFEE_URL } from './support/SupportPanel.jsx';

/**
 * @param {{ variant?: 'block' | 'inline' }} [props]
 */
export function SupporterSlot({ variant = 'block' }) {
  if (variant === 'inline') {
    return (
      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="header-support-link"
      >
        Support
      </a>
    );
  }

  return (
    <aside className="monetization-slot supporter-slot" aria-label="Support the project">
      <p className="monetization-slot-label">Support</p>
      <p className="hint">
        Enjoying the feed?{' '}
        <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
          Buy me a coffee
        </a>{' '}
        to help cover hosting.
      </p>
    </aside>
  );
}
