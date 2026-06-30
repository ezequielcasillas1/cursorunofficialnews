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
      <ul>
        <li>Free headlines and excerpts — every item links to the original source</li>
        <li>Aggregated from official changelogs, releases, and community sources</li>
        <li>Unofficial fan project — not affiliated with Anysphere</li>
      </ul>
    </section>
  );
}
