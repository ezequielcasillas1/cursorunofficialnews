/** Privacy Policy copy — editable without touching page layout. */

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'July 3, 2026',
  sections: [
    {
      heading: 'Introduction',
      paragraphs: [
        'Unofficial Cursor News ("we," "us," or "our") operates the website at cursorunofficial.news. This Privacy Policy explains how we collect, use, and protect information when you use our site.',
        'We are an unofficial fan project. We are not affiliated with, endorsed by, or sponsored by Anysphere, Inc. "Cursor" is a trademark of its respective owner.',
      ],
    },
    {
      heading: 'Information we collect',
      paragraphs: ['We collect only what is needed to operate the feed, membership, and newsletter:'],
      list: [
        'Newsletter (members only): your email address, category preferences, and secure manage or verification tokens stored in our Cloudflare D1 database.',
        'Membership: your email address and subscription status. Payment card details are collected and processed by Stripe — we do not store full payment information on our servers.',
        'Technical data: standard server and edge logs (such as IP address, user agent, and request metadata) processed through Cloudflare Workers when you use the site or API.',
        'Browser storage: a membership session token may be stored in your browser localStorage so we can verify active membership for newsletter and ad-free features.',
      ],
    },
    {
      heading: 'How we use information',
      paragraphs: [
        'We use collected information to deliver the news feed, send the email newsletter you request, manage paid membership and billing status, prevent abuse, and keep the service running reliably.',
        'We do not sell your personal information.',
      ],
    },
    {
      heading: 'Third-party services',
      paragraphs: ['We rely on trusted processors to run the service. Each has its own privacy policy:'],
      links: [
        { label: 'Stripe', href: 'https://stripe.com/privacy' },
        { label: 'Resend', href: 'https://resend.com/legal/privacy-policy' },
        { label: 'Cloudflare', href: 'https://www.cloudflare.com/privacypolicy/' },
      ],
    },
    {
      heading: 'Data retention',
      paragraphs: [
        'We retain newsletter subscriber and membership records while your account or subscription is active. When you unsubscribe from emails or cancel membership, we disable or remove associated records as soon as practicable, except where limited retention is required for billing, fraud prevention, or legal compliance.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'We do not provide a dedicated privacy email address. You can manage your data directly on the site:',
      ],
      list: [
        { label: 'Newsletter settings', href: '/newsletter' },
        { label: 'Unsubscribe from newsletter emails', href: '/newsletter/unsubscribe' },
        { label: 'Cancel paid membership (Stripe subscription)', href: '/membership/unsubscribe' },
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Unofficial Cursor News is not directed at children under 13. We do not knowingly collect personal information from children under 13.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the site after changes means you accept the updated policy.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'This Privacy Policy is governed by the laws of the State of Texas and the United States, without regard to conflict-of-law principles.',
      ],
    },
  ],
};
