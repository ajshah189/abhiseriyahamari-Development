# Session Report — Treasure Hunt + Map Polish

Date: 09 July 2026
Scope: 15-location QR code treasure hunt with full claim flow, admin QR printing, 4 map/dashboard polish fixes

---

## Files Created

- `src/data/treasureHunt.js` — 15 hunt locations across the 3 wedding days (5 per day), each with a unique `id` (`HUNT-001` through `HUNT-015`), icon, thematic hint, clue-to-next, and AR Miles reward (100–300). Four helper functions: `getHuntLocation(huntId)`, `getFoundLocations(guestId)`, `alreadyFound(guestId, huntId)`, `markLocationFound(guestId, huntId)`. Found state stored in `localStorage` under `ar_hunt_found_{guestId}` (not namespaced — intentional, these are hunt-specific keys that don't need the global `ar_airways:` prefix).

- `src/modules/hunt/HuntClaimScreen.js` — full-screen claim handler shown immediately after scanning a QR code. Reads `sessionStorage.ar_pending_hunt` (set by app.js before routing here). One-second loading spinner, then resolves to one of four states: discovery (first find — gold confetti, icon, clue card, Claim button), already-found (if `alreadyFound()` returns true), invalid (unknown hunt ID), or redirects home if no pending hunt at all. Claim calls `MilesService.earn(guestId, reward, reason, "HUNT_DISCOVERY")` then `markLocationFound()`, clears the pending hunt, and routes to the Hunt hub. Viewers who try to claim are redirected to onboarding (pending hunt survives).

- `src/modules/hunt/HuntPage.js` — the Treasure Hunt hub. Pure render function. Shows total found/total + hunt miles earned. Day 1/2/3 tab switcher. Location cards: locked state shows hint + mile reward; found state reveals name, ✅ icon, and miles earned. Top Hunters mini-leaderboard (device-local, same architecture as the main leaderboard — sums `HUNT_DISCOVERY` transactions per guest from `MilesService.getLedger()`). Collapsible "How to play" section via `<details>`. Viewers see a `.access-locked` login prompt.

- `src/modules/hunt/HuntScreen.js` — router adapter. Manages `activeDay` state (resets to Day 1 on each `show()`). Wires `data-route` clicks and `data-hunt-day` tab switches.

- `src/modules/hunt/hunt.css` — all Treasure Hunt styles. Claim screen: dark bg, centered flex column, gold spinner animation (`hunt-spin`), `hunt-reveal` keyframe for icon/miles/clue-card staggered entrance, 20-piece CSS confetti with JS-generated inline `--delay`/`--duration`/`background` custom properties. Hub: day-tab pill switcher matching the admin nav style, location cards with gold left-border on found state, hunt-leaderboard rows, admin QR grid (`auto-fill minmax(200px,1fr)`).

---

## Files Modified

- `src/models/Transaction.js` — added `HUNT_DISCOVERY: "HUNT_DISCOVERY"` to `TX_KINDS`. Now filterable in `MilesService.getLedger()` and shown in the activity feed with the 🗺️ icon.

- `src/components/cards/ActivityCard.js` — added `HUNT_DISCOVERY: "🗺️"` to `KIND_ICONS`. Appears automatically in the Recent Activity feed when a location is discovered.

- `src/modules/dashboard/QuickActions.js` — added Treasure Hunt as the 9th quick action (`data-route="hunt"`, icon 🗺️), between Leaderboard and Settings.

- `src/modules/onboarding/OnboardingScreen.js` — after a successful login, `submit()` now checks `sessionStorage.getItem("ar_pending_hunt")` and routes to `"hunt-claim"` instead of `"home"` if a hunt is pending. The 450ms success-fade timing is unchanged.

- `src/modules/map/MapScreen.js` — two fixes in one:
  1. `applyAdminVisibility()` helper hides `#editorToggle` and `#editorDivider` for non-admin sessions (`sessionStorage.ar_admin_auth !== "true"`). Called in both `mount()` and `show()` so it re-evaluates if admin auth changes during the session.
  2. BottomNav injected as the last child of `#screen-map` at the end of `mount()`, with `data-route` click handlers wired to `Router.go()`. `#viewport` gets `paddingBottom: 64px` inline. Imported `BottomNav` from `../../components/layout/BottomNav.js`.

- `src/modules/journey/JourneyPage.js` — removed `classFromTier()` indirection on the boarding pass. `flightClass` is now set directly to `tierName` ("Explorer", "Silver Traveller", etc.) instead of the airline-class translation ("Economy", "Business", "First"). The `classFromTier()` function is left defined but unreferenced — can be deleted in a future cleanup pass.

- `src/components/cards/PassengerCard.js` — room display fixed. Now reads `snapshot.profile.roomCottage` and `snapshot.profile.roomZone` (both already in the PassengerService snapshot) and formats them as "Room 501 · Asia Zone". Falls back to `snapshot.profile.room` (the destination city name, e.g. "Japan") only if `roomCottage` is null.

- `src/modules/admin/AdminPage.js` — added 5th nav item `{ id: "qrcodes", label: "QR Codes" }`, imported `HUNT_LOCATIONS`, added `qrCodesSection()` render function (15-card grid, each with a live `api.qrserver.com` QR image, location metadata, and a `data-qr-print` button), added `qrcodes: qrCodesSection` to `SECTION_RENDERERS`.

- `src/modules/admin/AdminScreen.js` — added `bindQrEvents()` called from `bindEvents()`. Print handler opens a new window, writes a minimal HTML print page (brand header, location name, "scan to earn X miles", 400px QR image, URL in small text), closes the document, and auto-calls `window.print()` via `window.onload`.

- `src/app.js` — two additions:
  1. Imported `HuntScreen` and `HuntClaimScreen`; registered `"hunt"` and `"hunt-claim"` routes.
  2. `?hunt=` URL param handling before all other routing: stores the ID in `sessionStorage.ar_pending_hunt`, routes unauthed guests to onboarding, routes authed/viewer guests directly to `hunt-claim`.

- `index.html` — added `<div id="screen-hunt" hidden>` and `<div id="screen-hunt-claim" hidden>` containers; added `<link rel="stylesheet" href="src/modules/hunt/hunt.css">`.

---

## What Works (verified in live preview)

**Fix 2 — Boarding pass tier:** Journey screen shows "Explorer" (the real tier name) instead of "ECONOMY". Verified with G001 (Abhishek Shah, seed balance 1250 → Explorer tier). ✅

**Fix 3 — Room format:** Dashboard PassengerCard shows "Room 501 · Asia Zone" for G001 (room R101, cottage 501, Asia zone). Previously showed "Japan" (the destination city name). ✅

**Fix 1 — Editor tools hidden:** `#editorToggle` and `#editorDivider` have `display: none` for non-admin sessions. `sessionStorage.ar_admin_auth` is null for regular guests. ✅

**Fix 4 — Map BottomNav:** `.bottom-nav` present inside `#screen-map`. `#viewport` has `paddingBottom: 64px`. ✅

**Hunt claim — discovery state:** Navigating to `/?hunt=HUNT-003` routes to `screen-hunt-claim`, loads loading spinner for 1s, then renders discovery state with 🏊 icon, "The Main Pool", "+150 ✈", clue card ("Something sacred awaits..."), and "Claim Miles ✈" button. 20 confetti pieces generated with correct inline styles. ✅

**Hunt claim — miles credited:** Clicking "Claim Miles ✈" records `{ kind: "HUNT_DISCOVERY", amount: 150, reason: "Discovered: The Main Pool", guestId: "G001" }` in the ledger at `ar_airways:miles_ledger`. G001 balance moves from 1250 to 1400. Location written to `ar_hunt_found_G001 = ["HUNT-003"]`. `ar_pending_hunt` cleared from sessionStorage. Routes to `screen-hunt`. ✅

**Hunt hub — found state:** After claiming, hub shows "1 / 15 found" and "+150 ✈ earned" in the stats bar. The Main Pool card shows ✅ icon, revealed name, and "+150 ✈". 4 other Day 1 cards remain locked. ✅

**Double-claim prevention:** Scanning `/?hunt=HUNT-003` again renders `hunt-claim--found` state ("Already Discovered, You already claimed +150 AR Miles here ✈") with no Claim button — only "Back to Hunt". ✅

---

## One Architecture Note

The QR flow has a subtle but important piece: `?hunt=` is handled by `app.js` BEFORE the standard auth check. This means the hunt ID is stored in sessionStorage BEFORE any routing decision, so it survives through the onboarding screen. `OnboardingScreen.js` then reads it after a successful login and redirects to `hunt-claim` instead of `home`. Viewers (who skip login) go directly to the claim screen and are only redirected to onboarding when they actually click "Claim Miles" — they can still see the discovery state and read the clue. This was a deliberate choice: showing guests the discovery excitement even before they log in creates a stronger incentive to complete login.

---

## What to Build Next

Per spec recommendation: **Local Notifications** — push/local notification stubs in the SW are already wired. The next step is wiring Firebase Cloud Messaging so that organizers can broadcast event reminders ("Garba starts in 30 minutes!") to all installed PWA instances. This requires a Firebase project, a server-side key, and updating `sw.js`'s push handler from the current stub to actual notification display.

Pre-launch items still outstanding:
- **Real PNG icons** — `node scripts/generate-icons.js` after designing the actual AR Airways icon.
- **SW cache update** — new hunt module files (`src/modules/hunt/*`, `src/data/treasureHunt.js`) need to be added to `APP_SHELL` in `/sw.js` and `CACHE_NAME` bumped to `ar-airways-v2` before the wedding.
- **Backend persistence** — localStorage leaderboard isolation means each device only sees its own data; a real-time leaderboard requires a backend.
- **QR code printing** — admin should print all 15 QR cards and laminate them for placement around the resort 1–2 days before the wedding.
