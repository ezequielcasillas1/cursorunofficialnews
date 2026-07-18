import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OPPONENT,
  YOU,
  createFreePlayState,
  legalMoves,
  reduce,
} from './engine.js';
import { createPuzzleState } from './puzzles.js';

describe('commit-chess engine', () => {
  it('starts free play with kings', () => {
    const state = createFreePlayState();
    assert.equal(state.board[7][4].kind, 'k');
    assert.equal(state.board[0][4].side, OPPONENT);
  });

  it('stages commit and push a pawn move', () => {
    let state = createFreePlayState();
    state = reduce(state, { type: 'select', r: 6, c: 0 });
    state = reduce(state, { type: 'stage', r: 5, c: 0 });
    assert.equal(state.phase, 'staged');
    state = reduce(state, { type: 'commit', message: 'advance' });
    state = reduce(state, { type: 'push' });
    assert.equal(state.board[5][0]?.side, YOU);
    assert.equal(state.turn, OPPONENT);
    assert.ok(state.log.some((l) => l.includes('push')));
  });

  it('loads mate puzzle with a legal queen capture on the king', () => {
    const state = createPuzzleState('mate-one');
    const moves = legalMoves(state.board, 7, 3);
    assert.ok(moves.some((m) => m.r === 0 && m.c === 3 && m.capture));
  });
});
