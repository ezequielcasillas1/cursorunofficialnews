import { sanitizeExternalUrl } from '../../../mobile/shared/url/safe-external-url.js';

const CATEGORY_LABELS = {
  changelog: 'Changelog',
  release: 'Release',
  blog: 'Blog',
  forum: 'Forum',
  community: 'Community',
  social: 'Social',
  video: 'Video',
  tutorial: 'Tutorial',
  issue: 'Issue',
  discussion: 'Discussion',
};

const CATEGORY_ACCENTS = {
  changelog: 'navy',
  release: 'gold',
  blog: 'warm',
  forum: 'blue',
  community: 'warm',
  social: 'warm',
  video: 'crimson',
  tutorial: 'green',
  issue: 'crimson',
  discussion: 'navy',
};

export function formatCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || 'News';
}

export function getCategoryAccent(category) {
  return CATEGORY_ACCENTS[category] || 'warm';
}

export function extractYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return videoId;
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

export function getYouTubeThumbnail(url, quality = 'mqdefault') {
  const id = extractYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
}

function pickImageUrl(item) {
  return (
    sanitizeExternalUrl(item?.imageUrl) ||
    sanitizeExternalUrl(item?.thumbnailUrl) ||
    sanitizeExternalUrl(item?.thumbnail) ||
    null
  );
}

export function resolveArticleMedia(item) {
  const category = item?.category || '';
  const accent = getCategoryAccent(category);
  const label = formatCategoryLabel(category);
  const sourceLabel = item?.attributionLabel || item?.sourceName || label;
  const isVideo = category === 'video';

  const explicitImage = pickImageUrl(item);
  if (explicitImage) {
    return {
      kind: isVideo ? 'video' : 'image',
      url: explicitImage,
      accent,
      label,
      sourceLabel,
      isVideo,
    };
  }

  if (isVideo) {
    const youtubeThumb = getYouTubeThumbnail(item?.canonicalUrl);
    if (youtubeThumb) {
      return {
        kind: 'video',
        url: youtubeThumb,
        accent,
        label,
        sourceLabel,
        isVideo: true,
      };
    }
    return {
      kind: 'video-placeholder',
      url: null,
      accent,
      label,
      sourceLabel,
      isVideo: true,
    };
  }

  return {
    kind: 'placeholder',
    url: null,
    accent,
    label,
    sourceLabel,
    isVideo: false,
  };
}

export function getSourceInitials(sourceLabel) {
  if (!sourceLabel) return 'CA';
  const words = String(sourceLabel).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'CA';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
