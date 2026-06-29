import {
  CATEGORY_LABELS,
  PUSH_BODY_MAX,
  PUSH_TITLE_MAX,
} from './constants.js';
import { sanitizeExternalUrl } from '../url/safe-external-url.js';

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function truncate(text, max) {
  const value = String(text || '').trim();
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Single-item push — headline in title, excerpt teaser in body.
 */
export function assembleSinglePush(item) {
  const label = categoryLabel(item.category);
  const source = item.sourceName || 'Cursor News';
  const excerpt = truncate(item.excerpt, PUSH_BODY_MAX);
  const safeUrl = sanitizeExternalUrl(item.canonicalUrl) || null;

  return {
    title: truncate(item.title, PUSH_TITLE_MAX),
    body: excerpt || `${label} · ${source}`,
    data: {
      url: safeUrl,
      itemId: item.id,
      category: item.category,
      type: 'single',
    },
  };
}

/**
 * Digest push — one alert per device when multiple new items match prefs.
 */
export function assembleDigestPush(items) {
  const sorted = [...items].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  const top = sorted[0];
  const count = sorted.length;
  const safeUrl = sanitizeExternalUrl(top.canonicalUrl) || null;

  const title =
    count === 1
      ? truncate(top.title, PUSH_TITLE_MAX)
      : `${count} new Cursor headlines`;

  const body =
    count === 1
      ? truncate(top.excerpt || `${categoryLabel(top.category)} · ${top.sourceName || 'Cursor News'}`, PUSH_BODY_MAX)
      : `${truncate(top.title, 72)} · +${count - 1} more`;

  return {
    title,
    body,
    data: {
      type: 'digest',
      count,
      itemIds: sorted.map((item) => item.id),
      url: safeUrl,
      itemId: top.id,
      category: top.category,
    },
  };
}

export function assemblePushForItems(items) {
  if (!items?.length) return null;
  if (items.length === 1) return assembleSinglePush(items[0]);
  return assembleDigestPush(items);
}
