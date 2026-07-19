import { YOU, OPPONENT, piece, createEmptyBoard } from './engine.js';

export { YOU, OPPONENT, piece, createEmptyBoard };

function wrap(board, puzzleId, message) {
  return {
    board,
    turn: YOU,
    mode: 'puzzle',
    puzzleId,
    selected: null,
    staged: null,
    commitMessage: '',
    log: [],
    lastEnemyMove: null,
    revertAvailable: true,
    winner: null,
    message,
    phase: 'play',
  };
}

/** Puzzle 1: capture the enemy king in one push (queen takes). */
function puzzleMateInOne() {
  const board = createEmptyBoard();
  board[7][3] = piece(YOU, 'q');
  board[7][4] = piece(YOU, 'k');
  board[0][3] = piece(OPPONENT, 'k');
  board[1][1] = piece(OPPONENT, 'p');
  return wrap(board, 'mate-one', 'Puzzle: stage a capture on the Other Cursor king, commit, push.');
}

/** Puzzle 2: rebase (knight hop) over a blocker to capture. */
function puzzleRebaseHop() {
  const board = createEmptyBoard();
  board[7][1] = piece(YOU, 'n');
  board[7][4] = piece(YOU, 'k');
  board[5][2] = piece(OPPONENT, 'p');
  board[0][4] = piece(OPPONENT, 'k');
  return wrap(
    board,
    'rebase-hop',
    'Puzzle: select your knight, git rebase onto the pawn (knight hop), then push.',
  );
}

/** Puzzle 3: merge two pawns into a stronger piece, then continue. */
function puzzleMerge() {
  const board = createEmptyBoard();
  board[6][3] = piece(YOU, 'p');
  board[6][4] = piece(YOU, 'p');
  board[7][4] = piece(YOU, 'k');
  board[0][4] = piece(OPPONENT, 'k');
  board[1][3] = piece(OPPONENT, 'r');
  return wrap(
    board,
    'merge-up',
    'Puzzle: select a pawn, git merge the adjacent pawn, then hunt the king in free play.',
  );
}

export const PUZZLES = [
  { id: 'mate-one', title: 'Commit the capture', create: puzzleMateInOne },
  { id: 'rebase-hop', title: 'Rebase hop', create: puzzleRebaseHop },
  { id: 'merge-up', title: 'Merge up', create: puzzleMerge },
];

export function createPuzzleState(puzzleId) {
  const found = PUZZLES.find((p) => p.id === puzzleId) || PUZZLES[0];
  return found.create();
}
