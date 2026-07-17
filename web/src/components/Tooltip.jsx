import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';

const GAP = 8;
/** Fallback when the bubble has not been measured yet. */
const ESTIMATED_HEIGHT = 52;
const VIEWPORT_PAD = 8;

/**
 * Styled tooltip for hover (pointer) and keyboard focus.
 * Renders the bubble in a portal so parent overflow does not clip it.
 * Flips below the anchor when there is not enough space above (e.g. top nav).
 */
export function Tooltip({ text, children }) {
  const id = useId();
  const anchorRef = useRef(null);
  const bubbleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const syncPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const bubble = bubbleRef.current;
    const bubbleHeight = bubble?.offsetHeight ?? ESTIMATED_HEIGHT;
    const bubbleWidth = bubble?.offsetWidth ?? 0;

    const spaceAbove = rect.top - VIEWPORT_PAD;
    const placeBelow = spaceAbove < bubbleHeight + GAP;

    let left = rect.left + rect.width / 2;
    if (bubbleWidth > 0) {
      const half = bubbleWidth / 2;
      left = Math.min(
        Math.max(left, VIEWPORT_PAD + half),
        window.innerWidth - VIEWPORT_PAD - half,
      );
    }

    setCoords({
      top: placeBelow ? rect.bottom + GAP : rect.top - GAP,
      left,
      placement: placeBelow ? 'below' : 'above',
    });
  }, []);

  const show = useCallback(() => {
    syncPosition();
    setOpen(true);
  }, [syncPosition]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    syncPosition();
    return undefined;
  }, [open, syncPosition, text]);

  useEffect(() => {
    if (!open) return undefined;

    const onMove = () => syncPosition();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, syncPosition]);

  if (!text || !isValidElement(children)) return children;

  const placementClass =
    coords?.placement === 'below' ? ' tooltip-bubble--below' : ' tooltip-bubble--above';

  return (
    <>
      <span
        ref={anchorRef}
        className="tooltip-wrap"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            hide();
          }
        }}
      >
        {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      </span>
      {open && coords
        ? createPortal(
            <span
              ref={bubbleRef}
              id={id}
              role="tooltip"
              className={`tooltip-bubble tooltip-bubble--open${placementClass}`}
              style={{
                top: coords.top,
                left: coords.left,
              }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
