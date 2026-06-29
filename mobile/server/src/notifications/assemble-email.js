import {
  CATEGORY_LABELS,
} from '../../../shared/notifications/constants.js';
import { sanitizeExternalUrl } from '../../../shared/url/safe-external-url.js';

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text, max) {
  const value = String(text || '').trim();
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export function assembleEmailSubject(items) {
  const sorted = sortItems(items);
  const count = sorted.length;
  if (count === 1) {
    return truncate(sorted[0].title, 78);
  }
  return `Unofficial Cursor News · ${count} new headlines`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function renderItemHtml(item) {
  const label = categoryLabel(item.category);
  const title = escapeHtml(item.title);
  const url = sanitizeExternalUrl(item.canonicalUrl);
  const excerpt = escapeHtml(truncate(item.excerpt, 220));
  const source = escapeHtml(item.sourceName || 'Cursor News');
  const date = formatDate(item.publishedAt);
  const safeUrl = escapeHtml(url);
  const titleMarkup = url
    ? `<a href="${safeUrl}" style="color:#0a0a0f;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;line-height:1.35;text-decoration:none;">${title}</a>`
    : `<span style="color:#0a0a0f;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;line-height:1.35;">${title}</span>`;

  return `
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ddd6c8;padding-bottom:24px;">
          <tr>
            <td>
              <span style="display:inline-block;background:#0d1b2a;color:#faf7f2;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.2px;padding:4px 10px;text-transform:uppercase;border-radius:4px;">${label}</span>
              ${date ? `<span style="color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:11px;margin-left:8px;">${date}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              ${titleMarkup}
            </td>
          </tr>
          ${excerpt ? `<tr><td style="padding-top:8px;color:#1c1c24;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;">${excerpt}</td></tr>` : ''}
          <tr>
            <td style="padding-top:8px;color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:11px;">${source}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderItemText(item) {
  const label = categoryLabel(item.category);
  const safeUrl = sanitizeExternalUrl(item.canonicalUrl);
  const lines = [
    `[${label}] ${item.title}`,
    item.excerpt ? truncate(item.excerpt, 300) : null,
    safeUrl || 'Original link unavailable',
    item.sourceName ? `— ${item.sourceName}` : null,
    '',
  ].filter((line) => line !== null);
  return lines.join('\n');
}

/**
 * Newsletter-grade digest — one email per ingest cycle per subscriber.
 * @param {{ unsubscribeUrl?: string | null }} [options]
 */
export function assembleEmailDigest(items, { unsubscribeUrl } = {}) {
  const sorted = sortItems(items);
  const count = sorted.length;
  const subject = assembleEmailSubject(sorted);

  const intro =
    count === 1
      ? 'One new headline from your selected topics.'
      : `${count} new headlines from your selected topics.`;

  const htmlItems = sorted.map(renderItemHtml).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #ddd6c8;border-radius:8px;">
          <tr>
            <td style="background:#0d1b2a;padding:28px 32px 24px;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px;color:#e8dcc0;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Unofficial · Independent</p>
              <h1 style="margin:0;color:#faf7f2;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;">Unofficial Cursor News</h1>
              <div style="margin-top:16px;height:2px;width:48px;background:#c9a962;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0;color:#5c5c6a;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${htmlItems}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;border-top:1px solid #ddd6c8;">
              <p style="margin:0 0 8px;color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;">
                Unofficial fan project — not affiliated with Anysphere or Cursor.
                Headlines link to original sources; we never republish full articles.
              </p>
              <p style="margin:0;color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;">
                You subscribed to this digest via Unofficial Cursor News.
                ${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#5c5c6a;">Unsubscribe</a> anytime.` : 'Unsubscribe anytime in the app settings.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textHeader = [
    'UNOFFICIAL CURSOR NEWS',
    'Unofficial fan project — not affiliated with Anysphere or Cursor.',
    '',
    intro,
    '',
  ].join('\n');

  const textItems = sorted.map(renderItemText).join('\n');

  const textFooter = [
    '',
    '---',
    'You subscribed to this digest via Unofficial Cursor News.',
    unsubscribeUrl
      ? `Unsubscribe: ${unsubscribeUrl}`
      : 'Unsubscribe anytime in the app settings.',
  ].join('\n');

  const text = `${textHeader}${textItems}${textFooter}`;

  return { subject, html, text };
}
