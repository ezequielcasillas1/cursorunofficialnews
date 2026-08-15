function scrollToMembershipSection(event) {
  event.preventDefault();
  document.getElementById('membership-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SupporterSlot({ variant = 'block' }) {
  if (variant === 'inline') {
    return (
      <a
        href="#membership-section"
        onClick={scrollToMembershipSection}
        className="group relative hidden sm:inline-flex items-center h-9 px-5 overflow-hidden rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)]/70 transition-all duration-300 no-underline"
      >
        <span className="absolute inset-0 w-0 bg-[var(--color-gold)] transition-all duration-250 ease-out group-hover:w-full opacity-15" />
        <span className="relative text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-bright)] group-hover:text-[var(--color-gold-bright)]">
          Become a member
        </span>
      </a>
    );
  }

  return (
    <aside className="monetization-slot supporter-slot" aria-label="Support the project">
      <p className="monetization-slot-label">Support</p>
      <p className="supporter-message">
        Enjoying the feed? Become a member to unlock the email newsletter. Ad-free browsing is coming
        soon once AdSense is enabled.
      </p>
      <a href="#membership-section" onClick={scrollToMembershipSection} className="btn-supporter">
        Become a member
      </a>
    </aside>
  );
}
