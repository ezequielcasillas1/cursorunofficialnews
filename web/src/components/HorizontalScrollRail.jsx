/**
 * Horizontally scrollable row for touch-friendly “catalog” navigation.
 * Uses scroll-snap on narrow viewports; wrapping is restored at `md` and up.
 */
export function HorizontalScrollRail({
  children,
  className = '',
  ariaLabel,
  innerClassName = '',
}) {
  return (
    <div
      className={`horizontal-scroll-rail ${className}`.trim()}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
    >
      <div className={`horizontal-scroll-rail__track ${innerClassName}`.trim()}>{children}</div>
    </div>
  );
}
