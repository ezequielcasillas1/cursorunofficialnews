import { ABOUT_CRAWL_INTRO } from '../seo/crawlCopy.js';

export function StatusBar({ lastIngestAt, sourceCount, feedPublishedAfter }) {
  if (!lastIngestAt) return null;
  const cutLabel = feedPublishedAfter
    ? ` · from ${new Date(feedPublishedAfter).getFullYear()} onwards`
    : '';
  return (
    <p className="status-bar">
      Last updated {new Date(lastIngestAt).toLocaleString()} · {sourceCount} sources
      {cutLabel}
    </p>
  );
}

export function AboutPanel() {
  return (
    <section className="about-panel">
      <h2>About this feed</h2>
      {ABOUT_CRAWL_INTRO.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
      <ul>
        <li>Free headlines and excerpts — every item links to the original source</li>
        <li>Category filters: Updates, News, Forum, Issues, Community, Discussion, Social, Videos, Tutorials</li>
        <li>Optional email digest for members — subscribe on the Newsletter page</li>
      </ul>
    </section>
  );
}
