import { Button } from '@/components/ui/button';

function scrollToMembershipSection(event) {
  event.preventDefault();
  document.getElementById('membership-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SupporterSlot({ variant = 'block' }) {
  if (variant === 'inline') {
    return (
      <Button asChild variant="outline" size="sm" className="hidden rounded-full uppercase tracking-widest sm:inline-flex">
        <a href="#membership-section" onClick={scrollToMembershipSection}>
          Become a member
        </a>
      </Button>
    );
  }

  return (
    <aside className="monetization-slot supporter-slot" aria-label="Support the project">
      <p className="monetization-slot-label">Support</p>
      <p className="supporter-message">
        Enjoying the feed? Become a member to unlock the email newsletter. Ad-free browsing is coming
        soon once AdSense is enabled.
      </p>
      <Button asChild size="pill" className="no-underline">
        <a href="#membership-section" onClick={scrollToMembershipSection}>
          Become a member
        </a>
      </Button>
    </aside>
  );
}
