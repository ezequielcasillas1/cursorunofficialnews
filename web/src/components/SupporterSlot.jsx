function scrollToMembershipSection(event) {
  event.preventDefault();
  document.getElementById('membership-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SupporterSlot({ variant = 'block' }) {
  if (variant === 'inline') {
    return (
      <a href="#membership-section" onClick={scrollToMembershipSection} className="btn btn-ghost">
        Become a member 💛
      </a>
    );
  }

  return (
    <aside className="monetization-slot supporter-slot" aria-label="Support the project">
      <p className="monetization-slot-label">Support</p>
      <p className="supporter-message">
        Enjoying the feed? Become a member to unlock ad-free browsing and the email newsletter.
      </p>
      <a href="#membership-section" onClick={scrollToMembershipSection} className="btn-supporter">
        Become a member 💛
      </a>
    </aside>
  );
}
