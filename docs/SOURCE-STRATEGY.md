# Unofficial Cursor News — Source & Ingest Strategy

**App name:** Unofficial Cursor News  
**Positioning:** Unofficial fan app. Not affiliated with Anysphere. Link-out to originals.

---

## Display rules (ethical baseline)

- Store/show: **title, source, date, canonical URL, short excerpt (≤300 chars)**
- Tap → **Safari** (or SFSafariViewController) to original
- Never republish full article HTML or paywalled body
- Every card: attribution + “Open original”
- DMCA/opt-out contact in About + backend `removed_at` flag

---

## Four ingest paths (extend coverage)

Use all four in priority order. Backend merges + dedupes by canonical URL.

### 1. Official structured feeds (lowest risk — ship first)

| Source | URL | Method |
|---|---|---|
| Changelog RSS | `https://cursor.com/changelog/rss.xml` | RSS (canonical; live in `registry.js`) |
| Changelog page | `https://cursor.com/changelog` | HTML landing; RSS above |
| GitHub releases | `https://github.com/getcursor/cursor/releases.atom` | Atom |
| Blog | `https://cursor.com/blog` | Scrape fallback — no public RSS (404 on `/blog/rss.xml`) |

**Extend:** add new official URLs to `mobile/server/src/sources/registry.js` when Cursor publishes them.

### 2. Scraping API (fallback only)

Use when no RSS/Atom/API exists **and** robots.txt + site ToS allow it.

- Extract **metadata only**: title, date, url, meta description
- Rate-limit per domain; cache aggressively
- Env: `SCRAPE_API_URL` + `SCRAPE_API_KEY` (Firecrawl, ScrapingBee, etc.)
- Never scrape Apple properties (App Store guidelines)

**Extend:** register new domains in allowlist with `ingestMethod: 'scrape'`.

### 3. Curated allowlist database (your source registry)

Single registry drives all ingest workers.

Fields per source:

- `id`, `name`, `category` (changelog | blog | release | forum | community)
- `feedUrl` | `pageUrl` | `scrapeSelector`
- `ingestMethod`: `rss` | `atom` | `api` | `scrape`
- `enabled`, `priority`, `maxExcerptChars`
- `termsUrl`, `attributionLabel`
- `optOutContact`, `removedAt`

**Extend:** add rows — no app update required if API serves dynamic source list.

### 4. Third-party aggregator feeds (widest coverage)

Reuse existing curated feeds (verify ToS before production):

| Provider | Example | Notes |
|---|---|---|
| Releasebot | `releasebot.io/updates/cursor` | Multi-source release notes |
| Community RSS bridges | e.g. any-feeds custom URLs | Forum-suggested; verify reliability |
| Forum | `forum.cursor.com/c/announcements/10.rss` | Live — enabled in registry |

**Extend:** subscribe to their RSS/API; normalize into same `NewsItem` shape.

---

## Dedupe & merge

```
hash = normalizeUrl(canonicalUrl) || hash(title + publishedAt + sourceId)
```

Prefer official source over aggregator when duplicates match.

---

## Notifications (pivot feature vs NetNewsWire)

- Per-category toggles: Changelog, Releases, Blog, Forum
- Digest vs instant (Pro tier later)
- Deep link to **original URL**, not in-app full text

---

## App Store naming

- Product name: **Unofficial Cursor News**
- Refer to product as **Cursor** (not “Cursor AI”) in copy where citing the tool
- No Cursor logo as app icon without brand compliance
