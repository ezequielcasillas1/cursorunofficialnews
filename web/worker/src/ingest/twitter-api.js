import { listSources } from '../sources/registry.js';
import { normalizeScrapedEntry } from '../normalize/news-item.js';

const TWITTER_TIMEOUT_MS = 20_000;
const MAX_TWEETS_PER_USER = 25;

export function isTwitterApiConfigured(env) {
  return Boolean(env?.TWITTER_BEARER_TOKEN?.trim());
}

async function twitterFetch(path, env) {
  const token = env.TWITTER_BEARER_TOKEN.trim();
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

async function resolveUserId(username, env) {
  const data = await twitterFetch(
    `/users/by/username/${encodeURIComponent(username)}?user.fields=id`,
    env,
  );
  return data.data?.id || null;
}

async function fetchUserTweets(userId, env) {
  const params = new URLSearchParams({
    max_results: String(Math.min(MAX_TWEETS_PER_USER, 100)),
    'tweet.fields': 'created_at,text',
    exclude: 'retweets,replies',
  });
  const data = await twitterFetch(`/users/${userId}/tweets?${params}`, env);
  return data.data || [];
}

async function fetchTwitterSource(source, env) {
  const username = source.twitterUsername?.trim();
  if (!username) return [];

  const userId = await resolveUserId(username, env);
  if (!userId) return [];

  const tweets = await fetchUserTweets(userId, env);
  return tweets.map((tweet) =>
    normalizeScrapedEntry(source, {
      title: tweet.text?.split('\n')[0]?.slice(0, 200) || 'Post on X',
      link: `https://x.com/${username}/status/${tweet.id}`,
      summary: tweet.text || '',
      pubDate: tweet.created_at,
    }),
  );
}

export async function ingestTwitterApiSources(env) {
  if (!isTwitterApiConfigured(env)) return [];

  const sources = listSources().filter((s) => s.ingestMethod === 'twitter-api');
  if (sources.length === 0) return [];

  const batches = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchTwitterSource(source, env);
      } catch (err) {
        console.error('[twitter-api]', source.id, err.message);
        return [];
      }
    }),
  );

  return batches.flat();
}
