import { extractPageLinks } from '../src/ingest/scrape.js';
import { getSourceById } from '../src/sources/registry.js';

const learncursorHtml = `
<a href="/learn/cursor-basics">Cursor Basics: Start Using Cursor</a>
<a href="/guides/cursor-automations">Cursor Automations Guide</a>
<a href="/sign-up">Start free</a>
<a href="/pricing">Team pricing</a>
<a href="https://www.learncursor.dev/learn">Learn hub</a>
`;

const tracksHtml = `
<a href="/tracks/cursor-first-hour">Cursor First Hour</a>
<a href="/tracks/tab-and-inline-editing">Tab and Inline Editing</a>
<a href="/paths/cursor-at-work/tracks">Back to tracks hub</a>
`;

const guidesSource = getSourceById('learncursor-guides-scrape');
const tracksSource = getSourceById('learncursor-tracks-scrape');
const blogSource = getSourceById('cursor-blog-scrape');

const guideLinks = extractPageLinks(learncursorHtml, guidesSource.pageUrl, guidesSource);
const trackLinks = extractPageLinks(tracksHtml, tracksSource.pageUrl, tracksSource);

console.log('learncursor-guides-scrape', guideLinks.length, guideLinks.map((e) => e.link));
console.log('learncursor-tracks-scrape', trackLinks.length, trackLinks.map((e) => e.link));

const blogHtml = `
<a href="/blog/my-post">Jan 1, 2026 · My Post Title</a>
<a href="/blog/topic/ai">Topic</a>
`;
const blogLinks = extractPageLinks(blogHtml, blogSource.pageUrl, blogSource);
console.log('cursor-blog-scrape', blogLinks.length, blogLinks.map((e) => e.title));

if (guideLinks.length < 2 || trackLinks.length < 2 || blogLinks.length < 1) {
  console.error('extractPageLinks regression');
  process.exit(1);
}

console.log('extractPageLinks OK');
