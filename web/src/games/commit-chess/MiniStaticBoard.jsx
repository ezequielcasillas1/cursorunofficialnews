import { BrandPiece } from '../shared/BrandPiece.jsx';

/**
 * Non-interactive mini board for the tutorial course.
 * cells: { r, c, side?, kind?, mark? }
 */
export function MiniStaticBoard({ size, cells, label }) {
  const byKey = new Map();
  for (const cell of cells) {
    const key = `${cell.r},${cell.c}`;
    const prev = byKey.get(key) || { r: cell.r, c: cell.c };
    byKey.set(key, { ...prev, ...cell });
  }

  const grid = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = byKey.get(`${r},${c}`) || { r, c };
      const dark = (r + c) % 2 === 1;
      const markClass = cell.mark ? `games-mini-cell--${cell.mark}` : '';
      grid.push(
        <div
          key={`${r}-${c}`}
          className={`games-mini-cell ${dark ? 'games-cell--dark' : 'games-cell--light'} ${markClass}`.trim()}
          aria-hidden="true"
        >
          {cell.side ? <BrandPiece side={cell.side} size={22} /> : null}
          {!cell.side && cell.mark === 'target' ? <span className="games-target-dot" /> : null}
          {!cell.side && cell.mark === 'hop' ? <span className="games-hop-dot" /> : null}
          {!cell.side && cell.mark === 'to' && !cell.side ? <span className="games-to-mark">→</span> : null}
        </div>,
      );
    }
  }

  return (
    <div
      className="games-mini-board"
      style={{ '--games-mini-size': size }}
      role="img"
      aria-label={label || 'Tutorial board diagram'}
    >
      {grid}
    </div>
  );
}
