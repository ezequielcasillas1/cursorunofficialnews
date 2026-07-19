import { OPPONENT, YOU, SIZE, legalMoves, cloneBoard, findKing } from './engine.js';

/**
 * Strategy: prefer captures (especially king), then checks/near-king, then center.
 */
export function chooseMove(board) {
  let best = null;
  let bestScore = -Infinity;

  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (!p || p.side !== OPPONENT) continue;
      for (const to of legalMoves(board, r, c)) {
        const score = scoreMove(board, { r, c }, to);
        if (score > bestScore) {
          bestScore = score;
          best = { from: { r, c }, to: { r: to.r, c: to.c } };
        }
      }
    }
  }
  return best;
}

function scoreMove(board, from, to) {
  let score = Math.random() * 0.4;
  const target = board[to.r][to.c];
  if (target) {
    const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 1000 };
    score += values[target.kind] || 10;
  }

  const next = cloneBoard(board);
  next[to.r][to.c] = next[from.r][from.c];
  next[from.r][from.c] = null;

  const youKing = findKing(next, YOU);
  if (youKing && isSquareAttacked(next, youKing.r, youKing.c, OPPONENT)) {
    score += 25;
  }

  const center = 3.5;
  score -= (Math.abs(to.r - center) + Math.abs(to.c - center)) * 0.4;
  return score;
}

function isSquareAttacked(board, r, c, bySide) {
  for (let sr = 0; sr < SIZE; sr += 1) {
    for (let sc = 0; sc < SIZE; sc += 1) {
      const p = board[sr][sc];
      if (!p || p.side !== bySide) continue;
      if (legalMoves(board, sr, sc).some((m) => m.r === r && m.c === c)) return true;
    }
  }
  return false;
}
