import { getPublicWebBase } from '../lib/env.js';
import { listRecentNewsIds } from '../store/news-store.js';

const STATIC_PATHS = [
  { path: '/', changefreq: 'hourly', priority: '1.0' },
  { path: '/updates', changefreq: 'hourly', priority: '0.9' },
  { path: '/news', changefreq: 'hourly', priority: '0.9' },
  { path: '/forum', changefreq: 'hourly', priority: '0.8' },
  { path: '/issues', changefreq: 'hourly', priority: '0.8' },
  { path: '/community', changefreq: 'hourly', priority: '0.8' },
  { path: '/discussion', changefreq: 'hourly', priority: '0.8' },
  { path: '/social', changefreq: 'hourly', priority: '0.8' },
  { path: '/videos', changefreq: 'hourly', priority: '0.8' },
  { path: '/tutorials', changefreq: 'hourly', priority: '0.9' },
  { path: '/newsletter', changefreq: 'weekly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/editorial-policy', changefreq: 'monthly', priority: '0.6' },
  { path: '/sources', changefreq: 'weekly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { changefreq, priority, lastmod } = {}) {
  const parts = [`    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

/** Build a fresh sitemap XML string including recent item pages. */
export async function buildSitemapXml(db, env) {
  const origin = getPublicWebBase(env).replace(/\/$/, '');
  const staticEntries = STATIC_PATHS.map(({ path, changefreq, priority }) =>
    urlEntry(`${origin}${path === '/' ? '/' : path}`, { changefreq, priority }),
  );

  let itemEntries = [];
  try {
    const rows = await listRecentNewsIds(db, 500);
    itemEntries = rows.map((row) => {
      const id = encodeURIComponent(row.id);
      const lastmod = row.published_at ? String(row.published_at).slice(0, 10) : undefined;
      return urlEntry(`${origin}/item/${id}`, {
        changefreq: 'weekly',
        priority: '0.7',
        lastmod,
      });
    });
  } catch (err) {
    console.warn('[sitemap] item urls skipped:', err?.message || err);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...itemEntries,
    '</urlset>',
    '',
  ].join('\n');
}

export async function sitemapResponse(db, env) {
  const xml = await buildSitemapXml(db, env);
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
