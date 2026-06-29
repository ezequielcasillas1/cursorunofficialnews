import { ingestScrapeSources } from '../src/ingest/scrape.js';
import { ingestSitemapSources } from '../src/ingest/sitemap.js';

const [scrapeItems, sitemapItems] = await Promise.all([
  ingestScrapeSources(),
  ingestSitemapSources(),
]);

const tutorialScrape = scrapeItems.filter((item) => item.category === 'tutorial');
const tutorialSitemap = sitemapItems.filter((item) => item.category === 'tutorial');

console.log('scrape total', scrapeItems.length);
console.log('scrape tutorial', tutorialScrape.length);
console.log(
  'scrape tutorial sources',
  [...new Set(tutorialScrape.map((i) => i.sourceId))].join(', ') || '(none)',
);
console.log('sitemap tutorial', tutorialSitemap.length);
console.log(
  'sitemap tutorial sources',
  [...new Set(tutorialSitemap.map((i) => i.sourceId))].join(', '),
);

if (tutorialScrape.length > 0) {
  console.log('sample scrape tutorial:', tutorialScrape.slice(0, 3));
}
