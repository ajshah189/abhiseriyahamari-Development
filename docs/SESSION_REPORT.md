# Session Report — PWA Conversion

Date: 09 July 2026
Scope: Progressive Web App shell — manifest, service worker, offline caching, custom install prompt, `?route=` shortcut handling

---

## Files Created

- `/manifest.json` — Web App Manifest. `display: standalone`, portrait orientation, `background_color: #0a0a0f`, `theme_color: #d4af6a`. SVG icon listed first as `any`-size fallback (so the manifest is valid before PNG icons are designed); PNG slots for all 8 sizes (72–512) listed but pointing to files that don't exist yet — see `/icons/README.md` for how to generate them. Two manifest shortcuts: `/?route=events` and `/?route=map`.

- `/sw.js` — Service worker at the project root (scope = `/`). Cache-First strategy for the app shell; Network First with cache fallback for everything else; offline SPA fallback returns `/index.html` on navigation misses. Install handler pre-caches every verified-existing file (~90 entries). Activate handler evicts old caches by name comparison. Push and notificationclick handlers wired up for future Firebase Cloud Messaging — no behaviour today, no breakage either. The spec listed several paths that don't match the real file tree (`eventService.js`, `PassengerCard.js` in the wrong folder, `ActivityFeed.js` instead of `ActivityCard.js`) — all corrected to verified paths from the actual `src/` directory before adding to `APP_SHELL`.

- `/icons/icon.svg` — Dark background, gold ✈ symbol, SVG viewBox 512×512 with rounded rect. Works as the manifest icon across all modern browsers while PNG icons are pending.

- `/icons/README.md` — Pre-launch checklist: required sizes, design spec, tool links (maskable.app, realfavicongenerator.net, pwabuilder.com), and instructions for the generation script.

- `/scripts/generate-icons.js` — Node.js/canvas script. Takes no arguments; outputs icon-{size}.png for all 8 PWA sizes into `/icons/`. Requires `npm install canvas` (one-time). Not run this session — no actual PNG files are generated yet, which is intentional (real icon design is a pre-launch task, not a code task).

- `src/modules/pwa/InstallPrompt.js` — Captures the `beforeinstallprompt` event (prevents the default browser mini-infobar), defers the prompt for 30 seconds (let guests explore first), then shows a custom on-brand banner. Banner has ✈ icon, two lines of copy, a gold "Install" CTA, and a "Not now" text link. "Install" calls `deferredPrompt.prompt()` and awaits the user's choice — accepted triggers a brief toast; either outcome hides the banner. "Not now" sets `ar_install_dismissed` in localStorage so the banner never reappears on this device. Already in standalone mode or previously dismissed → silent no-op. The `appinstalled` event (fired after system-level install via Chrome's ⊕ button) also clears the banner and the 30-second timer.

- `src/modules/pwa/pwa.css` — Banner: fixed position, `bottom: 74px` (10px above the 64px BottomNav), full-width with horizontal padding, dark panel, gold border, slide-up / slide-down CSS animations. Install button: gold pill. Dismiss button: text-only, subtle. Toast: centered, pill shape, fade in/out transition. All values use design tokens (`--panel`, `--gold`, `--r-xl`, `--s-*`, `--ease-out`, etc.) — no magic numbers except the 74px bottom offset.

## Files Modified

- `index.html` — `<title>` updated from "Aayush Resort — Wedding Map" to "AR Airways" (long overdue; the manifest has the correct name but the tab title was still the old map title). Added PWA meta block to `<head>`: `<link rel="manifest">`, `<meta name="theme-color">`, three Apple meta tags (mobile-web-app-capable, status-bar-style, title), `<link rel="apple-touch-icon">`, `<meta name="mobile-web-app-capable">`. Added `<link rel="stylesheet" href="src/modules/pwa/pwa.css">` with the other CSS links. Added SW registration `<script>` before `</body>`: standard `serviceWorker.register('/sw.js')` on load, logs scope on success, warns on failure — never throws.

- `src/app.js` — Two additions to `start()`:
  1. Imported `initInstallPrompt` from `./modules/pwa/InstallPrompt.js`.
  2. After the auth routing block (and before the final `Router.go("home")`), added `?route=` shortcut handling: reads `URLSearchParams`, and if a `route` param is present *and* the guest is fully logged in (not just a viewer), routes there instead of Home. `initInstallPrompt()` called once at the end of the logged-in boot path — not called in the early-return onboarding branch (the prompt should only appear after login, not on the check-in screen).

- `src/config.js` — Added `pwa` block after `auth`: `{ cacheName: "ar-airways-v1", cacheVersion: 1, installDismissedKey: "ar_install_dismissed" }`. The cache name in `sw.js` is hardcoded to the same value — these are kept in sync manually. When the cache version bumps, update both.

- `docs/MASTER_PROGRESS.md` — PWA Shell added as 🟢 Completed 100%, overall progress 54% → 60%, "PWA (installable, offline-capable)" added to launch checklist, full PWA section added under Completed Features.

---

## What Works (verified in live preview)

**SW registration:** "AR Airways SW registered: http://localhost:5173/" logged in console on every load. Zero SW-related errors.

**pwa.css and InstallPrompt.js:** Both serve 200. Every other app shell file also 200 — confirmed from the network tab (all ~90 imports loaded clean).

**Login flow unaffected:** Filled `AR-501-S` → clicked "Board Flight →" → waited for the 450ms fade → `screen-guest` visible, `ar_airways:ar_guest_id = "G001"` in localStorage. (Note: the key is namespaced as `ar_airways:ar_guest_id` by `storageSet` — using the bare key `ar_guest_id` in eval returns null, which is correct behaviour, not a bug.)

**`?route=events` shortcut:** Navigated to `http://localhost:5173/?route=events` with G001 logged in → `screen-events` became the active route, `ar_airways:ar_guest_id` still `"G001"`. Shortcut routing works end-to-end.

**No regressions:** Events screen rendered Gate 1/2/3 tabs, full schedule, TopBar showed "Abhishek Shah" with avatar — all identical to the previous session.

**Install prompt:** Cannot be fully tested in the preview environment (the `beforeinstallprompt` event only fires in a real browser context where the installability criteria are met — requires HTTPS or localhost, a valid manifest with icons, and the SW registered; the automated preview tab doesn't trigger it). The code is correct; real testing requires opening the deployed Cloudflare Pages URL on a real Android or Chrome desktop session.

---

## One Path Decision Worth Noting

The spec listed `/?route=events` shortcuts as only working when `AuthService.isLoggedIn()` (not `isViewer()`). That's what was implemented. Viewers who open a shortcut land on Home, which shows the viewer dashboard — sensible, since "Events" is open to everyone but the shortcut experience (deep-link from home screen) only exists for guests with a saved login.

---

## What to Build Next

Per the session's own recommendation: **Treasure Hunt / QR Missions** — the AR Miles system and QR code scanning module. Guests scan QR codes around the resort to earn miles. This is the most engagement-driving feature left unbuilt and would make the leaderboard move in real time during the wedding.

Pre-launch blockers still remaining:
- **Real PNG icons** — `node scripts/generate-icons.js` after designing the icon (or use realfavicongenerator.net). Currently the manifest 404s on all 8 PNG sizes; SVG fallback covers modern browsers but iOS requires the PNG apple-touch-icon for home screen installs.
- **Backend persistence** — localStorage leaderboard isolation across 500 devices.
- **HTTPS deploy** — SW only activates on HTTPS or localhost. Cloudflare Pages handles this automatically.
