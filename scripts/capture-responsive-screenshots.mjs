#!/usr/bin/env node
/**
 * Capture responsive before/after screenshots for PR evidence.
 * Usage: node scripts/capture-responsive-screenshots.mjs <before|after>
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const phase = process.argv[2] || 'before';
const baseUrl = process.env.SCREENSHOT_BASE || 'http://127.0.0.1:5173';
const outDir = path.join('/opt/cursor/artifacts/screenshots/responsive', phase);

const viewports = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
];

async function shot(page, file) {
  await page.screenshot({ path: file, fullPage: false });
}

async function captureArea(browser, viewport, area) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(area.url, { waitUntil: 'networkidle', timeout: 60_000 });

  if (area.waitSelector) {
    await page.waitForSelector(area.waitSelector, { timeout: 30_000 }).catch(() => {});
  }
  if (area.prepare) {
    await area.prepare(page);
  }

  const file = path.join(outDir, `${phase}-${viewport.name}-${area.name}.png`);
  if (area.locator) {
    const el = page.locator(area.locator).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.screenshot({ path: file }).catch(async () => {
      await shot(page, file);
    });
  } else {
    await shot(page, file);
  }

  await context.close();
}

const areas = [
  {
    name: 'nav',
    url: `${baseUrl}/`,
    locator: 'header nav',
    waitSelector: 'header nav',
  },
  {
    name: 'visitors-dashboard',
    url: `${baseUrl}/`,
    locator: '.visitor-stats-panel',
    waitSelector: '.visitor-stats-panel',
  },
  {
    name: 'category-sections',
    url: `${baseUrl}/changelog`,
    locator: '.filter-section',
    waitSelector: '.filter-section',
  },
  {
    name: 'feed-timeline',
    url: `${baseUrl}/#feed`,
    waitSelector: '#feed .news-list, #feed .grid',
    prepare: async (page) => {
      await page.locator('#feed').scrollIntoViewIfNeeded();
    },
    locator: '#feed',
  },
  {
    name: 'item-page',
    url: `${baseUrl}/`,
    prepare: async (page) => {
      const link = page.locator('#feed a[href*="/item/"]').first();
      const href = await link.getAttribute('href', { timeout: 8_000 }).catch(() => null);
      if (href) {
        await page.goto(`${baseUrl}${href}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      } else {
        await page.goto(`${baseUrl}/item/demo-layout`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
      }
      await page.waitForSelector('.article-page', { timeout: 15_000 }).catch(() => {});
    },
    locator: '.article-page',
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const area of areas) {
    process.stdout.write(`capture ${phase} ${viewport.name} ${area.name}…\n`);
    await captureArea(browser, viewport, area);
  }
}

await browser.close();
console.log(`Done → ${outDir}`);
