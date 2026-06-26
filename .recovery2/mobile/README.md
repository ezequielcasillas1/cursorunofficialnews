# Unofficial Cursor News — Mobile

Expo Dev Client app (React Native, JS). Primary client for Phase 1.

## Architecture

Vertical slice: **sources → API → feed screen**

| Module | Role |
|---|---|
| `src/config/constants.js` | API base URL, disclaimer text |
| `src/api/newsClient.js` | HTTP client for `/v1/news`, `/v1/ingest` |
| `src/components/` | Disclaimer banner, list item |
| `src/screens/` | Feed + About |

Phase 1 uses direct HTTP to the local API. No MCP integration yet.

## Dev API URL

| Target | `EXPO_PUBLIC_API_BASE` |
|---|---|
| iOS Simulator / default | `http://127.0.0.1:8787` |
| Android emulator | `http://10.0.2.2:8787` (default on Android) |
| Physical device | Your PC LAN IP, e.g. `http://192.168.1.10:8787` |

Start the API first (`../api`). React Native does not use browser CORS, but the API allows `*` in dev for web clients.

## Windows commands

**Terminal 1 — API**

```powershell
cd C:\Dev\PasteCraft\unofficial-cursor-news\api; npm install; npm run dev
```

**Terminal 2 — Expo dev client**

```powershell
cd C:\Dev\PasteCraft\unofficial-cursor-news\mobile; npm install; npx expo install expo-dev-client expo-constants; npx expo start --dev-client
```

**First-time native build (Android)**

```powershell
cd C:\Dev\PasteCraft\unofficial-cursor-news\mobile; npx expo run:android
```

Requires Android Studio + emulator or USB device. iOS native builds need macOS.

## Screens

- **Feed** — `GET /v1/news`, tap row → `Linking.openURL(canonicalUrl)`
- **Refresh** — `POST /v1/ingest` then reload feed
- **About** — unofficial disclaimer stub
