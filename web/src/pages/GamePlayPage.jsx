import { Suspense, lazy, useEffect, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { getGameById } from '../games/registry.js';
import '../games/shared/games.css';
import { AppShell } from '../layout/AppShell.jsx';
import { getGamePageMeta } from '../seo/pageMeta.js';

const lazyCache = new Map();

function getLazyGame(game) {
  if (!lazyCache.has(game.id)) {
    lazyCache.set(
      game.id,
      lazy(() => game.load().then((mod) => ({ default: mod.default }))),
    );
  }
  return lazyCache.get(game.id);
}

export function GamePlayPage() {
  const { gameId } = useParams();
  const game = getGameById(gameId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [gameId]);

  const GameComponent = useMemo(() => (game ? getLazyGame(game) : null), [game]);

  if (!game || !GameComponent) {
    return <Navigate to="/games" replace />;
  }

  const pageMeta = getGamePageMeta(game);

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main static-page games-page">
        <Suspense fallback={<p className="games-loading">Loading game…</p>}>
          <GameComponent />
        </Suspense>
      </main>
    </AppShell>
  );
}
