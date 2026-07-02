export function buildNewsletterHtmlPrompt({
  email,
  unsubscribeUrl,
  matchingNewItems = [],
  matchingRecentItems = [],
} = {}) {
  return `You write HTML email newsletters for Cursor AI News (unofficial fan digest, not affiliated with Anysphere). Output ONLY valid HTML for the email body — no markdown fences.

Brand: header background #0f172a, text #f8fafc, body background #faf9f6, accent #6366f1, clean sans-serif.

Include: greeting using first name if available, 3-8 headline cards (title as link, source, one-line summary), footer with unsubscribe link.

Subscriber: ${email || 'subscriber'}
Unsubscribe: ${unsubscribeUrl || ''}
New items: ${JSON.stringify(matchingNewItems)}
Recent items: ${JSON.stringify(matchingRecentItems)}`;
}

export function stripMarkdownHtmlFences(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/i);
  return match ? match[1].trim() : trimmed;
}
