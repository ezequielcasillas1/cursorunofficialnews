import { useState } from 'react';
import { MiniStaticBoard } from './MiniStaticBoard.jsx';
import { TUTORIAL_LESSONS } from './tutorialLessons.js';

/** Course below the live board — one diagram per button / concept. */
export function CommitChessTutorial() {
  const [activeId, setActiveId] = useState(TUTORIAL_LESSONS[0].id);
  const lesson = TUTORIAL_LESSONS.find((l) => l.id === activeId) || TUTORIAL_LESSONS[0];

  return (
    <section className="games-tutorial" aria-labelledby="games-tutorial-heading">
      <h2 id="games-tutorial-heading">Command course</h2>
      <p className="games-tutorial-lede">
        Walk each button with its own board diagram. Use this while you play on the board above —
        same logos, same Git verbs.
      </p>

      <div className="games-tutorial-tabs" role="tablist" aria-label="Tutorial lessons">
        {TUTORIAL_LESSONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === activeId}
            className={`btn btn-ghost${item.id === activeId ? ' is-active' : ''}`}
            onClick={() => setActiveId(item.id)}
          >
            {item.button}
          </button>
        ))}
      </div>

      <article className="games-tutorial-lesson" role="tabpanel">
        <header className="games-tutorial-lesson-head">
          <h3>{lesson.title}</h3>
          <p>{lesson.summary}</p>
        </header>

        <div className="games-tutorial-lesson-body">
          <MiniStaticBoard size={lesson.size} cells={lesson.cells} label={lesson.title} />
          <div className="games-tutorial-steps">
            <ol>
              {lesson.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="games-tutorial-caption">{lesson.caption}</p>
            <dl className="games-tutorial-legend">
              <div>
                <dt className="games-legend-swatch games-mini-cell--from" />
                <dd>Selected / from</dd>
              </div>
              <div>
                <dt className="games-legend-swatch games-mini-cell--target" />
                <dd>Legal target</dd>
              </div>
              <div>
                <dt className="games-legend-swatch games-mini-cell--staged" />
                <dd>Staged</dd>
              </div>
              <div>
                <dt className="games-legend-swatch games-mini-cell--hop" />
                <dd>Rebase hop</dd>
              </div>
              <div>
                <dt className="games-legend-swatch games-mini-cell--merge" />
                <dd>Merge partner</dd>
              </div>
            </dl>
          </div>
        </div>
      </article>
    </section>
  );
}
