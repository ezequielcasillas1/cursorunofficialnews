export function buildNewsletterHtmlPrompt({
  email,
  unsubscribeUrl,
  matchingNewItems = [],
  matchingRecentItems = [],
  digestSections = [],
  officialOnly,
  subscriber,
  logoUrl = 'https://cursorunofficial.news/brand/logo-icon.png',
} = {}) {
  const sections =
    digestSections.length > 0
      ? digestSections
      : [{ items: [...matchingNewItems, ...matchingRecentItems] }];

  const subscriberMeta = {
    email: email || subscriber?.email || 'subscriber',
    officialOnly: officialOnly ?? subscriber?.officialOnly ?? false,
    categories: subscriber?.categories || [],
    categoryLimits: subscriber?.categoryLimits || {},
  };

  return `You write HTML email newsletters for Unofficial Cursor News (unofficial fan digest, not affiliated with Anysphere). Output ONLY valid HTML for the email body — no markdown fences.

Brand (match cursorunofficial.news — navy hero + cream/gold editorial):
- Background #070a0f / shell #0a0e14, cards #141b26, elevated #1a2330, text #f2f2eb, muted #9a9488, gold #c5a977 / #b8965e, navy #0f172a
- Fonts: Fraunces (masthead/titles), Source Serif 4 (body/tagline italic), Outfit (labels, all-caps UI)
- Masthead: centered logo img (${logoUrl}, 56×56), "Unofficial · Independent" eyebrow, title "Unofficial Cursor News", double rule (cream + gold), italic tagline "Your morning briefing on Cursor — changelog, releases, and community"
- Category pills: gold-bordered uppercase rounded labels; "Official only" badge when subscriber filters official sources
- Story cards: rounded #141b26 panels with title link, source, one-line summary, gold "Read source →" button
- Footer: small logo + brand name, disclaimer, unsubscribe
- Table layout, inline CSS, web-safe font fallbacks; absolute image URLs only

Structure rules:
- Group headlines by topic category in the same order as the subscriber settings (changelog, releases, blog, forum, community, social, videos, tutorials).
- Respect per-category headline counts already applied in digestSections (1–3 items per enabled topic).
- When subscriber.officialOnly is true, only include headlines from verified/primary (official) sources — same as the feed "Official only" filter.
- Insert an editorial divider BETWEEN category groups only. If N categories have content, use exactly N-1 dividers — never after the final category.

Include: greeting, grouped headline cards (title as link, source, one-line summary), CTA to open the feed, footer with unsubscribe link.

Subscriber: ${JSON.stringify(subscriberMeta)}
Unsubscribe: ${unsubscribeUrl || ''}
Logo: ${logoUrl}
Digest sections: ${JSON.stringify(sections)}`;
}

export function stripMarkdownHtmlFences(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/i);
  return match ? match[1].trim() : trimmed;
}
