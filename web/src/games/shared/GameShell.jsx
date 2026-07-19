import { Link } from 'react-router-dom';
import { useState } from 'react';

/** Facade chrome shared by every game. */
export function GameShell({ title, blurb, rules, onReset, status, sidebar, children }) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="games-shell">
      <header className="games-shell-header">
        <div className="games-shell-heading">
          <p className="games-shell-back">
            <Link to="/games">← All games</Link>
          </p>
          <h1>{title}</h1>
          {blurb ? <p className="games-shell-blurb">{blurb}</p> : null}
        </div>
        <div className="games-shell-actions">
          {onReset ? (
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              Reset
            </button>
          ) : null}
          {rules ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setRulesOpen((open) => !open)}
              aria-expanded={rulesOpen}
            >
              {rulesOpen ? 'Hide rules' : 'Rules'}
            </button>
          ) : null}
        </div>
      </header>

      {status ? <p className="games-shell-status" aria-live="polite">{status}</p> : null}

      {rulesOpen && rules ? (
        <aside className="games-shell-rules" aria-label="Game rules">
          {rules}
        </aside>
      ) : null}

      <div className={`games-shell-body${sidebar ? ' games-shell-body--split' : ''}`}>
        <div className="games-shell-main">{children}</div>
        {sidebar ? <aside className="games-shell-sidebar">{sidebar}</aside> : null}
      </div>
    </div>
  );
}
