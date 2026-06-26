export const SOURCES = [
  {
    id: 'cursor-changelog-rss',
    name: 'Cursor Changelog',
    category: 'changelog',
    feedUrl: 'https://cursor.com/rss.xml',
    ingestMethod: 'rss',
    enabled: true,
    priority: 1,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor',
  },
  {
    id: 'cursor-github-releases',
    name: 'Cursor GitHub Releases',
    category: 'release',
    feedUrl: 'https://github.com/getcursor/cursor/releases.atom',
    ingestMethod: 'atom',
    enabled: true,
    priority: 2,
    maxExcerptChars: 300,
    attributionLabel: 'GitHub',
  },
];

export function listSources() {
  return SOURCES.filter((s) => s.enabled);
}

export function getSourceById(id) {
  return SOURCES.find((s) => s.id === id) || null;
}