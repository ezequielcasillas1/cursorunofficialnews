# One-week build plan — Unofficial Cursor News

Target: working MVP in ~7 days (one shot or iterative).

## Day 1 — Scaffold + official feeds

- [x] Repo scaffold (`api/` + `ios/`)
- [ ] API: RSS/Atom ingest for changelog + GitHub releases
- [ ] `GET /v1/news` JSON endpoint
- [ ] iOS: feed list + open in Safari

## Day 2 — Source registry + dedupe

- [ ] Persist sources in registry module
- [ ] Dedupe by canonical URL
- [ ] iOS: pull-to-refresh, loading/error states

## Day 3 — Scrape fallback (optional path)

- [ ] Scrape adapter behind env flag
- [ ] One test domain only; metadata-only extraction

## Day 4 — Aggregator feeds

- [ ] Wire Releasebot (or one third-party RSS)
- [ ] Merge priority: official > aggregator

## Day 5 — Notifications backend

- [ ] Cron/worker: poll feeds, diff new items
- [ ] APNs device token registration endpoint (stub OK)

## Day 6 — iOS polish + About

- [ ] Settings: notification category toggles (local prefs)
- [ ] About: unofficial disclaimer, privacy link placeholder
- [ ] StoreKit subscription stubs (Supporter / Pro) — optional week-2

## Day 7 — TestFlight prep

- [ ] App icons (non-Cursor-branded)
- [ ] Privacy policy URL
- [ ] Test on device; fix API base URL for staging

## Out of scope for week 1

- Full APNs production certs
- IAP live in App Store Connect
- Forum scrape at scale
