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

## 4. Stripe membership replaces Buy Me a Coffee — DONE (pending Stripe object creation)
- $1–$5/mo Stripe Checkout subscription; one entitlement unlocks ad-free + email newsletter
- Newsletter subscribe/resubscribe now membership-gated (`membershipToken` required)
- See `docs/STRIPE-GO-LIVE.md` for required secrets + manual Stripe dashboard steps

## 5. New Yorker-inspired web redesign + WaPo-style fonts
- Refresh `web/` visual language inspired by newyorker.com editorial layout (masthead, rules, typographic hierarchy)
- Keep existing dark/light theme system (`web/src/theme/`); retune tokens for the new look, both modes
- Swap Google Fonts (free, CDN) to a primary/secondary pairing matching Washington Post's serif+Franklin-style sans
- Phased rollout: tokens/fonts → masthead/header → article cards/typography → responsive polish
- Preserve vertical-slice/component structure; no PasteCraft patterns
