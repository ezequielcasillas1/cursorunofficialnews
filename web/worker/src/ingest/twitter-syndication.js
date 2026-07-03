const SYNDICATION_TIMEOUT_MS = 20_000;
const MAX_TWEETS_PER_USER = 25;

const SYNDICATION_PARAMS = new URLSearchParams({
  dnt: 'false',
  showHeader: 'false',
  showReplies: 'false',
  showBorder: 'false',
  showFooter: 'false',
});

/**
 * Parse tweets embedded in Twitter's public syndication timeline HTML.
 * Works without API credentials and is reachable from Cloudflare Workers
 * (unlike nitter RSS, which returns empty bodies to worker fetch).
 */
export function parseSyndicationTimelineHtml(html) {
  const match = String(html || '').match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const entries = data?.props?.pageProps?.timeline?.entries || [];
  return entries
    .map((entry) => entry?.content?.tweet)
    .filter((tweet) => tweet && !tweet.in_reply_to_status_id_str)
    .map((tweet) => ({
      id: String(tweet.id_str || tweet.id || ''),
      text: tweet.full_text || tweet.text || '',
      created_at: tweet.created_at || null,
    }))
    .filter((tweet) => tweet.id && tweet.text)
    .slice(0, MAX_TWEETS_PER_USER);
}

export async function fetchTwitterSyndicationTimeline(username) {
  const screenName = String(username || '').trim().replace(/^@/, '');
  if (!screenName) return [];

  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(screenName)}?${SYNDICATION_PARAMS}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; UnofficialCursorNews/1.0; +https://cursorunofficial.news)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(SYNDICATION_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Twitter syndication ${response.status}`);
  }

  const html = await response.text();
  if (!html.trim()) {
    throw new Error('Twitter syndication empty body');
  }

  return parseSyndicationTimelineHtml(html);
}
