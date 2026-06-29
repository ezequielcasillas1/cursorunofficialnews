import { listSources } from '../sources/registry.js';
import { normalizeScrapedEntry } from '../normalize/news-item.js';

const TWITTER_TIMEOUT_MS = 20_000;
const MAX_TWEETS_PER_USER = 25;

export function isTwitterApiConfigured() {
  return Boolean(process.env.TWITTER_BEARER_TOKEN?.trim());
}

async function twitterFetch(path) {
  const token = process.env.TWITTER_BEARER_TOKEN.trim();
  const response = await fetch(`https://api.twitter.com/2${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(TWITTER_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Twitter API ${response.status}: ${body.slice(0, 120)}`);
  }

  return response.json();
}

async function resolveUserId(username) {
  const data = await twitterFetch(
    `/users/by/username/${encodeURIComponent(username)}?user.fields=id`,
  );
  return data.data?.id || null;
}

async function fetchUserTweets(userId) {
  const params = new URLSearchParams({
    max_results: String(Math.min(MAX_TWEETS_PER_USER, 100)),
    'tweet.fields': 'created_at,text',
    exclude: 'retweets,replies',
  });
  const data = await twitterFetch(`/users/${userId}/tweets?${params}`);
  return data.data || [];
}

async function fetchTwitterSource(source) {
  const username = source.twitterUsername?.trim();
  if (!username) return [];

  const userId = await resolveUserId(username);
  if (!userId) return [];

  const tweets = await fetchUserTweets(userId);
  return tweets.map((tweet) =>
    normalizeScrapedEntry(source, {
      title: tweet.text?.split('\n')[0]?.slice(0, 200) || 'Post on X',
      link: `https://x.com/${username}/status/${tweet.id}`,
      summary: tweet.text || '',
      pubDate: tweet.created_at,
    }),
  );
}

export async function ingestTwitterApiSources() {
  if (!isTwitterApiConfigured()) return [];

  const sources = listSources().filter((s) => s.ingestMethod === 'twitter-api');
  if (sources.length === 0) return [];

  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchTwitterSource(source);
      } catch (err) {
        console.error('[twitter-api]', source.id, err.message);
        return [];
      }
    }),
  );

  return batches.flat();
}
