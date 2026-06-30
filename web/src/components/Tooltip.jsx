import { cloneElement, useId, isValidElement } from 'react';

/**
 * Styled tooltip for hover (pointer) and keyboard focus.
 * Wraps a single focusable child (e.g. button).
 */
export function Tooltip({ text, children }) {
  const id = useId();

  if (!text || !isValidElement(children)) return children;

  return (
    <span className="tooltip-wrap">
      {cloneElement(children, { 'aria-describedby': id })}
      <span id={id} role="tooltip" className="tooltip-bubble">
        {text}
      </span>
    </span>
  );
}
