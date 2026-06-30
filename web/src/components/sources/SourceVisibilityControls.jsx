import { useEffect, useState } from 'react';
import {
  TACO_SOURCES_UNHIDE_NAV_ACTION,
  TACO_SOURCES_UNHIDE_NAV_HINT,
} from '../../../mobile/shared/taco-unlock/config.js';
import { scrollToSourcesSection } from '../../sources/scrollToSourcesSection.js';
import { TacoUnlockDialog } from './TacoUnlockDialog.jsx';

export function SourceVisibilityControls({
  sourcesHidden,
  onHide,
  onUnlock,
  showUnhideHint = false,
}) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (sourcesHidden) setConfirmOpen(false);
  }, [sourcesHidden]);

  function handleHideConfirm() {
    setConfirmOpen(false);
    onHide?.();
  }

  function handleUnlock() {
    onUnlock?.();
    setUnlockOpen(false);
  }

  if (sourcesHidden) {
    return (
      <>
        <div className="source-visibility-row">
          <button
            type="button"
            className="chip chip-sources-hidden"
            onClick={() => setUnlockOpen(true)}
          >
            Sources hidden 🌮 Tap to unlock
          </button>
        </div>
        <TacoUnlockDialog
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          onUnlock={handleUnlock}
        />
      </>
    );
  }

  return (
    <>
      {showUnhideHint ? (
        <div className="sources-unhide-hint">
          <p className="hint">{TACO_SOURCES_UNHIDE_NAV_HINT}</p>
          <button
            type="button"
            className="btn btn-ghost sources-unhide-link"
            onClick={scrollToSourcesSection}
          >
            {TACO_SOURCES_UNHIDE_NAV_ACTION}
          </button>
        </div>
      ) : null}
      <div className="source-visibility-row">
        <button
          type="button"
          className="chip chip-sources-hide"
          onClick={() => setConfirmOpen(true)}
        >
          Hide sources
        </button>
      </div>
      {confirmOpen ? (
        <dialog open className="taco-unlock-dialog taco-confirm-dialog">
          <div className="taco-unlock-inner">
            <span className="taco-emoji taco-unlock-emoji" aria-hidden="true">
              👀
            </span>
            <h2 className="taco-unlock-title">Hide source names?</h2>
            <p className="taco-unlock-copy">
              Headlines stay — source labels and the sources list disappear. To peek again,
              you&apos;ll need to buy a taco 🌮
            </p>
            <button type="button" className="btn" onClick={handleHideConfirm}>
              Hide sources
            </button>
            <button
              type="button"
              className="taco-claim-toggle taco-unlock-cancel"
              onClick={() => setConfirmOpen(false)}
            >
              Keep showing sources
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
