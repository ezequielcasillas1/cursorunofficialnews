export function StatusBar({ lastIngestAt, sourceCount }) {
  if (!lastIngestAt) return null;
  return (
    <p className="status-bar">
      Last ingest: {new Date(lastIngestAt).toLocaleString()} · {sourceCount} active sources
    </p>
  );
}

export function AboutPanel() {
  return (
    <section className="about-panel">
      <h2>About</h2>
      <ul>
        <li>Free core feed — headlines and excerpts only</li>
        <li>Every item opens the original source in a new tab</li>
        <li>Membership ($1–$5/mo) planned for extra features, not core news</li>
        <li>Push notifications — planned</li>
      </ul>
    </section>
  );
}
