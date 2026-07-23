# Session 21 — Full Codebase Audit + Bug Fixes

**Date:** 2026-07-23  
**Duration:** ~2 context windows (continued from S20 context)  
**SW Cache:** `ar-airways-v33`

---

## Goal

Complete professional codebase audit: read every file, compile a 10-category report, fix all confirmed issues, bump SW cache, commit, push, merge to main.

---

## Files Read

Every file in the project was read top-to-bottom across two sessions:
- All `docs/` progress and session reports
- `src/app.js`, `src/router.js`, `src/config/firebase.js`, `src/config.js`
- All `src/services/` files (7 services)
- All `src/store/` files (2 stores)
- All `src/modules/` subdirectories (admin, chronicle, concierge, dashboard, directory, events, hunt, journey, leaderboard, map, notifications, onboarding, passport, profile, pwa, rewards, settings, shared, social, splash, tv)
- All `src/data/` files (events, families, guests, passport, rewards, rooms, treasureHunt)
- All `src/models/` and `src/utils/` files
- All `src/components/` files
- Root files: `index.html`, `sw.js`, `script.js`, `firebase-messaging-sw.js`

Full audit report saved to: `docs/AUDIT_REPORT.md`

---

## Bugs Found and Fixed

### 1. Concierge `guestId` always undefined (Critical)
**Files:** `src/modules/concierge/ConciergePage.js:45`, `src/modules/concierge/ConciergeScreen.js:53,118`  
`snapshot.guestId` → `snapshot.profile?.id`  
Impact: all concierge requests saved with `guestId: undefined`; "My Requests" section always empty; Firebase subscription returned nothing.

### 2. TV Leaderboard family standings always show "0" (Critical)
**File:** `src/modules/tv/TVLeaderboardScreen.js:59`  
`f.total` → `f.totalBalance`  
Impact: Family Standings column on the projector screen always showed "0" for every family.

### 3. Dead code — `checkAnnouncements()` (Non-critical)
**File:** `src/app.js:248–264`  
Removed the function. It was superseded by `initAnnouncementListener()` using Firebase, never called anywhere.

### 4. Concierge button not removed on logout (Non-critical)
**File:** `src/app.js`  
`injectConciergeButton()` now removes `#concierge-btn` when `!AuthService.isLoggedIn()`. Triggered on every `route:changed` event, so cleanup happens automatically on the first navigation after sign-out.

### 5. Firebase notification subscription leak + missing lazy-init (Non-critical)
**File:** `src/app.js`  
Added `_syncNotificationListener()` called on every `route:changed`. It:
- Starts the subscription if the guest just logged in (was a viewer at boot)
- Stops and cleans up the subscription if the guest just logged out

### 6. SW cache missing hunt module files (Non-critical)
**File:** `sw.js`  
Added to APP_SHELL: `/src/data/treasureHunt.js`, `/src/modules/hunt/HuntPage.js`, `/src/modules/hunt/HuntScreen.js`, `/src/modules/hunt/HuntClaimScreen.js`, `/src/modules/hunt/hunt.css`  
Cache bumped: `ar-airways-v32` → `ar-airways-v33`

### 7. `config.js` stale pwa.cacheName and feature flags (Non-critical)
**File:** `src/config.js`  
`cacheName`: `"ar-airways-v1"` → `"ar-airways-v33"`  
`cacheVersion`: `1` → `33`  
All feature flags set to `true` (passport, boardingPass, arMiles, rewards, leaderboard, treasureHunt, notifications).

---

## Not Fixed

- **Weather hardcoded in TopBar.js** — no weather API to wire it to. Known placeholder.
- **`guests.js` static fallback has wrong roomId format** — requires organiser to provide real guest-room assignments. Flagged in AUDIT_REPORT.md.

---

## Commit

```
audit(S21): full codebase audit — fix concierge guestId, TV family standings, notif leak, SW cache
```

Files changed:
- `src/modules/concierge/ConciergePage.js`
- `src/modules/concierge/ConciergeScreen.js`
- `src/modules/tv/TVLeaderboardScreen.js`
- `src/app.js`
- `sw.js`
- `src/config.js`
- `docs/AUDIT_REPORT.md` (new)
- `docs/SESSION_REPORT_S21.md` (new)
- `docs/MASTER_PROGRESS.md`
