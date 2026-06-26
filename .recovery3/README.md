# Unofficial Cursor News

iOS app + backend API for Cursor changelog, releases, and community news. **Not affiliated with Anysphere.**

## Stack

| Layer | Tech | Notes |
|---|---|---|
| iOS | Swift + SwiftUI | Requires **Mac + Xcode 15+** to build/run |
| API | Node.js (Express) | Ingest, normalize, serve news JSON |
| Push | APNs (later) | Backend triggers after ingest |

## Swift on Windows (this repo)

You **can** edit Swift files here in Cursor on Windows. You **cannot** compile or run the iOS app locally without a Mac.

Workflow:

1. Edit Swift/API in this repo on any OS
2. Open `ios/` in Xcode on a Mac (or cloud Mac CI)
3. Run `xcodegen generate` in `ios/` if you use XcodeGen, or create a new iOS App project and add the `UnofficialCursorNews/` folder

## Quick start (Mac)

```bash
# API
cd unofficial-cursor-news/api
npm install
npm run dev

# iOS (optional XcodeGen)
cd ../ios
brew install xcodegen   # once
xcodegen generate
open UnofficialCursorNews.xcodeproj
```

Set API base URL in `ios/UnofficialCursorNews/Config/AppConfig.swift` (simulator: `http://127.0.0.1:8787`).

## Docs

- [SOURCE-STRATEGY.md](docs/SOURCE-STRATEGY.md) — four ingest paths + ethics
- [WEEK-PLAN.md](docs/WEEK-PLAN.md) — one-week build order

## Monetization (planned)

- Free core feed + notifications
- Optional IAP: $0.99/mo Supporter, $4.99/mo Pro (StoreKit — not in scaffold yet)
