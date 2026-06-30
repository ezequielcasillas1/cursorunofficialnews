import { useEffect, useRef } from 'react';
import { BMC_USERNAME_DEFAULT, getBmcPageUrl } from '../../../mobile/shared/sources/visibility-config.js';
import {
  TACO_UNLOCK_BODY,
  TACO_UNLOCK_CONFIRM_LABEL,
} from '../../../mobile/shared/taco-unlock/config.js';
import { getBmcPageUrl as getConfiguredBmcPageUrl } from '../../monetization/config.js';

export function TacoUnlockDialog({ open, onClose, onUnlock }) {
  const dialogRef = useRef(null);
  const bmcUrl = getConfiguredBmcPageUrl() || getBmcPageUrl(BMC_USERNAME_DEFAULT);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleUnlock() {
    onUnlock?.();
    onClose?.();
  }

  return (
    <dialog ref={dialogRef} className="taco-unlock-dialog" onClose={() => onClose?.()}>
      <div className="taco-unlock-inner">
        <span className="taco-emoji taco-unlock-emoji" aria-hidden="true">
          🌮
        </span>
        <h2 className="taco-unlock-title">Buy me a taco</h2>
        <p className="taco-unlock-copy">{TACO_UNLOCK_BODY}</p>
        {bmcUrl ? (
          <a
            className="btn taco-unlock-link"
            href={bmcUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Buy Me a Coffee
          </a>
        ) : null}
        <button type="button" className="btn taco-unlock-confirm" onClick={handleUnlock}>
          {TACO_UNLOCK_CONFIRM_LABEL}
        </button>
        <form method="dialog">
          <button type="submit" className="taco-claim-toggle taco-unlock-cancel">
            Maybe later
          </button>
        </form>
      </div>
    </dialog>
  );
}
