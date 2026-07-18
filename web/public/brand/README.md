# Brand assets — Unofficial Cursor News

Source brand sheet (master): keep a copy at repo root or design tool; do not commit multi-MB PNGs unless needed.

**Split:**
- **Web** → hex **icon** beside HTML masthead text (icon left, title + tagline + rules right); favicon, apple-touch, og:image use icon only
- **Email** → **horizontal raster lockups** (dark + light PNGs), ~560px display width

## Deliverable files (drop into this folder)

| File | Size | Source panel | Use |
|------|------|--------------|-----|
| `logo-icon.svg` | vector | §1 Icon only | Site header icon (beside HTML title) |
| `logo-icon-light.svg` | vector | §1 (light-theme variant) | Site header when `data-theme="light"` (optional) |
| `logo-icon.png` | 512×512 | §1 | Header fallback, og:image center mark |
| `favicon.ico` | 16+32+48 | §5 or downscale §1 | Browser tab |
| `favicon-32x32.png` | 32×32 | §5 | Modern browsers |
| `favicon-16x16.png` | 16×16 | §5 | Legacy |
| `apple-touch-icon.png` | 180×180 | §1 | iOS home screen |
| `og-image.png` | 1200×630 | §1 on `#0a0a0f` | Social / link previews |
| `email-lockup-dark.png` | 1120×~240 (@2x) | §3 Dark background | Digest emails (dark masthead) |
| `email-lockup-light.png` | 1120×~240 (@2x) | §4 Light background | Verification / light emails |

## Extraction from brand sheet

Panels (numbered on sheet):

1. **§1 Icon only (transparent)** — square crop around hex; ~2% padding. No bg removal needed.
2. **§2 Horizontal lockup (transparent)** — skip for email (use §3/§4 baked backgrounds instead).
3. **§3 Dark lockup** — crop full horizontal band (icon + UNOFFICIAL + Cursor News). Keep navy `#0d1b2a`-ish bg.
4. **§4 Light lockup** — same crop; keep cream `#f5f0e6`-ish bg.
5. **§5 Favicon preview** — reference for legibility at 32/64px; export from §1 if sharper.

**Workflow (Figma / Photopea / GIMP):**

1. Open master PNG at 100% zoom.
2. Rectangular marquee each panel; **Image → Crop**.
3. §1: trim to square; export PNG + trace SVG (or hand-build SVG for crisp header).
4. §3 / §4: trim label captions; export PNG @2x width (1120px wide, height proportional).
5. Favicon: resize §1 to 32, 16, 180; bundle `.ico` (RealFaviconGenerator or `png2ico`).
6. og:image: 1200×630 canvas, fill `#0a0a0f`, center `logo-icon.png` ~40% width.

**Avoid jagged edges:** export PNG; do not upscale small crops; prefer SVG for header icon.

## Where files wire in (after assets exist)

| Asset | Code location |
|-------|----------------|
| Favicon / apple-touch | `web/index.html` `<link rel="icon">`, `apple-touch-icon` |
| og:image / twitter | `web/index.html` `og:image`, `twitter:card` meta |
| Header icon | `web/src/components/Header.jsx` — hex icon left of HTML masthead (`h1`, rules, tagline); `alt=""` (decorative; title is adjacent) |
| Email dark logo | `web/worker/src/notifications/assemble-email.js` masthead (`logo-icon.png`) |
| Email light lockup | `web/worker/src/notifications/send-subscription-verification-email.js` header (optional lockup) |
| AI newsletter prompt | `web/worker/src/notifications/newsletter-prompt.js` — add hosted lockup URL |
| Public URL in emails | `PUBLIC_WEB_BASE` + `/brand/email-lockup-dark.png` (absolute URL required) |

## Email image notes

- Display width: **560px** (matches digest `max-width:560px`); export **1120px** wide for retina.
- Set HTML: `width="560" style="max-width:100%;height:auto;display:block;"`.
- Always include `alt="Unofficial Cursor News"`.
- Host on production domain so Gmail/Outlook can fetch images.

## Status

- [ ] Master sheet copied to `assets/brand/source/` (optional)
- [x] Web icon + favicons in `web/public/brand/`
- [ ] Email lockups in `web/public/brand/` (optional; digest currently uses `logo-icon.png`)
- [x] Code wired (Header, index.html, assemble-email masthead logo)
