import { useEffect, useReducer, useRef, useState } from 'react';
import { Board } from '../shared/Board.jsx';
import { BrandPiece } from '../shared/BrandPiece.jsx';
import { GameShell } from '../shared/GameShell.jsx';
import { chooseMove } from './ai.js';
import { COMMANDS, commandToAction } from './commands.js';
import { CommitChessTutorial } from './CommitChessTutorial.jsx';
import {
  OPPONENT,
  SIZE,
  YOU,
  createFreePlayState,
  legalMoves,
  reduce,
} from './engine.js';
import { PUZZLES, createPuzzleState } from './puzzles.js';

const KIND_LABEL = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

const rules = (
  <>
    <p>Chess-shaped board. Pieces wear the site logo. Moves are Git commands.</p>
    <ul>
      <li>Normal turn: select piece → git add (target) → git commit → git push</li>
      <li>Specials: rebase (knight hop), merge (adjacent friendly), cherry-pick, revert</li>
      <li>Scroll to the Command course below for a board diagram per button</li>
    </ul>
  </>
);

function initState() {
  return createFreePlayState();
}

function pipelineStep(state) {
  if (state.winner) return 'done';
  if (state.turn !== YOU) return 'ai';
  if (state.phase === 'staged') {
    return state.commitMessage.trim() ? 'push' : 'commit';
  }
  return 'add';
}

export default function CommitChessGame() {
  const [state, dispatch] = useReducer(reduce, null, initState);
  const [activeCmd, setActiveCmd] = useState('add');
  const [msgDraft, setMsgDraft] = useState('');
  const aiTimer = useRef(null);
  const step = pipelineStep(state);
  const yourTurn = state.turn === YOU && !state.winner;

  useEffect(() => {
    if (state.winner || state.turn !== OPPONENT) return undefined;
    aiTimer.current = window.setTimeout(() => {
      const pick = chooseMove(state.board);
      if (!pick) return;
      dispatch({ type: 'forceMove', from: pick.from, to: pick.to, message: 'ai push' });
    }, 500);
    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [state.turn, state.winner, state.board]);

  const targets = new Set();
  if (state.selected && yourTurn && state.phase === 'play') {
    if (activeCmd === 'rebase') {
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
      const { r, c } = state.selected;
      for (const [dr, dc] of hops) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) continue;
        const t = state.board[tr][tc];
        if (!t || t.side !== YOU) targets.add(`${tr},${tc}`);
      }
    } else if (activeCmd === 'merge') {
      const { r, c } = state.selected;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) continue;
        if (state.board[tr][tc]?.side === YOU) targets.add(`${tr},${tc}`);
      }
    } else {
      for (const m of legalMoves(state.board, state.selected.r, state.selected.c)) {
        targets.add(`${m.r},${m.c}`);
      }
    }
  }

  const cells = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = state.board[r][c];
      const selected = state.selected && state.selected.r === r && state.selected.c === c;
      const stagedHere =
        state.staged &&
        ((state.staged.from.r === r && state.staged.from.c === c) ||
          (state.staged.to.r === r && state.staged.to.c === c));
      const isTarget = targets.has(`${r},${c}`);
      const dark = (r + c) % 2 === 1;
      cells.push({
        key: `${r}-${c}`,
        row: r,
        col: c,
        className: [
          dark ? 'games-cell--dark' : 'games-cell--light',
          selected ? 'games-cell--selected' : '',
          isTarget ? 'games-cell--target' : '',
          stagedHere ? 'games-cell--staged' : '',
        ]
          .filter(Boolean)
          .join(' '),
        disabled: !yourTurn,
        ariaLabel: p
          ? `${p.side === YOU ? 'Your' : 'Enemy'} ${KIND_LABEL[p.kind]} at ${r + 1},${c + 1}`
          : `Empty ${r + 1},${c + 1}`,
        onClick: () => {
          if (!yourTurn) return;
          if (state.phase === 'staged') {
            dispatch({ type: 'clearStage' });
            return;
          }

          if (activeCmd === 'rebase' && state.selected) {
            dispatch({ type: 'rebase', r, c });
            return;
          }
          if (activeCmd === 'merge' && state.selected) {
            dispatch({ type: 'merge', r, c });
            return;
          }

          if (p?.side === YOU) {
            dispatch({ type: 'select', r, c });
            return;
          }
          if (state.selected) {
            dispatch({ type: 'stage', r, c });
            setActiveCmd('add');
          }
        },
        content: p ? (
          <BrandPiece
            side={p.side}
            label={`${p.side === YOU ? 'Your' : 'Other'} ${KIND_LABEL[p.kind]}`}
            size={28}
          />
        ) : isTarget ? (
          <span className="games-target-dot" aria-hidden="true" />
        ) : null,
      });
    }
  }

  const sidebar = (
    <>
      <p className="games-log-title">Commit log</p>
      <ul className="games-log">
        {state.log.length === 0 ? <li>(empty)</li> : null}
        {[...state.log].reverse().map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
      </ul>
    </>
  );

  function isCommandEnabled(id) {
    if (!yourTurn) return false;
    if (id === 'add' || id === 'rebase' || id === 'merge') return state.phase === 'play';
    if (id === 'commit') return state.phase === 'staged';
    if (id === 'push') return state.phase === 'staged';
    if (id === 'reset-soft') return state.phase === 'staged';
    if (id === 'cherry-pick') return state.phase === 'play' && Boolean(state.selected);
    if (id === 'revert') return state.revertAvailable && Boolean(state.revertSnapshot);
    return true;
  }

  function isCommandNext(id) {
    if (step === 'add' && (id === 'add' || id === activeCmd)) return id === activeCmd || id === 'add';
    if (step === 'commit' && id === 'commit') return true;
    if (step === 'push' && id === 'push') return true;
    return false;
  }

  function runCommand(id) {
    if (id === 'add') {
      setActiveCmd('add');
      return;
    }
    if (!isCommandEnabled(id)) return;

    if (id === 'rebase' || id === 'merge') {
      setActiveCmd(id);
      return;
    }
    if (id === 'commit') {
      dispatch({ type: 'commit', message: msgDraft });
      return;
    }
    if (id === 'cherry-pick') {
      setActiveCmd('add');
      dispatch({ type: 'cherryPick' });
      return;
    }
    const action = commandToAction(id, { message: msgDraft });
    if (action) dispatch(action);
    if (id === 'push' || id === 'reset-soft') setActiveCmd('add');
  }

  const statusLine =
    step === 'ai'
      ? 'Other Cursor is pushing…'
      : step === 'commit'
        ? 'Staged — press git commit (message optional), then git push.'
        : step === 'push'
          ? 'Committed — press git push to apply and end your turn.'
          : state.message;

  return (
    <>
      <GameShell
        title="Commit Chess"
        blurb="Stage a move, commit, push — logos as every piece."
        rules={rules}
        status={statusLine}
        onReset={() => {
          if (state.mode === 'puzzle' && state.puzzleId) {
            dispatch({ type: 'loadPuzzle', state: createPuzzleState(state.puzzleId) });
          } else {
            dispatch({ type: 'reset' });
          }
          setActiveCmd('add');
          setMsgDraft('');
        }}
        sidebar={sidebar}
      >
        <div className="games-mode-row">
          <button
            type="button"
            className={`btn btn-ghost${state.mode === 'free' ? ' is-active' : ''}`}
            onClick={() => {
              dispatch({ type: 'reset' });
              setActiveCmd('add');
            }}
          >
            Free play
          </button>
          {PUZZLES.map((pz) => (
            <button
              key={pz.id}
              type="button"
              className={`btn btn-ghost${state.puzzleId === pz.id ? ' is-active' : ''}`}
              onClick={() => {
                dispatch({ type: 'loadPuzzle', state: createPuzzleState(pz.id) });
                setActiveCmd(
                  pz.id === 'rebase-hop' ? 'rebase' : pz.id === 'merge-up' ? 'merge' : 'add',
                );
              }}
            >
              {pz.title}
            </button>
          ))}
        </div>

        <ol className="games-pipeline" aria-label="Turn pipeline">
          <li className={step === 'add' ? 'is-current' : step === 'commit' || step === 'push' || step === 'ai' || step === 'done' ? 'is-done' : ''}>
            1. git add
          </li>
          <li className={step === 'commit' ? 'is-current' : step === 'push' || step === 'ai' || step === 'done' ? 'is-done' : ''}>
            2. git commit
          </li>
          <li className={step === 'push' ? 'is-current' : step === 'ai' || step === 'done' ? 'is-done' : ''}>
            3. git push
          </li>
        </ol>

        <Board size={SIZE} cells={cells} />
        {state.phase === 'staged' ? (
          <p className="games-staged-hint">
            Staged path is blue. Click the board to cancel, or continue with commit → push.
          </p>
        ) : null}

        <div className="games-controls" role="toolbar" aria-label="Git commands">
          {COMMANDS.map((cmd) => {
            const enabled = isCommandEnabled(cmd.id);
            const next = isCommandNext(cmd.id);
            return (
              <button
                key={cmd.id}
                type="button"
                className={`btn btn-ghost${activeCmd === cmd.id ? ' is-active' : ''}${next ? ' is-next' : ''}`}
                title={cmd.hint}
                disabled={!enabled && cmd.id !== 'add'}
                aria-disabled={!enabled}
                onClick={() => runCommand(cmd.id)}
              >
                {cmd.label}
              </button>
            );
          })}
        </div>

        <div className="games-commit-input">
          <input
            type="text"
            value={msgDraft}
            onChange={(e) => {
              setMsgDraft(e.target.value);
              dispatch({ type: 'setCommitMessage', value: e.target.value });
            }}
            placeholder='git commit -m "message"'
            aria-label="Commit message"
            disabled={!yourTurn || state.phase !== 'staged'}
          />
        </div>
      </GameShell>

      <CommitChessTutorial />
    </>
  );
}
