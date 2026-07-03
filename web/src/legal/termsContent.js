import { DISCLAIMER } from '../config.js';

/** Terms of Use copy — editable without touching page layout. */

export const TERMS_OF_USE = {
  title: 'Terms of Use',
  lastUpdated: 'July 3, 2026',
  sections: [
    {
      heading: 'Agreement',
      paragraphs: [
        'By accessing or using Unofficial Cursor News at cursorunofficial.news ("the Site"), you agree to these Terms of Use. If you do not agree, do not use the Site.',
      ],
    },
    {
      heading: 'Service description',
      paragraphs: [
        'Unofficial Cursor News is a free, unofficial fan feed of Cursor-related news, changelogs, releases, and community sources. Optional paid membership ($1–$5 per month via Stripe) unlocks benefits such as the email newsletter and an ad-free experience.',
        'We may change, suspend, or discontinue any part of the Site at any time without notice.',
      ],
    },
    {
      heading: 'Unofficial status and trademarks',
      paragraphs: [DISCLAIMER],
    },
    {
      heading: 'Membership and billing',
      paragraphs: [
        'Paid membership is billed monthly through Stripe Checkout. You may cancel your subscription at any time from the cancel membership page; cancellation stops future billing while access typically continues through the end of the current billing period.',
        'Members paying $4 or more per month may request a full refund through our membership refund process, subject to eligibility rules described at checkout and in membership communications.',
      ],
      list: [{ label: 'Cancel membership', href: '/membership/unsubscribe' }],
    },
    {
      heading: 'Acceptable use',
      paragraphs: ['You agree not to:'],
      list: [
        'Use the Site in any unlawful manner or for any unlawful purpose.',
        'Attempt to gain unauthorized access to our systems, APIs, or user data.',
        'Scrape, overload, or disrupt the Site or its infrastructure beyond normal browsing.',
        'Impersonate Unofficial Cursor News, Anysphere, Inc., or any other person or entity.',
      ],
    },
    {
      heading: 'Third-party content',
      paragraphs: [
        'Feed items link to third-party sources such as official blogs, forums, and community sites. We do not claim ownership of that content. See our sources page for the feeds we ingest.',
      ],
      list: [{ label: 'Sources', href: '/sources' }],
    },
    {
      heading: 'Disclaimer of warranties',
      paragraphs: [
        'The Site is provided "as is" and "as available" without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the feed is complete, accurate, or always available.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'To the fullest extent permitted by law, Unofficial Cursor News and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of the Site. Our total liability for any claim related to the Site will not exceed the amount you paid us in the twelve months before the claim, or $50 if you have not paid anything.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'We may revise these Terms of Use at any time. The "Last updated" date at the top reflects the latest version. Your continued use of the Site after changes constitutes acceptance of the revised terms.',
      ],
    },
    {
      heading: 'Governing law and venue',
      paragraphs: [
        'These Terms are governed by the laws of the State of Texas and the United States, without regard to conflict-of-law principles. You agree that disputes arising from these Terms or the Site will be resolved in courts located in Texas, unless applicable law requires otherwise.',
      ],
    },
    {
      heading: 'Account management and contact',
      paragraphs: [
        'For account, billing, membership, or privacy questions, email customerservice@cursorunofficial.news. You can also manage newsletter and membership settings on the Site:',
      ],
      list: [
        { label: 'customerservice@cursorunofficial.news', href: 'mailto:customerservice@cursorunofficial.news' },
        { label: 'Newsletter', href: '/newsletter' },
        { label: 'Unsubscribe from emails', href: '/newsletter/unsubscribe' },
        { label: 'Cancel membership', href: '/membership/unsubscribe' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
  ],
};
