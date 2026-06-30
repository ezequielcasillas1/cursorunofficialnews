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
