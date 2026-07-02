/** URL pattern → feed category. First match wins (order matters). */
export const URL_CATEGORY_RULES = [
  { pattern: /forum\.cursor\.com/i, category: 'forum' },
  { pattern: /cursor\.com\/changelog/i, category: 'changelog' },
  { pattern: /cursor\.com\/(docs|learn)\//i, category: 'tutorial' },
  { pattern: /cursor\.com\/blog/i, category: 'blog' },
  { pattern: /github\.com\/getcursor\/cursor\/releases/i, category: 'release' },
  { pattern: /releasebot\.io\/updates\/cursor/i, category: 'release' },
  { pattern: /(?:youtube\.com|youtu\.be)/i, category: 'video' },
  { pattern: /reddit\.com/i, category: 'community' },
  { pattern: /(?:nitter\.net|twitter\.com|x\.com)\//i, category: 'social' },
  { pattern: /(?:news\.ycombinator\.com|hnrss\.org)/i, category: 'community' },
  { pattern: /stackoverflow\.com/i, category: 'community' },
  { pattern: /github\.com\/[^/]+\/[^/]+\/discussions/i, category: 'discussion' },
  { pattern: /learncursor\.dev/i, category: 'tutorial' },
  { pattern: /cursor\.directory/i, category: 'tutorial' },
];

export function categoryFromUrl(url) {
  if (!url) return null;
  for (const rule of URL_CATEGORY_RULES) {
    if (rule.pattern.test(url)) return rule.category;
  }
  return null;
}
