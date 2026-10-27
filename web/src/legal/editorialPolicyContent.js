export const EDITORIAL_POLICY = {
  title: 'Editorial Policy',
  lastUpdated: 'July 17, 2026',
  sections: [
    {
      heading: 'What this site is',
      paragraphs: [
        'Unofficial Cursor News is a free fan feed about the Cursor code editor. We aggregate headlines from official and community sources, add short original notes, and send readers to the original publisher for the full story.',
        'We are not affiliated with, endorsed by, or operated by Anysphere. Product names and trademarks belong to their respective owners.',
      ],
    },
    {
      heading: 'What we publish',
      paragraphs: [
        'For each item we may show a title, publication date, category, source attribution, a short teaser excerpt (typically under 300 characters), and original editorial commentary explaining why the item may matter to Cursor users.',
        'We do not republish full article HTML, paywalled content, or long verbatim excerpts. The primary call to action on every item page is to read the original at the source URL.',
      ],
      list: [
        'Titles and metadata from public feeds or publisher pages',
        'Short teaser excerpts for scanning',
        'Original “why it matters” commentary written for this site',
        'Clear attribution and outbound links to the source',
      ],
    },
    {
      heading: 'Sourcing and attribution',
      paragraphs: [
        'Items come from a registry of RSS/Atom feeds, official changelogs and releases, forum announcements, and other public sources listed on our Sources page. Each card and item page shows an attribution label or source name.',
        'Official sources are labeled when the registry marks them as official. Community and third-party sources remain clearly attributed so readers can judge provenance.',
      ],
    },
    {
      heading: 'AI-assisted commentary',
      paragraphs: [
        'Some “why it matters” notes are drafted with assistance from Cloudflare Workers AI, then stored with the item. Prompts instruct the model to write original, factual notes and not to paste source HTML or invent product claims.',
        'If AI is unavailable during ingest, the item page still appears with title, excerpt, attribution, and a link to the original. Commentary may fill in on a later ingest.',
      ],
    },
    {
      heading: 'Independence and advertising',
      paragraphs: [
        'Editorial selection follows our ingest registry and classification rules. Advertising (including Google AdSense when approved) and optional memberships help fund hosting; they do not change which headlines appear in the core feed.',
        'Membership unlocks convenience features such as the email digest; the public feed of headlines remains available without payment.',
      ],
    },
    {
      heading: 'Corrections and takedowns',
      paragraphs: [
        'If a title, attribution, or commentary is wrong, or if you are a rights holder requesting removal of an excerpt or link listing, contact us and we will review promptly.',
        'For privacy-related requests, see our Privacy Policy. For general terms of use, see Terms.',
      ],
      list: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Use' },
        { href: '/sources', label: 'Sources' },
        { href: '/about', label: 'About' },
      ],
    },
  ],
};
