import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';
import { flattenDigestSections } from '../shared/notifications/category-limits.js';
import { CATEGORY_LABELS } from '../shared/notifications/constants.js';
import { sanitizeExternalUrl } from '../shared/url/safe-external-url.js';

/** Editorial tokens — mirrors web/src/theme/tokens.css (dark theme). */
const FONT_DISPLAY = "'Bodoni Moda', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Libre Caslon Text', Georgia, serif";
const FONT_UI = "'Libre Franklin', system-ui, -apple-system, sans-serif";
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;0,6..96,700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Libre+Franklin:wght@400;500;600;700&display=swap';

const COLOR_PAPER = '#0a0a0f';
const COLOR_PAPER_WARM = '#121218';
const COLOR_CARD = '#1a1a22';
const COLOR_INK = '#f0ebe3';
const COLOR_INK_SOFT = '#d8d2c8';
const COLOR_INK_MUTED = '#9a9488';
const COLOR_INK_LIGHT = '#7a7468';
const COLOR_BORDER = '#2e2e3a';
const COLOR_GOLD = '#d4b87a';
const COLOR_GOLD_MUTED = '#b89a5c';
const COLOR_LINK = '#d4b87a';

const MASTHEAD_TAGLINE =
  'Your morning briefing on Cursor — changelog, releases, and community';
const CATEGORY_DIVIDER_PADDING = '20px 0 8px 0';

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

function renderMastheadRulesHtml() {
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 20px;">
          <tr>
            <td style="height:3px;background:${COLOR_INK};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height:1px;background:${COLOR_GOLD};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>`;
}

function renderOfficialOnlyBadgeHtml() {
  return `
        <p style="margin:16px 0 0;">
          <span style="display:inline-block;border:1px solid ${COLOR_GOLD_MUTED};color:${COLOR_GOLD};font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:1.4px;padding:6px 14px;text-transform:uppercase;">Official only</span>
        </p>`;
}

function renderCategoryDividerHtml() {
  return `
    <tr>
      <td style="padding:${CATEGORY_DIVIDER_PADDING};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px;height:1px;background:${COLOR_GOLD};font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:1px;background:${COLOR_BORDER};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderCategoryHeaderHtml(categoryId) {
  const label = escapeHtml(categoryLabel(categoryId));
  return `
    <tr>
      <td style="padding:0 0 12px 0;">
        <span style="display:inline-block;border:1px solid ${COLOR_GOLD_MUTED};color:${COLOR_GOLD};font-family:${FONT_UI};font-size:11px;font-weight:600;letter-spacing:1.4px;padding:6px 12px;text-transform:uppercase;">${label}</span>
      </td>
    </tr>`;
}

function renderItemHtml(item, { isLastInSection = false } = {}) {
  const label = categoryLabel(item.category);
  const title = escapeHtml(item.title);
  const url = sanitizeExternalUrl(item.canonicalUrl);
  const excerpt = escapeHtml(truncate(item.excerpt, 220));
  const source = escapeHtml(item.sourceName || 'Cursor News');
  const date = formatDate(item.publishedAt);
  const safeUrl = escapeHtml(url);
  const titleMarkup = url
    ? `<a href="${safeUrl}" style="color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:22px;font-weight:700;line-height:1.3;text-decoration:none;">${title}</a>`
    : `<span style="color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:22px;font-weight:700;line-height:1.3;">${title}</span>`;
  const bottomPadding = isLastInSection ? '0' : '24px';

  return `
    <tr>
      <td style="padding:0 0 ${bottomPadding} 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display:inline-block;border:1px solid ${COLOR_BORDER};color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:1.2px;padding:3px 8px;text-transform:uppercase;">${escapeHtml(label)}</span>
              ${date ? `<span style="color:${COLOR_INK_LIGHT};font-family:${FONT_UI};font-size:11px;margin-left:8px;">${date}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              ${titleMarkup}
            </td>
          </tr>
          ${excerpt ? `<tr><td style="padding-top:10px;color:${COLOR_INK_SOFT};font-family:${FONT_BODY};font-size:15px;line-height:1.6;">${excerpt}</td></tr>` : ''}
          <tr>
            <td style="padding-top:8px;color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:11px;letter-spacing:0.04em;">${source}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderCategorySectionHtml(section, { isLastSection = false } = {}) {
  const itemRows = section.items
    .map((item, index) =>
      renderItemHtml(item, { isLastInSection: index === section.items.length - 1 }),
    )
    .join('');

  const divider = isLastSection ? '' : renderCategoryDividerHtml();

  return `${renderCategoryHeaderHtml(section.categoryId)}${itemRows}${divider}`;
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

function renderCategorySectionText(section, { isLastSection = false } = {}) {
  const header = `${categoryLabel(section.categoryId).toUpperCase()}\n${'—'.repeat(24)}\n`;
  const items = section.items.map(renderItemText).join('\n');
  const divider = isLastSection ? '' : '\n---\n\n';
  return `${header}${items}${divider}`;
}

function resolveDigestSections(itemsOrSections, { subscriber, sections } = {}) {
  const inlineSections = itemsOrSections?.sections;
  if (Array.isArray(inlineSections) && inlineSections.length) {
    return inlineSections.filter((section) => section?.items?.length);
  }
  if (Array.isArray(sections) && sections.length) {
    return sections.filter((section) => section?.items?.length);
  }
  if (subscriber) {
    const sourceItems = Array.isArray(itemsOrSections) ? itemsOrSections : [];
    return buildSubscriberDigestSections(sourceItems, subscriber);
  }
  const flatItems = Array.isArray(itemsOrSections) ? itemsOrSections : [];
  if (!flatItems.length) return [];
  return [{ categoryId: null, items: sortItems(flatItems) }];
}

function buildIntroCopy(count, officialOnly) {
  const scope = officialOnly ? ' from official sources' : '';
  if (count === 1) {
    return `One new headline${scope} from your selected topics.`;
  }
  return `${count} new headlines${scope} from your selected topics.`;
}

/**
 * Newsletter-grade digest — grouped by subscriber topic order with N-1 dividers.
 * @param {Array|{ sections?: Array }} itemsOrSections
 * @param {{ unsubscribeUrl?: string | null, subscriber?: object, sections?: Array }} [options]
 */
export function assembleEmailDigest(itemsOrSections, { unsubscribeUrl, subscriber, sections } = {}) {
  const digestSections = resolveDigestSections(itemsOrSections, { subscriber, sections });
  const sorted = flattenDigestSections(digestSections);
  const count = sorted.length;
  const subject = assembleEmailSubject(sorted);
  const officialOnly = Boolean(subscriber?.officialOnly);
  const intro = buildIntroCopy(count, officialOnly);

  const htmlSections = digestSections
    .map((section, index) =>
      renderCategorySectionHtml(section, { isLastSection: index === digestSections.length - 1 }),
    )
    .join('');

  const officialBadge = officialOnly ? renderOfficialOnlyBadgeHtml() : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR_PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_PAPER};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLOR_PAPER_WARM};border:1px solid ${COLOR_BORDER};">
          <tr>
            <td style="padding:32px 32px 28px;text-align:center;background:${COLOR_PAPER_WARM};">
              <p style="margin:0 0 10px;color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Unofficial · Independent</p>
              <h1 style="margin:0;color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:32px;font-weight:700;line-height:1.1;letter-spacing:-0.01em;">Unofficial Cursor News</h1>
              ${renderMastheadRulesHtml()}
              <p style="margin:0;color:${COLOR_INK_MUTED};font-family:${FONT_BODY};font-size:16px;font-style:italic;line-height:1.5;">${MASTHEAD_TAGLINE}</p>
              ${officialBadge}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0;color:${COLOR_INK_SOFT};font-family:${FONT_BODY};font-size:15px;line-height:1.55;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${htmlSections}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;border-top:1px solid ${COLOR_BORDER};background:${COLOR_CARD};">
              <p style="margin:0 0 8px;color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:12px;line-height:1.6;">
                Unofficial fan project — not affiliated with Anysphere or Cursor.
                Headlines link to original sources; we never republish full articles.
              </p>
              <p style="margin:0;color:${COLOR_INK_LIGHT};font-family:${FONT_UI};font-size:12px;line-height:1.6;">
                You subscribed to this digest via Unofficial Cursor News.
                ${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLOR_LINK};text-decoration:underline;">Unsubscribe</a> anytime.` : 'Unsubscribe anytime in the app settings.'}
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
    officialOnly ? 'Filter: Official only' : null,
    '',
    intro,
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const textSections = digestSections
    .map((section, index) =>
      renderCategorySectionText(section, { isLastSection: index === digestSections.length - 1 }),
    )
    .join('');

  const textFooter = [
    '',
    '---',
    'You subscribed to this digest via Unofficial Cursor News.',
    unsubscribeUrl
      ? `Unsubscribe: ${unsubscribeUrl}`
      : 'Unsubscribe anytime in the app settings.',
  ].join('\n');

  const text = `${textHeader}${textSections}${textFooter}`;

  return {
    subject,
    html,
    text,
    sections: digestSections,
    itemCount: count,
    dividerCount: Math.max(0, digestSections.length - 1),
  };
}
