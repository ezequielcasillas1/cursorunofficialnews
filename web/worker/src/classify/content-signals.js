const TUTORIAL_TITLE_RE =
  /^(how to\b|guide[:\s]|tutorial[:\s]|getting started\b|step[- ]by[- ]step\b|walkthrough\b|learn how\b|tips for\b|setup guide\b|deep dive\b|catch\s+.+\bbefore\b|build(?:ing)?\s+a\b|set\s+up\b|configure\s+\w+|wire\s+up\b|automate\b|deploy(?:ing)?\b|monitor(?:ing)?\b|integrat(?:e|ing)\b|implement(?:ing)?\b|connect(?:ing)?\b|migrat(?:e|ing)\b|optimi[sz]e\b|prevent\b|avoid\b)/i;

const TUTORIAL_BODY_RE =
  /\b(step-by-step|walkthrough|getting started|how to set up|how to configure|how to use cursor|here is how to|here'?s how to|the exact point where|the exact way to|wire (?:up\s+)?cross-repo)\b/i;

const QUESTION_TITLE_RE =
  /^(how|why|what|when|where|who|is|are|does|do|can|will|should|could|would|has|have|did)\b/i;

const SUPPORT_OR_RANT_RE =
  /\b(help me\b|please please|forcing me|privacy concern|anyone else|am i doing something wrong)\b/i;

const ISSUE_TITLE_RE =
  /\b(not working|doesn'?t work|won'?t work|broken\b|breaks?\b|bug\b|issue\b|error\b|errors\b|fails?\b|failed\b|failing\b|crash(?:es|ed|ing)?\b|uninstalls?\b|uninstalling\b|missing\b|gone\b|disappeared\b|stopped working\b|won'?t (?:start|launch|open|load|sign)|encountered (?:issues?|problems?|errors?)|cannot (?:open|launch|use|sign in|connect)|can'?t (?:open|launch|use|sign in|connect))\b/i;

const ISSUE_BODY_RE =
  /\b(not working|doesn'?t work|won'?t work|is broken\b|breaks (?:my|the|custom)|crash(?:es|ed|ing)?\b|uninstall(?:s|ing|ed)?\b|stopped working\b|forcing me\b|forces? me into\b|reproduce the bug\b|how to fix this\b|cannot (?:use|open|launch|sign in|connect)|can'?t (?:use|open|launch|sign in|connect)|already raised since\b|waste of time\b|every few days)\b/i;

const DISCUSSION_TITLE_RE =
  /^(why\s+(?:ai|cursor|claude|the|are|is|i|we)\b|are we\b|thoughts on\b|my take on\b|unpopular opinion\b|what if\b|anyone else\b|inside\b|underestimating\b|the rise of\b|state of\b|a timeline\b|the case (?:for|against)\b|should we\b|do we need\b|is it worth\b|the future of\b)|(\broundups?\s+have\b|\bconverging on\b|\bthoughts on\b|\bmy experience\b|\bvs\.?\s|\bversus\b|\bcompared to\b|\bdebate\b|\bperspective on\b|\bchange my mind\b|\bam i the only\b|\bwhat do you think\b|\boverrated\b|\bunderrated\b)/i;

const DISCUSSION_BODY_RE =
  /\b(i went down a rabbit hole|opinion piece\b|the thing that finally crystallized\b|product cycle\b|values doc\b|hot take\b|stop and think\b|rabbit hole this morning|five .+ roundups?|makes me wonder\b|food for thought\b|curious what others think\b|share your thoughts\b|interesting discussion\b)\b/i;

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
  'reddit-cursorrules',
  'reddit-chatgpt-coding',
  'hackernews-cursor',
  'cursor-forum-general',
  'releasebot-cursor',
]);

/** Third-party feeds where source.category is a hint — content decides tutorial vs community. */
export const CONTENT_CLASSIFIED_SOURCE_IDS = new Set([
  'devto-cursor-tutorials',
  'devto-cursor-ai-tutorials',
  'devto-cursor-ide',
  'stackoverflow-cursor-ide',
  'stackoverflow-cursor-ai',
  'github-cursor-discussions',
  'medium-cursor-tutorials',
  'medium-cursor-ide',
  'medium-cursor-ai-editor',
  'forum-cursor-how-to',
  'forum-cursor-tips',
  'forum-cursor-guides',
  'forum-cursor-feature-requests',
  'forum-cursor-bug-report',
  'forum-cursor-showcase',
  'forum-cursor-discussions',
  'forum-cursor-ideas',
  'learncursor-guides-scrape',
  'learncursor-tracks-scrape',
  'cursor-directory-rules-scrape',
  'vscode-blog-rss',
]);

/** Base categories that can be promoted to `issue` when content matches. */
export const ISSUE_PROMOTABLE_BASES = new Set([
  'forum',
  'community',
  'social',
]);

/** Base categories that can be promoted to `discussion` (opinion/analysis). */
export const DISCUSSION_PROMOTABLE_BASES = new Set(['community', 'tutorial', 'forum']);

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

export function issueScore(title, excerpt) {
  const t = String(title || '').trim();
  const body = `${t} ${excerpt || ''}`.trim();
  let score = 0;
  if (ISSUE_TITLE_RE.test(t)) score += 3;
  if (ISSUE_BODY_RE.test(body)) score += 2;
  if (/\bafter (?:the )?update\b/i.test(body)) score += 1;
  if (/\bversion\s+\d+\.\d+/i.test(body)) score += 1;
  return score;
}

export function discussionScore(title, excerpt) {
  const t = String(title || '').trim();
  const body = `${t} ${excerpt || ''}`.trim();
  let score = 0;
  if (DISCUSSION_TITLE_RE.test(t)) score += 3;
  if (DISCUSSION_BODY_RE.test(body)) score += 2;
  if (/\b(unpopular opinion|hot take|thoughts on|my take on|change my mind)\b/i.test(t)) score += 2;
  if (/\b(faster than (?:anyone|expected)|underestimating\b|underrated\b|overrated\b)/i.test(body)) score += 1;
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
