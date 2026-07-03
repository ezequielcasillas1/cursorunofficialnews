import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getPrerenderRoutes } from './scripts/prerenderRoutes.js';
import {
  DEFAULT_SITE_TITLE,
  DEFAULT_DESCRIPTION,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from './src/seo/pageMeta.js';
import { ABOUT_CRAWL_INTRO } from './src/seo/crawlCopy.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceMeta(html, { title, description, path, canonical }) {
  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

  const replacements = [
    ['name="description"', description],
    ['property="og:title"', title],
    ['property="og:description"', description],
    ['property="og:url"', canonical],
    ['property="og:image"', OG_IMAGE_URL],
    ['name="twitter:title"', title],
    ['name="twitter:description"', description],
    ['name="twitter:image"', OG_IMAGE_URL],
  ];

  for (const [attr, content] of replacements) {
    const re = new RegExp(`(<meta[^>]*${attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*content=")[^"]*(")`, 'i');
    out = out.replace(re, `$1${escapeHtml(content)}$2`);
  }

  const canonicalRe = /(<link rel="canonical" href=")[^"]*(")/i;
  out = out.replace(canonicalRe, `$1${escapeHtml(canonical)}$2`);

  return out;
}

function buildNoscriptBlock({ title, description, path }) {
  const intro =
    path === '/about' || path === '/'
      ? `<p>${ABOUT_CRAWL_INTRO.map((p) => escapeHtml(p)).join('</p><p>')}</p>`
      : `<p>${escapeHtml(description)}</p>`;

  return `<noscript class="crawl-fallback"><h1>${escapeHtml(title)}</h1>${intro}<p><a href="${escapeHtml(path === '/' ? '/' : path)}">Continue to ${escapeHtml(title)}</a></p></noscript>`;
}

function injectNoscript(html, noscriptBlock) {
  if (html.includes('class="crawl-fallback"')) {
    return html.replace(/<noscript class="crawl-fallback">[\s\S]*?<\/noscript>/, noscriptBlock);
  }
  return html.replace('<div id="root"></div>', `${noscriptBlock}\n    <div id="root"></div>`);
}

/**
 * After Vite build, write route-specific index.html files with correct head meta
 * so crawlers and link previews see titles/descriptions without running JS.
 */
export function prerenderMetaPlugin() {
  return {
    name: 'prerender-meta',
    apply: 'build',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist');
      const baseHtml = readFileSync(join(outDir, 'index.html'), 'utf8');
      const routes = getPrerenderRoutes();

      for (const route of routes) {
        const meta = {
          title: route.title ?? DEFAULT_SITE_TITLE,
          description: route.description ?? DEFAULT_DESCRIPTION,
          path: route.path ?? '/',
          canonical: route.canonical ?? 'https://cursorunofficial.news/',
        };

        let html = replaceMeta(baseHtml, meta);
        html = injectNoscript(html, buildNoscriptBlock(meta));

        const filePath =
          meta.path === '/'
            ? join(outDir, 'index.html')
            : join(outDir, meta.path.slice(1), 'index.html');

        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, html, 'utf8');
      }

      // Ensure og:image dimensions exist in all shells (base index may lack them).
      const indexPath = join(outDir, 'index.html');
      let rootHtml = readFileSync(indexPath, 'utf8');
      if (!rootHtml.includes('og:image:width')) {
        const ogDims = `    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />\n    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />\n`;
        rootHtml = rootHtml.replace('</head>', `${ogDims}  </head>`);
        writeFileSync(indexPath, rootHtml, 'utf8');
      }

      this.info(`Prerendered meta for ${routes.length} routes`);
    },
  };
}
