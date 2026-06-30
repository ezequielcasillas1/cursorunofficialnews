import { useState } from 'react';
import { sanitizeExternalUrl } from '../../../../mobile/shared/url/safe-external-url.js';
import { resolveArticleMedia } from '../../utils/articleMedia.js';
import { MediaPlaceholder } from './MediaPlaceholder.jsx';

function PlayOverlay({ label = 'Watch video' }) {
  return (
    <div className="media-play-overlay" aria-hidden="true">
      <span className="media-play-badge">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor" />
        </svg>
      </span>
      <span className="media-play-label">{label}</span>
    </div>
  );
}

export function ArticleMedia({ item, featured = false, className = '', hideSources = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const media = resolveArticleMedia(item);
  const safeUrl = sanitizeExternalUrl(item?.canonicalUrl);
  const hasImage = Boolean(media.url) && !imageFailed;
  const aspectClass = featured ? 'media-aspect-hero' : 'media-aspect-card';
  const wrapClass = [
    'article-media',
    aspectClass,
    featured ? 'article-media-featured' : '',
    media.isVideo ? 'article-media-video' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mediaLink = Boolean(safeUrl);

  const inner = hasImage ? (
    <>
      <img
        src={media.url}
        alt=""
        className="article-media-image"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
      />
      {media.isVideo ? <PlayOverlay /> : null}
    </>
  ) : (
    <MediaPlaceholder
      accent={media.accent}
      label={media.label}
      sourceLabel={hideSources ? null : media.sourceLabel}
      isVideo={media.isVideo}
      featured={featured}
      title={featured ? item?.title : undefined}
    />
  );

  if (mediaLink) {
    return (
      <figure className={wrapClass}>
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="article-media-link"
          aria-label={`Open ${item.title}${media.isVideo ? ' video' : ''}`}
        >
          {inner}
        </a>
      </figure>
    );
  }

  return <figure className={wrapClass}>{inner}</figure>;
}
