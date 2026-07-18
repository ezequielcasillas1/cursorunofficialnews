import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { COMING_SOON, listPlayableGames } from '../games/registry.js';
import '../games/shared/games.css';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';

export function GamesHubPage() {
  const pageMeta = getStaticPageMeta('games');
  const games = listPlayableGames();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main static-page games-page">
        <div className="games-page-intro">
          <h1>Games</h1>
          <p>
            Play with the Cursor — brand logos as pieces, Git puns as moves, and the occasional merge
            conflict. Unofficial, in-browser, no account required.
          </p>
        </div>

        <ul className="games-hub-grid">
          {games.map((game) => (
            <li key={game.id}>
              <Link className="games-hub-card" to={game.path}>
                <div className="games-hub-card-thumb" aria-hidden="true">
                  <img src="/brand/logo-icon.svg" alt="" width={40} height={40} />
                  <img src="/brand/logo-icon-light.svg" alt="" width={40} height={40} />
                </div>
                <h2>{game.title}</h2>
                <p>{game.blurb}</p>
                <span className="btn btn-primary">Play</span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="games-hub-soon" aria-label="Coming soon">
          <h2>Coming soon</h2>
          <ul className="games-hub-soon-list">
            {COMING_SOON.map((item) => (
              <li key={item.id} className="games-hub-soon-item">
                <strong>{item.title}</strong>
                <span>{item.blurb}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
