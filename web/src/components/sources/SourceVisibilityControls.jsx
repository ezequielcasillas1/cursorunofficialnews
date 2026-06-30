import { useState } from 'react';
import { TacoUnlockDialog } from './TacoUnlockDialog.jsx';

export function SourceVisibilityControls({ sourcesHidden, onHide, onUnlock }) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleHideConfirm() {
    setConfirmOpen(false);
    onHide?.();
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
          onUnlock={onUnlock}
        />
      </>
    );
  }

  return (
    <>
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
