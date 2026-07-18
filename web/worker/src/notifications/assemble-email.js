import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';
import { flattenDigestSections } from '../shared/notifications/category-limits.js';
import { CATEGORY_LABELS } from '../shared/notifications/constants.js';
import { sanitizeExternalUrl } from '../shared/url/safe-external-url.js';

/**
 * Editorial tokens — mirrors web/src/theme/tokens.css (dark / hero palette).
 * Email clients need hex + web-safe fallbacks; Google Fonts load when allowed.
 */
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Source Serif 4', Georgia, serif";
const FONT_UI = "'Outfit', Arial, Helvetica, sans-serif";
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=Outfit:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap';

const COLOR_PAPER = '#070a0f';
const COLOR_PAPER_WARM = '#0a0e14';
const COLOR_CARD = '#141b26';
const COLOR_CARD_ELEVATED = '#1a2330';
const COLOR_INK = '#f2f2eb';
const COLOR_INK_SOFT = '#d8d4c8';
const COLOR_INK_MUTED = '#9a9488';
const COLOR_INK_LIGHT = '#7a7468';
const COLOR_BORDER = '#2a3344';
const COLOR_GOLD = '#c5a977';
const COLOR_GOLD_MUTED = '#b8965e';
const COLOR_LINK = '#d4b87a';
const COLOR_NAVY = '#0f172a';

const DEFAULT_PUBLIC_WEB_BASE = 'https://cursorunofficial.news';
const LOGO_PATH = '/brand/logo-icon.png';
const SITE_NAME = 'Unofficial Cursor News';

const MASTHEAD_TAGLINE =
  'Your morning briefing on Cursor — changelog, releases, and community';
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

function resolvePublicWebBase(publicWebBase) {
  const base = String(publicWebBase || DEFAULT_PUBLIC_WEB_BASE).trim().replace(/\/$/, '');
  return base || DEFAULT_PUBLIC_WEB_BASE;
}

export function resolveBrandLogoUrl(publicWebBase) {
  return `${resolvePublicWebBase(publicWebBase)}${LOGO_PATH}`;
}

export function assembleEmailSubject(items) {
  const sorted = sortItems(items);
  const count = sorted.length;
  if (count === 1) {
    return truncate(sorted[0].title, 78);
  }
  return `${SITE_NAME} · ${count} new headlines`;
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

function formatEditionDate(iso = new Date().toISOString()) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function renderMastheadRulesHtml() {
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;margin-bottom:18px;">
          <tr>
            <td style="height:2px;background-color:${COLOR_INK};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height:1px;background-color:${COLOR_GOLD};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>`;
}

function renderOfficialOnlyBadgeHtml() {
  return `
        <p style="margin-top:16px;margin-bottom:0;margin-left:0;margin-right:0;">
          <span style="display:inline-block;border:1px solid ${COLOR_GOLD_MUTED};border-radius:999px;color:${COLOR_GOLD};font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:1.4px;padding-top:6px;padding-bottom:6px;padding-left:14px;padding-right:14px;text-transform:uppercase;">Official only</span>
        </p>`;
}

function renderCategoryDividerHtml() {
  return `
    <tr>
      <td style="padding-top:22px;padding-bottom:10px;padding-left:0;padding-right:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:36px;height:1px;background-color:${COLOR_GOLD};font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:1px;background-color:${COLOR_BORDER};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderCategoryHeaderHtml(categoryId) {
  const label = escapeHtml(categoryLabel(categoryId));
  return `
    <tr>
      <td style="padding-top:0;padding-bottom:14px;padding-left:0;padding-right:0;">
        <span style="display:inline-block;border:1px solid ${COLOR_GOLD_MUTED};border-radius:999px;color:${COLOR_GOLD};font-family:${FONT_UI};font-size:11px;font-weight:600;letter-spacing:1.5px;padding-top:7px;padding-bottom:7px;padding-left:14px;padding-right:14px;text-transform:uppercase;">${label}</span>
      </td>
    </tr>`;
}

function renderBrandMastheadHtml({ logoUrl, officialOnly, editionDate, siteBase }) {
  const officialBadge = officialOnly ? renderOfficialOnlyBadgeHtml() : '';
  const safeLogo = escapeHtml(logoUrl);
  const safeSite = escapeHtml(siteBase || DEFAULT_PUBLIC_WEB_BASE);
  const dateLine = editionDate
    ? `<p style="margin-top:0;margin-bottom:14px;margin-left:0;margin-right:0;color:rgba(200,208,220,0.78);font-family:${FONT_UI};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(editionDate)}</p>`
    : '';

  return `
          <tr>
            <td style="padding-top:0;padding-bottom:0;padding-left:0;padding-right:0;background-color:${COLOR_NAVY};background-image:linear-gradient(165deg,#070a0f 0%,#0f172a 48%,#1a2330 100%);border-bottom:1px solid rgba(197,169,119,0.28);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-top:36px;padding-bottom:32px;padding-left:32px;padding-right:32px;text-align:center;">
                    <a href="${safeSite}" style="text-decoration:none;">
                      <img src="${safeLogo}" width="56" height="56" alt="${escapeHtml(SITE_NAME)}" border="0" style="display:block;margin-top:0;margin-bottom:18px;margin-left:auto;margin-right:auto;width:56px;height:56px;border:0;" />
                    </a>
                    ${dateLine}
                    <p style="margin-top:0;margin-bottom:10px;margin-left:0;margin-right:0;color:rgba(200,208,220,0.78);font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Unofficial · Independent</p>
                    <h1 style="margin-top:0;margin-bottom:0;margin-left:0;margin-right:0;color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:34px;font-weight:800;line-height:1.05;letter-spacing:-0.03em;">${escapeHtml(SITE_NAME)}</h1>
                    ${renderMastheadRulesHtml()}
                    <p style="margin-top:0;margin-bottom:0;margin-left:0;margin-right:0;color:rgba(232,220,192,0.88);font-family:${FONT_BODY};font-size:16px;font-style:italic;line-height:1.55;">${MASTHEAD_TAGLINE}</p>
                    ${officialBadge}
                  </td>
                </tr>
              </table>
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
    ? `<a href="${safeUrl}" style="color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:21px;font-weight:700;line-height:1.28;letter-spacing:-0.02em;text-decoration:none;">${title}</a>`
    : `<span style="color:${COLOR_INK};font-family:${FONT_DISPLAY};font-size:21px;font-weight:700;line-height:1.28;letter-spacing:-0.02em;">${title}</span>`;
  const bottomPadding = isLastInSection ? '0' : '18px';
  const readMore = url
    ? `<tr>
            <td style="padding-top:12px;">
              <a href="${safeUrl}" style="display:inline-block;color:${COLOR_NAVY};background-color:${COLOR_GOLD};font-family:${FONT_UI};font-size:12px;font-weight:700;letter-spacing:0.04em;text-decoration:none;border-radius:8px;padding-top:9px;padding-bottom:9px;padding-left:14px;padding-right:14px;">Read source →</a>
            </td>
          </tr>`
    : '';

  return `
    <tr>
      <td style="padding-top:0;padding-bottom:${bottomPadding};padding-left:0;padding-right:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR_CARD};border:1px solid ${COLOR_BORDER};border-radius:12px;">
          <tr>
            <td style="padding-top:18px;padding-bottom:18px;padding-left:18px;padding-right:18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block;border:1px solid rgba(197,169,119,0.35);border-radius:999px;color:${COLOR_GOLD};font-family:${FONT_UI};font-size:10px;font-weight:600;letter-spacing:1.2px;padding-top:4px;padding-bottom:4px;padding-left:10px;padding-right:10px;text-transform:uppercase;">${escapeHtml(label)}</span>
                    ${date ? `<span style="color:${COLOR_INK_LIGHT};font-family:${FONT_UI};font-size:11px;margin-left:10px;">${date}</span>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    ${titleMarkup}
                  </td>
                </tr>
                ${excerpt ? `<tr><td style="padding-top:10px;color:${COLOR_INK_SOFT};font-family:${FONT_BODY};font-size:15px;line-height:1.65;">${excerpt}</td></tr>` : ''}
                <tr>
                  <td style="padding-top:10px;color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:11px;letter-spacing:0.04em;">${source}</td>
                </tr>
                ${readMore}
              </table>
            </td>
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
 * @param {{ unsubscribeUrl?: string | null, subscriber?: object, sections?: Array, publicWebBase?: string, logoUrl?: string, editionDate?: string }} [options]
 */
export function assembleEmailDigest(
  itemsOrSections,
  { unsubscribeUrl, subscriber, sections, publicWebBase, logoUrl, editionDate } = {},
) {
  const digestSections = resolveDigestSections(itemsOrSections, { subscriber, sections });
  const sorted = flattenDigestSections(digestSections);
  const count = sorted.length;
  const subject = assembleEmailSubject(sorted);
  const officialOnly = Boolean(subscriber?.officialOnly);
  const intro = buildIntroCopy(count, officialOnly);
  const brandLogoUrl = logoUrl || resolveBrandLogoUrl(publicWebBase);
  const edition = editionDate || formatEditionDate();
  const siteBase = resolvePublicWebBase(publicWebBase);

  const htmlSections = digestSections
    .map((section, index) =>
      renderCategorySectionHtml(section, { isLastSection: index === digestSections.length - 1 }),
    )
    .join('');

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
<body style="margin:0;padding:0;background-color:${COLOR_PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(intro)} — ${escapeHtml(SITE_NAME)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR_PAPER};">
    <tr>
      <td align="center" style="padding-top:28px;padding-bottom:36px;padding-left:16px;padding-right:16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${COLOR_PAPER_WARM};border:1px solid ${COLOR_BORDER};border-radius:16px;overflow:hidden;">
          ${renderBrandMastheadHtml({ logoUrl: brandLogoUrl, officialOnly, editionDate: edition, siteBase })}
          <tr>
            <td style="padding-top:24px;padding-bottom:8px;padding-left:28px;padding-right:28px;">
              <p style="margin-top:0;margin-bottom:0;margin-left:0;margin-right:0;color:${COLOR_INK_SOFT};font-family:${FONT_BODY};font-size:16px;line-height:1.6;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;padding-bottom:20px;padding-left:28px;padding-right:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${htmlSections}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;padding-bottom:16px;padding-left:28px;padding-right:28px;text-align:center;">
              <a href="${escapeHtml(siteBase)}" style="display:inline-block;color:${COLOR_NAVY};background-color:${COLOR_GOLD};font-family:${FONT_UI};font-size:13px;font-weight:700;letter-spacing:0.03em;text-decoration:none;border-radius:10px;padding-top:12px;padding-bottom:12px;padding-left:20px;padding-right:20px;">Open the full feed →</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:22px;padding-bottom:28px;padding-left:28px;padding-right:28px;border-top:1px solid ${COLOR_BORDER};background-color:${COLOR_CARD_ELEVATED};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;padding-bottom:14px;">
                    <img src="${escapeHtml(brandLogoUrl)}" width="28" height="28" alt="" border="0" style="display:inline-block;width:28px;height:28px;border:0;vertical-align:middle;" />
                    <span style="display:inline-block;margin-left:8px;color:${COLOR_INK};font-family:${FONT_UI};font-size:13px;font-weight:700;vertical-align:middle;">${escapeHtml(SITE_NAME)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin-top:0;margin-bottom:8px;margin-left:0;margin-right:0;color:${COLOR_INK_MUTED};font-family:${FONT_UI};font-size:12px;line-height:1.65;text-align:center;">
                      Unofficial fan project — not affiliated with Anysphere or Cursor.
                      Headlines link to original sources; we never republish full articles.
                    </p>
                    <p style="margin-top:0;margin-bottom:0;margin-left:0;margin-right:0;color:${COLOR_INK_LIGHT};font-family:${FONT_UI};font-size:12px;line-height:1.65;text-align:center;">
                      You subscribed to this digest via ${escapeHtml(SITE_NAME)}.
                      ${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLOR_LINK};text-decoration:underline;">Unsubscribe</a> anytime.` : 'Unsubscribe anytime in the app settings.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textHeader = [
    SITE_NAME.toUpperCase(),
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
    `Read more: ${siteBase}`,
    `You subscribed to this digest via ${SITE_NAME}.`,
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
    logoUrl: brandLogoUrl,
  };
}
