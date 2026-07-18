/** Games plugin registry — hub/play import only from here. */

export const COMING_SOON = [
  {
    id: 'diff-wars',
    title: 'Diff Wars',
    blurb: 'Resolve red/green hunks until the board matches main.',
  },
  {
    id: 'branch-race',
    title: 'Branch Race',
    blurb: 'Race commit tokens down feature lanes; merge conflicts send you back.',
  },
  {
    id: 'stash-stack',
    title: 'Stash Stack',
    blurb: 'Pop stashes in the right order — wrong order means conflict.',
  },
];

export const GAMES = [
  {
    id: 'commit-chess',
    title: 'Commit Chess',
    blurb: 'Chess-shaped board, Git verbs as moves. Stage, commit, push — then rebase when you must.',
    path: '/games/commit-chess',
    load: () => import('./commit-chess/CommitChessGame.jsx'),
  },
];

export function getGameById(gameId) {
  if (!gameId) return null;
  return GAMES.find((g) => g.id === gameId) ?? null;
}

export function listPlayableGames() {
  return GAMES.slice();
}
