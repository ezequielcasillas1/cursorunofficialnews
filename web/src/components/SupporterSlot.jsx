import { BUY_ME_A_COFFEE_URL } from './support/SupportPanel.jsx';

export function SupporterSlot({ variant = 'block', className = '' }) {
  if (variant === 'inline') {
    return (
      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`hidden md:inline-flex items-center justify-center min-h-11 px-3 rounded-full border border-[var(--color-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-muted)] no-underline transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] ${className}`}
      >
        Coffee
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
