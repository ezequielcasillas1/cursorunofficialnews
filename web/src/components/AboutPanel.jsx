import { Link } from 'react-router-dom';
import { ABOUT_CRAWL_BULLETS, ABOUT_CRAWL_INTRO } from '../seo/crawlCopy.js';

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
        {ABOUT_CRAWL_BULLETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        Read how we source, attribute, and write notes in our{' '}
        <Link to="/editorial-policy">editorial policy</Link>.
      </p>
    </section>
  );
}
