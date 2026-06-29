import { useId, useState } from 'react';

/**
 * Reusable accordion-style panel with accessible expand/collapse controls.
 */
export function CollapsiblePanel({
  id,
  title,
  eyebrow,
  subtitle,
  summary,
  defaultExpanded = false,
  loading = false,
  className = '',
  children,
}) {
  const autoId = useId();
  const panelId = id || `collapsible-${autoId}`;
  const contentId = `${panelId}-content`;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const panelClassName = [
    'collapsible-panel',
    className,
    expanded ? 'collapsible-panel--expanded' : 'collapsible-panel--collapsed',
    loading ? 'collapsible-panel--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={panelClassName} aria-busy={loading || undefined}>
      <div className="collapsible-panel-header">
        <button
          type="button"
          className="collapsible-panel-trigger"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((prev) => !prev)}
          disabled={loading}
        >
          <span className="collapsible-panel-trigger-copy">
            {eyebrow ? <span className="collapsible-panel-eyebrow">{eyebrow}</span> : null}
            <span className="collapsible-panel-title">{title}</span>
            {subtitle && expanded ? (
              <span className="collapsible-panel-subtitle">{subtitle}</span>
            ) : null}
            {!expanded && summary ? (
              <span className="collapsible-panel-summary">{summary}</span>
            ) : null}
          </span>
          <span className="collapsible-panel-chevron" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
        </button>
      </div>

      <div id={contentId} className="collapsible-panel-content" hidden={!expanded}>
        {children}
      </div>
    </section>
  );

}
