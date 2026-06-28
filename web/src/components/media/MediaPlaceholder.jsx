import { formatCategoryLabel, getSourceInitials } from '../../utils/articleMedia.js';

function PlaceholderIcon({ isVideo }) {
  if (isVideo) {
    return (
      <svg className="media-placeholder-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className="media-placeholder-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="7" r="0.75" fill="currentColor" />
      <circle cx="10.5" cy="7" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function MediaPlaceholder({
  accent = 'warm',
  label,
  sourceLabel,
  isVideo = false,
  featured = false,
  title,
}) {
  const categoryLabel = label || formatCategoryLabel();
  const initials = getSourceInitials(sourceLabel || categoryLabel);

  return (
    <div
      className={`media-placeholder media-accent-${accent}${featured ? ' media-placeholder-featured' : ''}${isVideo ? ' media-placeholder-video' : ''}`}
      role="img"
      aria-label={`${categoryLabel} media placeholder${isVideo ? ' for video' : ''}`}
    >
      <div className="media-placeholder-pattern" aria-hidden="true" />
      <div className="media-placeholder-glow" aria-hidden="true" />
      <div className="media-placeholder-content">
        <span className="media-placeholder-initials" aria-hidden="true">
          {initials}
        </span>
        <PlaceholderIcon isVideo={isVideo} />
        <span className="media-placeholder-label">{categoryLabel}</span>
        {sourceLabel ? <span className="media-placeholder-source">{sourceLabel}</span> : null}
        {featured && title ? (
          <span className="media-placeholder-title">{title}</span>
        ) : null}
      </div>
    </div>
  );
}
