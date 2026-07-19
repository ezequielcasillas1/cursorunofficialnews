/** Commit Chess — chess-like pieces with Git-flavored turn structure. */

export const SIZE = 8;
export const YOU = 'you';
export const OPPONENT = 'opponent';

/** Piece kinds: k king, q queen, r rook, b bishop, n knight, p pawn */
export function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function piece(side, kind) {
  return { side, kind };
}

export function createFreePlayState() {
  const board = createEmptyBoard();
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < SIZE; c += 1) {
    board[0][c] = piece(OPPONENT, back[c]);
    board[1][c] = piece(OPPONENT, 'p');
    board[6][c] = piece(YOU, 'p');
    board[7][c] = piece(YOU, back[c]);
  }
  return baseState(board, 'free');
}

function baseState(board, mode, puzzleId = null) {
  return {
    board,
    turn: YOU,
    mode,
    puzzleId,
    selected: null,
    staged: null, // { from, to, capture } waiting for commit
    commitMessage: '',
    log: [],
    lastEnemyMove: null,
    revertAvailable: true,
    winner: null,
    message: 'git add a move — select piece, then target.',
    phase: 'play', // play | staged
  };
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function enemy(side) {
  return side === YOU ? OPPONENT : YOU;
}

/** Simplified chess moves (no castling/en passant/check). */
export function legalMoves(board, fromR, fromC) {
  const p = board[fromR][fromC];
  if (!p) return [];
  const { side, kind } = p;
  const moves = [];

  const pushQuietOrCapture = (r, c) => {
    if (!inBounds(r, c)) return false;
    const t = board[r][c];
    if (!t) {
      moves.push({ r, c, capture: false });
      return true;
    }
    if (t.side !== side) moves.push({ r, c, capture: true });
    return false;
  };

  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let r = fromR + dr;
      let c = fromC + dc;
      while (inBounds(r, c)) {
        const t = board[r][c];
        if (!t) {
          moves.push({ r, c, capture: false });
        } else {
          if (t.side !== side) moves.push({ r, c, capture: true });
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  if (kind === 'p') {
    const dir = side === YOU ? -1 : 1;
    const start = side === YOU ? 6 : 1;
    if (inBounds(fromR + dir, fromC) && !board[fromR + dir][fromC]) {
      moves.push({ r: fromR + dir, c: fromC, capture: false });
      if (fromR === start && !board[fromR + dir * 2][fromC]) {
        moves.push({ r: fromR + dir * 2, c: fromC, capture: false });
      }
    }
    for (const dc of [-1, 1]) {
      const r = fromR + dir;
      const c = fromC + dc;
      if (inBounds(r, c) && board[r][c] && board[r][c].side !== side) {
        moves.push({ r, c, capture: true });
      }
    }
  } else if (kind === 'n') {
    for (const [dr, dc] of [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ]) {
      pushQuietOrCapture(fromR + dr, fromC + dc);
    }
  } else if (kind === 'k') {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr || dc) pushQuietOrCapture(fromR + dr, fromC + dc);
      }
    }
  } else if (kind === 'r') {
    slide([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]);
  } else if (kind === 'b') {
    slide([
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]);
  } else if (kind === 'q') {
    slide([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]);
  }

  return moves;
}

export function findKing(board, side) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (p && p.side === side && p.kind === 'k') return { r, c };
    }
  }
  return null;
}

function applyBoardMove(board, from, to) {
  const next = cloneBoard(board);
  const moving = next[from.r][from.c];
  const captured = next[to.r][to.c];
  next[to.r][to.c] = moving;
  next[from.r][from.c] = null;
  // Pawn promotion
  if (moving.kind === 'p' && (to.r === 0 || to.r === SIZE - 1)) {
    next[to.r][to.c] = piece(moving.side, 'q');
  }
  return { board: next, captured };
}

function winnerAfter(board) {
  if (!findKing(board, YOU)) return OPPONENT;
  if (!findKing(board, OPPONENT)) return YOU;
  return null;
}

function appendLog(state, line) {
  return [...state.log, line].slice(-40);
}

export function reduce(state, action) {
  if (action.type === 'reset') {
    if (state.mode === 'puzzle' && action.puzzleFactory) {
      return action.puzzleFactory();
    }
    return createFreePlayState();
  }

  if (action.type === 'loadPuzzle') {
    return action.state;
  }

  if (state.winner && action.type !== 'reset' && action.type !== 'loadPuzzle') {
    return state;
  }

  if (action.type === 'select') {
    if (state.phase === 'staged') {
      return { ...state, message: 'Staged change waiting — git commit or clear stage.' };
    }
    const { r, c } = action;
    if (!inBounds(r, c)) {
      return { ...state, message: 'Select one of your pieces.' };
    }
    const p = state.board[r][c];
    if (!p || p.side !== state.turn) {
      return { ...state, selected: null, message: 'Select one of your pieces.' };
    }
    return {
      ...state,
      selected: { r, c },
      message: 'Pick a target square to stage (git add).',
    };
  }

  if (action.type === 'stage') {
    if (state.phase === 'staged') return state;
    const { r, c } = action;
    if (!state.selected) return state;
    const from = state.selected;
    const moves = legalMoves(state.board, from.r, from.c);
    const legal = moves.find((m) => m.r === r && m.c === c);
    if (!legal) {
      if (state.board[r][c]?.side === state.turn) {
        return reduce(state, { type: 'select', r, c });
      }
      return { ...state, message: 'Illegal target for git add.' };
    }
    return {
      ...state,
      staged: { from, to: { r, c }, capture: legal.capture },
      selected: null,
      phase: 'staged',
      message: 'Staged. git commit -m "…" then git push.',
    };
  }

  if (action.type === 'clearStage') {
    return {
      ...state,
      staged: null,
      phase: 'play',
      selected: null,
      message: 'Staging cleared.',
    };
  }

  if (action.type === 'setCommitMessage') {
    return { ...state, commitMessage: action.value };
  }

  if (action.type === 'commit') {
    if (state.phase !== 'staged' || !state.staged) {
      return { ...state, message: 'Nothing staged — git add a move first.' };
    }
    const msg = (action.message ?? state.commitMessage).trim() || 'update board';
    return {
      ...state,
      commitMessage: msg,
      message: `Committed "${msg}". git push to end your turn.`,
      log: appendLog(state, `commit -m "${msg}"`),
    };
  }

  if (action.type === 'push') {
    if (state.phase !== 'staged' || !state.staged) {
      return { ...state, message: 'Nothing to push — stage and commit first.' };
    }

    const commitMsg = state.commitMessage.trim() || 'update board';
    let working = state;
    if (!state.commitMessage.trim()) {
      working = {
        ...state,
        commitMessage: commitMsg,
        log: appendLog(state, `commit -m "${commitMsg}"`),
      };
    }

    const { from, to } = working.staged;
    const { board, captured } = applyBoardMove(working.board, from, to);
    const winner = winnerAfter(board);
    const moveRecord = { from, to, side: working.turn, captured };
    const nextTurn = enemy(working.turn);
    const log = appendLog(
      working,
      `push ${from.r},${from.c} → ${to.r},${to.c}${captured ? ' (capture)' : ''}`,
    );

    return {
      ...working,
      board,
      staged: null,
      phase: 'play',
      selected: null,
      commitMessage: '',
      turn: winner ? working.turn : nextTurn,
      winner,
      lastEnemyMove: working.turn === OPPONENT ? moveRecord : working.lastEnemyMove,
      lastMove: moveRecord,
      log,
      message: winner
        ? winner === YOU
          ? 'You win — enemy king removed.'
          : 'Other Cursor wins.'
        : working.turn === YOU
          ? 'Pushed. Other Cursor is thinking…'
          : 'Other Cursor pushed.',
      revertSnapshot:
        captured && working.revertAvailable
          ? { board: cloneBoard(working.board), turn: working.turn }
          : working.revertSnapshot,
    };
  }

  if (action.type === 'forceMove') {
    const { from, to } = action;
    const moves = legalMoves(state.board, from.r, from.c);
    if (!moves.some((m) => m.r === to.r && m.c === to.c)) return state;
    let next = {
      ...state,
      selected: from,
      phase: 'play',
      staged: null,
    };
    next = reduce(next, { type: 'stage', r: to.r, c: to.c });
    next = reduce(next, { type: 'commit', message: action.message || 'ai move' });
    next = reduce(next, { type: 'push' });
    if (state.turn === OPPONENT && next.lastMove) {
      return { ...next, lastEnemyMove: next.lastMove };
    }
    return next;
  }

  if (action.type === 'rebase') {
    // Knight-like hop from selected piece to an empty/capture square in knight shape
    if (state.phase === 'staged') {
      return { ...state, message: 'Finish or clear the staged commit before rebase.' };
    }
    if (!state.selected) {
      return { ...state, message: 'Select a piece, then rebase onto a knight-hop square.' };
    }
    const { r, c } = action;
    const from = state.selected;
    const p = state.board[from.r][from.c];
    if (!p || p.side !== state.turn) return state;
    const hops = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];
    const ok = hops.some(([dr, dc]) => from.r + dr === r && from.c + dc === c);
    if (!ok) return { ...state, message: 'Rebase target must be a knight-hop away.' };
    const t = state.board[r][c];
    if (t && t.side === state.turn) {
      return { ...state, message: 'Cannot rebase onto your own piece.' };
    }
    let next = {
      ...state,
      staged: { from, to: { r, c }, capture: Boolean(t) },
      selected: null,
      phase: 'staged',
      commitMessage: 'rebase',
      log: appendLog(state, 'rebase (knight hop staged)'),
      message: 'Rebase staged. git push to apply.',
    };
    return next;
  }

  if (action.type === 'merge') {
    // Combine two adjacent friendly pieces: remove selected neighbor, promote selected toward queen/rook
    if (state.phase === 'staged') {
      return { ...state, message: 'Clear stage before merge.' };
    }
    if (!state.selected) {
      return { ...state, message: 'Select a piece, then merge an adjacent friendly.' };
    }
    const { r, c } = action;
    const from = state.selected;
    if (Math.abs(from.r - r) + Math.abs(from.c - c) !== 1) {
      return { ...state, message: 'Merge target must be orthogonally adjacent.' };
    }
    const a = state.board[from.r][from.c];
    const b = state.board[r][c];
    if (!a || !b || a.side !== state.turn || b.side !== state.turn) {
      return { ...state, message: 'Merge needs two of your adjacent pieces.' };
    }
    const board = cloneBoard(state.board);
    board[r][c] = null;
    const rank = { p: 1, n: 2, b: 2, r: 3, q: 4, k: 5 };
    const mergedKind = rank[a.kind] >= rank[b.kind] ? a.kind : b.kind;
    const upgrade = mergedKind === 'p' ? 'n' : mergedKind === 'n' || mergedKind === 'b' ? 'r' : mergedKind === 'r' ? 'q' : mergedKind;
    board[from.r][from.c] = piece(state.turn, upgrade === 'k' ? 'k' : upgrade);
    const nextTurn = enemy(state.turn);
    return {
      ...state,
      board,
      selected: null,
      turn: nextTurn,
      log: appendLog(state, `merge → ${upgrade}`),
      message: `Merged into ${upgrade}. Turn passed.`,
    };
  }

  if (action.type === 'cherryPick') {
    if (state.phase === 'staged') {
      return { ...state, message: 'Clear stage before cherry-pick.' };
    }
    const last = state.lastEnemyMove;
    if (!last) return { ...state, message: 'No enemy move to cherry-pick yet.' };
    // Apply the same delta from player's perspective: move a piece from relative mirror if possible,
    // else stage a copy of the last to-square capture pattern using selected piece.
    if (!state.selected) {
      return { ...state, message: 'Select your piece, then cherry-pick (replays last enemy delta).' };
    }
    const from = state.selected;
    const dr = last.to.r - last.from.r;
    const dc = last.to.c - last.from.c;
    const tr = from.r + dr;
    const tc = from.c + dc;
    if (!inBounds(tr, tc)) {
      return { ...state, message: 'Cherry-pick would leave the board.' };
    }
    const moves = legalMoves(state.board, from.r, from.c);
    if (!moves.some((m) => m.r === tr && m.c === tc)) {
      return { ...state, message: 'That cherry-pick is not legal for this piece.' };
    }
    let next = reduce(state, { type: 'stage', r: tr, c: tc });
    next = {
      ...next,
      commitMessage: 'cherry-pick',
      log: appendLog(next, 'cherry-pick'),
      message: 'Cherry-pick staged. git push to apply.',
    };
    return next;
  }

  if (action.type === 'revert') {
    if (!state.revertAvailable || !state.revertSnapshot) {
      return { ...state, message: 'Revert unavailable (once per game after a capture).' };
    }
    const snap = state.revertSnapshot;
    return {
      ...state,
      board: cloneBoard(snap.board),
      turn: YOU,
      staged: null,
      phase: 'play',
      selected: null,
      commitMessage: '',
      winner: null,
      revertAvailable: false,
      revertSnapshot: null,
      log: appendLog(state, 'revert (undo last capture position)'),
      message: 'Reverted. Your turn again — use wisely.',
    };
  }

  return state;
}
