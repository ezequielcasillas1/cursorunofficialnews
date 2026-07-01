# AGENTS.md

## Cursor Cloud specific instructions

Monorepo with three sub-projects (see `README.md` / `docs/RUN-LOCAL.md` for full docs):

| Service | Path | Dev command | Port | Cloud-runnable |
|---|---|---|---|---|
| API (Express) | `mobile/server` | see note below | 8787 | Yes |
| Web reader (Vite + React 19) | `web` | `npm run dev` | 5173 | Yes |
| Mobile app (Expo dev client) | `mobile` | `npx expo start --dev-client` | — | No (needs Android device/emulator) |

### Running the API in this environment (important gotcha)

The platform node (`/exec-daemon/node`, currently v22.14) is forced to the front of `PATH` and **cannot be overridden** via `nvm`/`.bashrc`. It does **not** support the `--use-system-ca` flag that `mobile/server`'s `npm run dev` script uses (that flag is only for corporate Zscaler TLS on the maintainer's Windows machine and needs Node ≥ 22.15).

In this cloud VM, start the API without that flag — it is unnecessary here since public HTTPS works with the default CA bundle:

```bash
cd mobile/server && node --watch src/index.js   # dev with hot reload (equivalent to `npm run dev` minus --use-system-ca)
# or: cd mobile/server && npm start              # runs `node src/index.js`, no watch, also no flag
```

Do **not** "fix" the `dev` script by removing the flag — the maintainer needs it on their network.

### Notes

- The API bootstraps an ingest on startup and caches ~490+ items in memory (`GET /v1/status`, `GET /v1/news`, `GET /v1/sources`, `GET /health`).
- Some third-party feeds return `404`/`429`/`socket hang up` at ingest time (reddit, x rss, stackoverflow, dev.to, github discussions). These are upstream limits, not local bugs — official/forum feeds still populate the cache.
- Web "Refresh feed" calls `POST /v1/ingest`; no `INGEST_SECRET` is required in dev (`NODE_ENV` != `production`).
- The Vite dev server proxies `/api/*` → `http://127.0.0.1:8787` (`web/vite.config.js`), so start the API before the web reader.
- Web tests: `npm test` in `web/` (runs `node --test`).
