import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Styled tooltip for hover (pointer) and keyboard focus.
 * Renders the bubble in a portal so parent overflow does not clip it.
 */
export function Tooltip({ text, children }) {
  const id = useId();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const syncPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const show = useCallback(() => {
    syncPosition();
    setOpen(true);
  }, [syncPosition]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

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
              id={id}
              role="tooltip"
              className="tooltip-bubble tooltip-bubble--open"
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
