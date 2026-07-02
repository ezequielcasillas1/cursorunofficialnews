export function buildNewsletterHtmlPrompt({
  email,
  unsubscribeUrl,
  matchingNewItems = [],
  matchingRecentItems = [],
  digestSections = [],
} = {}) {
  const sections =
    digestSections.length > 0
      ? digestSections
      : [{ items: [...matchingNewItems, ...matchingRecentItems] }];

  return `You write HTML email newsletters for Cursor AI News (unofficial fan digest, not affiliated with Anysphere). Output ONLY valid HTML for the email body — no markdown fences.

Brand (match cursorunofficial.news dark editorial theme):
- Background #0a0a0f / card #121218, text #f0ebe3, muted #9a9488, gold accent #d4b87a / border #b89a5c
- Fonts: Bodoni Moda (masthead/titles), Libre Caslon Text (body/tagline italic), Libre Franklin (labels, all-caps UI)
- Masthead: "Unofficial · Independent" eyebrow, double rule (thick cream + thin gold), italic tagline "Your morning briefing on Cursor — changelog, releases, and community"
- Category pills: gold-bordered uppercase labels; "Official only" gold-bordered badge when subscriber filters official sources
- Table layout, inline CSS, web-safe font fallbacks

Structure rules:
- Group headlines by topic category in the same order as the subscriber settings (changelog, releases, blog, forum, community, social, videos, tutorials).
- Respect per-category headline counts already applied in digestSections (1–3 items per enabled topic).
- When subscriber.officialOnly is true, only include headlines from verified/primary (official) sources — same as the feed "Official only" filter.
- Insert an editorial divider BETWEEN category groups only. If N categories have content, use exactly N-1 dividers — never after the final category.

Include: greeting, grouped headline cards (title as link, source, one-line summary), footer with unsubscribe link.

Subscriber: ${email || 'subscriber'}
Unsubscribe: ${unsubscribeUrl || ''}
Digest sections: ${JSON.stringify(sections)}`;
}

export function stripMarkdownHtmlFences(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/i);
  return match ? match[1].trim() : trimmed;
}
