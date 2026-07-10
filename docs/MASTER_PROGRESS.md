# AR Airways – Master Progress

Last Updated:
10 July 2026 (Session 4)

Current Version:
v0.3

Current Phase:
Phase 1 – Foundation

Current Sprint:
Sprint 002 – Architecture Refactor

Overall Progress:
78%

Project Status:
🟡 Active Development

Production Status:
🟢 Live on Cloudflare Pages

Development Branch:
development

Production Branch:
main

---

# Overall Progress

| Epic | Status | Progress |
|------|--------|----------|
| Foundation | 🟡 In Progress | 80% |
| Interactive Map | 🟢 Completed | 100% |
| Guest Onboarding / Auth | 🟢 Completed | 100% |
| Passenger System | 🟢 Completed | 100% |
| PWA Shell | 🟢 Completed | 100% |
| Home Dashboard | ⚪ Not Started | 0% |
| Boarding Pass | 🟢 Completed | 100% |
| Passport | 🟢 Completed | 100% |
| Events | 🟢 Completed | 100% |
| AR Miles | ⚪ Not Started | 0% |
| Leaderboards | 🟢 Completed | 100% |
| Rewards | 🟢 Completed | 100% |
| Profile | 🟢 Completed | 100% |
| QR Missions / Treasure Hunt | 🟢 Completed | 100% |
| Map Polish | 🟢 Completed | 100% |
| Admin Dashboard | 🟢 Completed | 100% |
| Guest Directory | 🟢 Completed | 100% |
| Map Navigation UX | 🟢 Completed | 100% |
| CSV Guest Import | 🟢 Completed | 100% |
| PWA Icons | 🟢 Completed | 100% |
| Analytics | ⚪ Not Started | 0% |
| Final QA | ⚪ Not Started | 0% |

---

# Completed Features

## Interactive Map

✅ Resort Map

✅ Search

✅ Navigation

✅ Room Labels

✅ Zone Labels

✅ Mobile Responsive

✅ Popup Cards

✅ Smooth Animations

✅ Country Theme Ready

## Events

✅ Departures-board Events screen (Gate 1/2/3 day tabs)

✅ Flight-card schedule (flight code, tagline, country, venue, dress code, AR Miles reward)

✅ Live status derivation (upcoming / boarding / in-flight / landed) — never hardcoded

✅ Dashboard "Today's Journey" now reads the same live event data

✅ Reusable EventTimeline component (dashboard + future sidebars)

## Boarding Pass / Journey Hub

✅ 5-tab BottomNav restructure (Home / Map / Journey / Rewards / Profile), route-group aware so sub-screens highlight the right parent tab

✅ Journey hub screen: boarding pass + flight schedule preview + passport preview, one scrollable page

✅ Boarding pass card with live passenger name, room/gate/seat, family boarding group, and miles-tier-derived class (Economy/Business/First) — all from PassengerService, nothing hardcoded

✅ Airline-authentic visual design: light card on dark app background, dashed/notched tear line, barcode placeholder strip

✅ Passport preview: country circles derived from event data, visited/locked state from live event status

⬜ Functional QR code on the boarding pass (currently decorative)

## Rewards / Leaderboard

✅ Rewards hub: miles balance bar (always visible) + client-side segmented toggle between Rewards and Leaderboard — no route change, no reload

✅ 8-item reward catalogue (`data/rewards.js`), sorted featured-first then by cost, affordability derived live from balance

✅ Redeem flow shows "opens on 22 Jan 2027" inline confirmation — intentionally does not deduct miles yet (no backend); `RewardService.redeem()` exists and is ledger-correct for when redemption actually opens

✅ Individual + family leaderboards, both fully computed in `leaderboardService` (extended with per-guest tier and per-family member count) — no sorting in UI code

✅ Current guest highlighted on the leaderboard; deep link via the separate "leaderboard" route pre-selects that segment

⬜ Reward redemption is not yet wired to actually spend miles (deliberate, per spec)

## Profile

✅ Single scrollable Profile page — header, journey stats, transaction history, redeemed rewards, quick info — all from PassengerService/MilesService/RewardService/data/events.js, nothing hardcoded

✅ Journey stats (events attended, countries visited) computed live from `getEventStatus()` on the shared wedding schedule

✅ Last 20 ledger transactions shown via `MilesService.getLedger()`, color-coded earn (green) vs redeem (red)

✅ **All 5 BottomNav tabs (Home, Map, Journey, Rewards, Profile) now open real screens.** The "settings" route also resolves (to Profile, since Settings has no dedicated screen yet) instead of 404ing. Only "passport" still falls through to `ComingSoonScreen`.

✅ Guest data model extended with `dietPreference` / `emergencyContact` (documented in DATABASE.md's Guest schema but not yet implemented) — threaded through `models/Guest.js` and `PassengerService`

## Passport

✅ Full passport page: dark "cover" header, 2-column stamp grid, gold journey progress bar — the most visually premium screen in the app so far

✅ 7 country stamps (International, Australia, Morocco, India ×2, Brazil, Italy), each tied to one event via `eventId`; stamp status (`locked`/`boarding`/`stamped`) derived live from `getEventStatus()` — never stored, matches every other status surface in the app (Events, Journey preview)

✅ CSS-only stamp effects: per-country tint/border via a `--stamp-color` custom property threaded from data, alternating ink-stamp rotation via `nth-child` (not random), gold pulse animation while an event is boarding/in-flight

✅ **Every BottomNav-reachable route now has a real screen.** `UPCOMING_ROUTES` in `app.js` is empty — `ComingSoonScreen` is still wired up as the fallback pattern for whatever's next (QR Missions, etc.), just has nothing left to fall back to today. The BottomNav known-issue below about the passport route is now resolved.

## Admin Dashboard

✅ Organiser tool at the `"admin"` route — no BottomNav entry, not in `ComingSoonScreen`, reached only via 5 rapid taps on the Profile avatar (`data-admin-trigger`)

✅ PIN gate (`2727`, sessionStorage-only, no backend) with shake-on-wrong-PIN and session persistence — full-screen numpad, airport-security-checkpoint styling per spec, not alarming

✅ Overview: 4 live stat cards (Total Miles Awarded, Active Guests, Events Today, Rewards Redeemed) + read-only top-10 leaderboard, all recomputed on every visit

✅ Award Miles: searchable guest picker, preset/custom amounts, reason field, goes through `MilesService.earn(..., "AWARD_MANUAL")` — the same ledger choke point the rest of the app uses, never `milesStore` directly from the UI. Verified end-to-end: awarding 500 miles moved a guest's real balance and the leaderboard rank together.

✅ Guests: searchable/filterable table (name, family, room, live balance, tier), expandable rows showing last 5 transactions, "+Miles" shortcut pre-fills Award Miles, check-in toggle (session-scoped override, doesn't mutate the static guest data)

✅ Redemptions: full cross-guest list with a "Mark Fulfilled" toggle (session-scoped)

✅ `data/guests.js` expanded from 2 to 18 guests across 5 families (Shah, Mehta, Jain, Desai, Kothari), spread across the resort map's real zones/destination-city names already used in `data.js`, with varied seed balances (0 to 2,100 AR Miles) so the leaderboard and tier system have something real to show

## Preliminary Cleanup

✅ Deleted `src/services/passportService.js` — confirmed dead by grep (only self-reference) before removing, per this session's explicit instruction. The `COUNTRY_VISIT` transaction kind it depended on is still defined in `Transaction.js` but nothing creates one; left as-is since removing an unused enum entry wasn't asked for.

## Treasure Hunt / QR Missions

✅ `src/data/treasureHunt.js` — 15 hunt locations across 3 days (5/day), each with id, name, day, location, icon, hint, clueToNext, and milesReward (100–300 ✈). Helper functions: `getHuntLocation()`, `getFoundLocations()`, `alreadyFound()`, `markLocationFound()` — all stored in localStorage per guest (`ar_hunt_found_{guestId}`).

✅ `src/modules/hunt/HuntClaimScreen.js` — full-screen QR claim handler, 4 states: loading spinner (1 second), discovery (confetti + clue card + Claim button), already-found, invalid. Miles go through `MilesService.earn()`. Double-claim prevented by `alreadyFound()` before rendering. Viewers see discovery state but click → onboarding redirect (pending hunt survives auth flow).

✅ `src/modules/hunt/HuntPage.js` — hub page with header stats ("X / 15 found"), day tabs (Day 1 / Day 2 / Day 3), location cards (locked/found state), top-hunters mini-leaderboard (device-local, same architecture as main leaderboard), collapsible "How to play" section.

✅ `src/modules/hunt/HuntScreen.js` — router adapter. Manages active day tab state, resets to Day 1 on each fresh `show()`.

✅ `src/modules/hunt/hunt.css` — full module styles: claim screen (dark bg, gold typography, confetti keyframe animation for 20 pieces with varied delays/colors), hub page (day tab pill switcher, location cards with gold left-border on found state), top-hunters leaderboard, how-to-play `<details>` block, admin QR grid.

✅ `TX_KINDS.HUNT_DISCOVERY` added to `src/models/Transaction.js` — ledger-correct, immediately filterable.

✅ `🗺️ HUNT_DISCOVERY` icon added to `ActivityCard.js` KIND_ICONS — shows on the recent activity feed when a location is discovered.

✅ "Treasure Hunt" added to `QuickActions.js` — 9th quick action card with 🗺️ icon routing to `"hunt"`.

✅ QR code flow in `app.js` — `?hunt=HUNT-NNN` param stores hunt ID in `sessionStorage.ar_pending_hunt`, routes logged-in/viewer guests to `hunt-claim` immediately, routes unauthenticated guests to `onboarding` (pending hunt survives the flow).

✅ `OnboardingScreen.js` post-login redirect — after successful passport login, checks `ar_pending_hunt` in sessionStorage; if set, routes to `hunt-claim` instead of `home`.

✅ Admin QR Codes section (`AdminPage.js` + `AdminScreen.js`) — 5th nav item "QR Codes" in Ground Crew tool. Renders a grid of 15 cards each with a live QR image from `api.qrserver.com`, location info, and a "Print" button that opens a print-optimized popup (name, reward, QR at 400px, URL, auto-triggers `window.print()`).

✅ `index.html` — `screen-hunt` and `screen-hunt-claim` containers added; `hunt.css` linked.

## CSV Guest Import

✅ `src/utils/csvParser.js` — pure-JS CSV parser (no library); handles quoted fields, commas in quotes, double-quote escaping (`""`), Windows (`\r\n`) and Unix (`\n`) line endings, trailing empty rows

✅ `src/services/guestDatabaseService.js` — single source of truth for all guest records: `localStorage(ar_guest_db)` takes priority over `guests.js` fallback; `getAll()`, `getById()`, `getByPassport()`, `getFamilies()`, `getRooms()`, `parseCSVToGuests()`, `commitImport()`, `clearImported()`, `hasImportedData()`, `getImportMeta()`

✅ CSV format: `name, family, room, zone, phone, diet, passportNumber` — family + room resolved to IDs via case-insensitive lookup; missing passport auto-generated as `AR-{room}-{familyInitial}` with numeric suffix on collision; missing diet defaults to "Jain Vegetarian"; IDs continue from highest existing (`G{N+1}`)

✅ `authService.js` updated — `login()` and `getCurrentGuest()` now call `GuestDatabaseService.getAll()` at call time instead of using a module-level cached array; login works for imported guests immediately after import

✅ `passengerService.js` updated — `getAllPassengers()` and `getPassengerById()` delegate to `GuestDatabaseService.getAll()` at call time; DirectoryPage and MapScreen guest search automatically reflect imported data

✅ `leaderboardService.js` updated — `getOverall()`, `getByFamily()`, `getTodayLeaders()` all use `GuestDatabaseService.getAll()` instead of `rawGuests`

✅ Admin "Import Guests" — 6th nav item in Ground Crew tool; status card (🟢 LIVE / ⚪ MOCK, guest count, timestamp, clear button); "⬇ Download CSV Template" button (creates and downloads `ar-airways-guest-template.csv` with headers + 2 example rows); drag-and-drop + browse file input (`accept=".csv"`); parse-then-preview flow (summary stats, error list capped at 5, first-5-row table with human-readable names); "Confirm Import · N Guests" persists to localStorage; success state with "Import Another File"; clearing reverts to mock immediately

✅ `admin.css` extended — `.import-status-card` (with `--live` variant), `.import-dropzone` (dashed border, drag-over gold highlight), `.import-preview` (stats, error list, scrollable table), `.import-confirm-btn`, `.import-success` — plus belated `.admin-qr-*` styles for the QR Codes section

✅ Service worker bumped to `ar-airways-v7`; `csvParser.js` and `guestDatabaseService.js` added to APP_SHELL

## Guest Directory + "Take Me There" Navigation

✅ Guest Directory screen (`src/modules/directory/`) — searchable alphabetical list of all 18 guests; avatar circle with deterministic hue from `colorFromName()`, bold name, family label, gold room name + zone badge, "🗺 Map" button per card

✅ Viewer mode privacy: room and zone hidden (shown as "—"), no "Find on Map" button — names and families still visible so guests can greet each other

✅ Live search filter: case-insensitive match across name, family, and room fields; updates on every keystroke; "No guests found" empty state if no match

✅ "Find on Map 🗺" button: stores `room.name` in `sessionStorage.ar_map_highlight`, routes to map screen — works whether map was already mounted or is being visited for the first time

✅ Map highlight flow: `MapScreen.show()` reads and clears `ar_map_highlight`, matches room name against navFromSelect option text (e.g. "Bali" → "C29–C34 — Bali"), pans/zooms to polygon centroid via `flyTo()`, pulses a `drop-shadow` filter animation, clicks the polygon to open the popup — all within 750ms of `show()` firing

✅ Navigate FAB auto-fill: when the nav bottom sheet opens (via FAB), `#navFromSelect` is automatically set to the logged-in guest's own room cluster; "Your room · auto-filled" muted-gold label appears below. Viewer/unmatched room: label stays hidden, picker stays manual

✅ "Navigate Here" also auto-fills From on open (same `autoFillNavFrom()` helper)

✅ "Take Me There ✈" button in popup bottom sheet — logged-in only (hidden for viewers); closes popup, pre-fills both From (auto) and To (current hotspot), opens nav panel, fires `navGoBtn.click()` after 60ms — one-tap route from your room to any location on the map

✅ Map guest search: typing a name in the map search bar appends a "GUESTS" section below location results (after core `initSearch` results), showing up to 5 matches with room names and locIds; tapping a result closes the search bar, pans/zooms to the room polygon, opens the popup

✅ Dashboard Quick Actions: "👥 Guest Directory" tile added (10th action, routes to `"directory"`)

✅ Profile page: "👥 Browse Guest Directory" button above Sign Out; also present in the logged-out (viewer) state

✅ App wiring: `DirectoryScreen` registered in `app.js`; `#screen-directory` in `index.html`; `directory.css` linked; service worker bumped to `ar-airways-v6` with all 3 new directory files in `APP_SHELL`

## Map UI Remake

✅ New map-specific TopBar: left arrow (→ home), "Aayush Resort" / "Journey Map" center, search icon right — replaces the old bespoke `#topbar` that clashed with the guest app's design system

✅ Search bar slides down from the TopBar on demand (`#mapSearchBar`), auto-focuses `#searchInput`, X button clears and hides it — `search.js` engine unchanged, `.search-wrap` selector contract preserved

✅ Navigate FAB: `#navigateBtn` repurposed as a gold floating button (`position: fixed`, bottom-right above BottomNav) via CSS overrides — `navigation.js` onclick handler intact, no core change

✅ Navigate panel restyled as a bottom-sheet modal overlay: full-screen backdrop, `.map-nav-sheet` slides up from bottom, handle + title + close button. Backdrop click also closes. Destination pre-filled when opened via "Navigate Here" from popup.

✅ "Navigate Here" button added inside `#popupCard` — `MapScreen.js` tracks current popup location via secondary click listener on each hotspot polygon; clicking the button closes popup, pre-fills `#navToSelect`, opens nav modal

✅ Info popup (`#popupOverlay` / `#popupCard`) restyled as a bottom sheet via `map.css` overrides — drag handle replaces perforated strip, slides up, scrollable if content overflows

✅ Admin edit toolbar (`#editorTools`) moved from inline topbar to a full-width strip below the map TopBar — gear icon `#editorToggle` in TopBar right; `initOrganizerToggle()` contract unchanged

✅ Zoom controls repositioned to left side (`left: 16px`) to avoid overlapping the Navigate FAB on the right

✅ Filter panel (`#legend`) removed from visible UI; `.filter-chip` stubs kept in a hidden container so `initCategoryFilters` querySelectorAll returns the full set without throwing

✅ `#labelToggleBtn`, `#worldModeBtn`, `#homeBtn`, `#editorDivider` retained as hidden DOM stubs — `labels.js` / `zones.js` / `utilities.js` hold live references and would throw without them

✅ Touch scroll prevention: non-passive `touchmove` listener on `#viewport` prevents page bounce during map pan (complements the passive touch handlers already in `map.js`)

✅ `src/modules/map/map.css` created — all new chrome, zero changes to `src/modules/core/`

✅ Service worker bumped to `ar-airways-v5`; `map.css` added to `APP_SHELL`

## Map Polish

✅ Fix 1: Editor tools (`#editorToggle`, `#editorDivider`) hidden via `style.display = "none"` for all non-admin sessions. Check runs in both `mount()` and `show()` so it re-evaluates if admin auth changes during the session.

✅ Fix 2: Boarding pass `class` field now shows the guest's real tier name ("Explorer", "Silver Traveller", etc.) instead of the airline-class translation ("Economy"). Removed the `classFromTier()` indirection in `JourneyPage.js`.

✅ Fix 3: PassengerCard room field now formats as "Room 501 · Asia Zone" using `snapshot.profile.roomCottage` and `snapshot.profile.roomZone` (both already in the snapshot from PassengerService). Falls back to `room.name` if cottage is missing.

✅ Fix 4: BottomNav injected into `#screen-map` at mount — Map tab active, click handlers wired to Router. `#viewport` gets `paddingBottom: 64px` to prevent zoom controls from hiding behind the nav.

## PWA Shell

✅ Web App Manifest (`/manifest.json`) — name, short_name, description, standalone display, portrait orientation, dark background, gold theme colour, `lang: en`

✅ SVG icon fallback (`/icons/icon.svg`) — dark background, gold ✈ symbol, works in all modern browsers as the `any`-size manifest icon

✅ Icon generation script (`/scripts/generate-icons.js`) — Node.js/canvas script ready to run when real PNG icons are designed; outputs all 8 sizes (72–512px) into `/icons/`

✅ README in `/icons/` documenting the required sizes, design spec, and tools (maskable.app, realfavicongenerator.net)

✅ Service Worker (`/sw.js`) — Cache First for the entire app shell (~90 files), Network First with cache fallback for everything else, offline SPA fallback returns `/index.html` for navigation requests; push notification handlers wired up and ready for Firebase

✅ SW registration in `index.html` — standard `load` event listener, logs scope on success

✅ PWA meta tags in `index.html` — manifest link, theme-color, Apple mobile meta tags (apple-mobile-web-app-capable, status-bar-style, title), apple-touch-icon, mobile-web-app-capable

✅ Custom install prompt (`src/modules/pwa/InstallPrompt.js`) — captures `beforeinstallprompt`, delays 30 seconds, shows on-brand banner (dark panel, gold Install button, "Not now" link); "Install" triggers the deferred prompt, "Not now" sets `ar_install_dismissed` in localStorage; post-install toast; no-op if already standalone or previously dismissed

✅ `pwa.css` — banner slide-up/slide-down animations using CSS keyframes and design tokens; post-install toast with fade transition; correctly positioned 74px above the BottomNav

✅ `?route=` shortcut handling in `app.js` — `/?route=events` and `/?route=map` deep-link directly to those screens for logged-in guests; viewers land on Home as usual

✅ `config.js` — `pwa` block with `cacheName`, `cacheVersion`, `installDismissedKey`

## Guest Onboarding / Auth

✅ Real passport-number login replaces the permanent `Abhishek Shah` hardcode. Every guest now has a unique `passportNumber` (`AR-[cottage]-[FAMILY_INITIAL]`, numeric suffix on collisions), checked case-insensitively and whitespace-trimmed against `data/guests.js`.

✅ Two-tier access via `AuthService` (single source of truth — no screen reads `localStorage` directly): full login, Viewer mode ("browse without a personalised experience"), or neither (first-visit onboarding). Login persists in `localStorage` across reloads; viewer mode does too.

✅ Full-screen onboarding — premium check-in-counter styling, auto-uppercase passport input, Enter-to-submit, inline error state, brief fade before handoff to Home.

✅ Every screen respects the two-tier table: Rewards (catalogue locked, leaderboard read-only for everyone), Passport (all stamps force-locked), Profile (generic "not logged in" state, still carries the hidden admin trigger), Journey's boarding pass (dashes instead of identity, no miles), Dashboard (miles/tier/activity hidden, generic prompt shown instead).

✅ Sign Out (bottom of Profile, confirm dialog) clears auth state and returns to onboarding.

✅ Fixed a real bug this feature exposed: `GuestAppScreen` used to render `HomePage()` once at mount and never again, and `HomePage()` self-subscribed to `miles:changed` on every call with no unsubscribe. Harmless while "current guest" was permanently hardcoded; a real stale-data-plus-listener-leak bug once Sign Out → different login became possible. Fixed by moving the live-update subscription into `GuestAppScreen` (once, at mount) and re-rendering fully on every `show()`, matching every other screen's pattern.

✅ `TopBar.js` (not explicitly in scope, but hardcoded "Abhishek Shah" on every single guest screen) now shows the real current guest or "Guest Viewer", with a dynamic avatar reusing the same deterministic-hue helper as Leaderboard/Profile.

---

# Current Sprint

Sprint 002

Objective

Refactor the codebase into a scalable architecture.

Tasks

- [ ] Modular folder structure
- [ ] Config module
- [ ] Constants module
- [ ] Services layer
- [ ] Utility helpers
- [ ] Remove duplicate code
- [ ] Documentation
- [ ] Maintain existing functionality

Status

🟡 In Progress

---

# Next Sprint

Sprint 003

Passenger System

Deliverables

- Guest data model
- Passenger profile
- Mock guest data
- Home dashboard foundation

Status

⬜ Planned

---

# Known Issues

## High

None

---

## Medium

Search can be improved.

Tree density on map needs balancing.

---

## Low

Minor UI polish.

Accessibility review pending.

Performance audit pending.

Admin's check-in and redemption-fulfilled overrides live in sessionStorage, same as PIN auth — closing the tab resets them (miles ledger itself is untouched, since that's in localStorage via the normal ledger path). Fine for a 3-day event as specified, but means two organisers on two devices won't see each other's check-in/fulfilled marks — there's no shared backend yet.

---

# Technical Debt

Need modular architecture.

Need backend abstraction.

Need centralized configuration.

Need API layer.

---

# AI Workflow

Product Vision

Abhishek

Architecture

ChatGPT

Implementation

Codex

UX / UI

Claude

Testing

Abhishek

Deployment

Cloudflare Pages

---

# Upcoming Milestones

Sprint 003

Passenger System

Sprint 004

Home Dashboard

Sprint 005

Boarding Pass

Sprint 006

Passport

Sprint 007

Backend

Sprint 008

AR Miles

---

# Launch Checklist

Interactive Map

✅ Guest Login

⬜ Home Dashboard

✅ Profile

✅ Boarding Pass

✅ Passport

✅ Events

⬜ AR Miles

✅ Rewards

✅ Leaderboards

✅ Admin Dashboard

✅ PWA (installable, offline-capable)

✅ QR Missions / Treasure Hunt

⬜ Analytics

⬜ Performance Testing

⬜ Security Review

⬜ Wedding Launch

---

# Notes

The project has transitioned from an interactive wedding map into a complete digital wedding companion.

All future development should strengthen the central travel narrative and integrate with the AR Airways ecosystem.
