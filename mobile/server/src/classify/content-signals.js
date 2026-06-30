const TUTORIAL_TITLE_RE =
  /^(how to\b|guide[:\s]|tutorial[:\s]|getting started\b|step[- ]by[- ]step\b|walkthrough\b|learn how\b|tips for\b|setup guide\b|deep dive\b)/i;

const TUTORIAL_BODY_RE =
  /\b(step-by-step|walkthrough|getting started|how to set up|how to configure|how to use cursor)\b/i;

const QUESTION_TITLE_RE =
  /^(how|why|what|when|where|who|is|are|does|do|can|will|should|could|would|has|have|did)\b/i;

const SUPPORT_OR_RANT_RE =
  /\b(not working|doesn't work|won't work|bug\b|broken\b|help me\b|please please|forcing me|privacy concern|anyone else|am i doing something wrong)\b/i;

/** Sources whose registry category should win unless URL rules override. */
export const LOCKED_SOURCE_CATEGORIES = new Set([
  'cursor-changelog-rss',
  'cursor-github-releases',
  'cursor-forum-announcements',
  'cursor-youtube-official',
  'cursor-blog-scrape',
  'cursor-learn-tutorials',
  'cursor-docs-guides',
  'x-cursor-official-rss',
  'x-cursor-official-api',
  'reddit-cursor-ai',
  'reddit-cursor',
  'hackernews-cursor',
  'cursor-forum-general',
  'releasebot-cursor',
]);

/** Third-party feeds where source.category is a hint — content decides tutorial vs community. */
export const CONTENT_CLASSIFIED_SOURCE_IDS = new Set([
  'devto-cursor-tutorials',
  'devto-cursor-ai-tutorials',
  'stackoverflow-cursor-ide',
  'stackoverflow-cursor-ai',
  'github-cursor-discussions',
  'medium-cursor-tutorials',
  'forum-cursor-how-to',
  'forum-cursor-tips',
  'forum-cursor-guides',
  'learncursor-guides-scrape',
  'learncursor-tracks-scrape',
  'cursor-directory-rules-scrape',
]);

export function tutorialScore(title, excerpt) {
  const t = String(title || '').trim();
  const body = `${t} ${excerpt || ''}`.trim();
  let score = 0;
  if (TUTORIAL_TITLE_RE.test(t)) score += 3;
  if (TUTORIAL_BODY_RE.test(body)) score += 2;
  if (/\b(guide|tutorial|tips for|learn how)\b/i.test(body)) score += 1;
  return score;
}

export function questionOrSupportScore(title, excerpt) {
  const t = String(title || '').trim();
  const body = `${t} ${excerpt || ''}`.trim();
  let score = 0;
  if (/\?$/.test(t)) score += 3;
  if (QUESTION_TITLE_RE.test(t)) score += 2;
  if (SUPPORT_OR_RANT_RE.test(body)) score += 2;
  if (/\b(question for cursor|looking for|need help|troubleshoot)\b/i.test(body)) score += 1;
  return score;
}

export function classifyByContent({ title, excerpt, sourceCategory }) {
  const tutorial = tutorialScore(title, excerpt);
  const question = questionOrSupportScore(title, excerpt);

  if (question >= 2 && tutorial < 2) {
    return sourceCategory === 'forum' ? 'forum' : 'community';
  }
  if (tutorial >= 2) return 'tutorial';
  if (question >= 1 && tutorial === 0) {
    return sourceCategory === 'forum' ? 'forum' : 'community';
  }
  return null;
}
