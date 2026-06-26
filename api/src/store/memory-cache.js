let items = [];
let lastIngestAt = null;

export function getNews({ category, limit = 50 } = {}) {
  let list = [...items];
  if (category) {
    list = list.filter((item) => item.category === category);
  }
  list.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  return list.slice(0, limit);
}

export function replaceItems(nextItems) {
  items = nextItems;
}

export function setLastIngestAt(iso) {
  lastIngestAt = iso;
}

export function getLastIngestAt() {
  return lastIngestAt;
}

export function getStatus() {
  return {
    itemCount: items.length,
    lastIngestAt,
  };
}