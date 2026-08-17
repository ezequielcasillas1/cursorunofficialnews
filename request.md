# request.md

Feature requests (numbered). Concise bullets only.

## 1. Master architecture — subscription-gated feature unlock (REBUILD)
- Rebuild from scratch; the old taco-unlock + cookie "screen freeze" gating was deleted for poor architecture.
- Cleanest possible source structure: vertical slice + modular, one shared contract for web + mobile.
- Two gated features only: (a) feed search, (b) source-name visibility.
- Unlock ONLY after a verified active subscription — real entitlement check, not honor-system "I bought a taco".
- Single source of truth for entitlement; no client-side bypass (server-verified); clients just read the entitlement.

## 2. Feed category classifier (master service layer) — DONE
- URL rules + content heuristics in `mobile/server/src/classify/`
- Forum URLs → Forum tab; docs/learn → Tutorial; SO/discussions → Community
- Optional LM Studio hook for ambiguous items (future)

## 3. Issue + Discussion category tabs — DONE
- `issue` for bug/broken/uninstall posts; `discussion` for opinion/roundup pieces
- Detected via score-based heuristics; layered after base classification
- Added Issues + Discussion tabs to mobile + web feed filters

## 4. Stripe membership replaces Buy Me a Coffee
- $1–$5/mo Stripe Checkout; paid entitlement is Stripe-backed for every email
- Checkout requires membership email; reuse Stripe customer; block duplicate active subs
- Claim/restore uses D1 + Stripe sync — no production owner-email paid bypass
- Restore retries stay unlimited; CAPTCHA after 10 attempts (no hard 429 cutoff)
- Newsletter subscribe/resubscribe gated by `membershipToken`
- Refunds: $4+/mo via `POST /v1/membership/refund`
- Cancel notice: Resend email + last Stripe invoice on the cancel screen
- Cancel screen: Resubscribe undoes scheduled Stripe cancel (`cancel_at_period_end`)
- See `docs/STRIPE-GO-LIVE.md`

## 5. New Yorker-inspired web redesign + WaPo-style fonts
- Refresh `web/` visual language inspired by newyorker.com editorial layout (masthead, rules, typographic hierarchy)
- Keep existing dark/light theme system (`web/src/theme/`); retune tokens for the new look, both modes
- Swap Google Fonts (free, CDN) to a primary/secondary pairing matching Washington Post's serif+Franklin-style sans
- Phased rollout: tokens/fonts → masthead/header → article cards/typography → responsive polish
- Preserve vertical-slice/component structure; no PasteCraft patterns

## 6. Games category (web) — Commit Chess
- Nav Games → `/games` hub; vertical slice `web/src/games/` + registry
- Brand logo pieces; AI opponent; client-only (no Worker)
- Commit Chess (git add/commit/push + rebase/merge/cherry-pick/revert) + command course
- Coming soon stubs: Diff Wars, Branch Race, Stash Stack

## 7. shadcn/ui on the Obsidian Gold web redesign
- Init shadcn in `web/` (Vite + Tailwind v4, Radix, new-york)
- Adapter: map shadcn tokens to existing gold/paper theme (keep Syne / Instrument Serif / Inter)
- Compose header, news cards, search, filters, loading/error, pagination, footer
- Preserve vertical slices; no PasteCraft patterns

## 8. Grok / xAI / SpaceX Updates coverage
- New `spacexai` category for official + aggregator Grok, xAI, SpaceXAI, and SpaceX news
- Updates tab = changelog + release + spacexai; Reddit/HN stay Community; official X → Social; YouTube → Videos
- Official: x.ai news, Grok Build releases, @xai/@grok/@SpaceX/@SpaceXAI, SpaceX YouTube
- Aggregators: Google News, SpaceNews, HN, Reddit, Dev.to/Medium (xAI first-class)
- Notification topic “Grok / xAI / SpaceX”; keep unofficial disclaimer
