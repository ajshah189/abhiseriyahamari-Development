# AR Airways — Full Codebase Audit Report
**Date:** 2026-07-23  
**Session:** S21  
**Auditor:** Claude Sonnet 4.6  
**Scope:** All files read top-to-bottom (docs → entry points → services → stores → modules → data → root)

---

## Executive Summary

Total confirmed bugs: **10 issues across 6 files.**  
4 are critical (breaks user-visible functionality).  
6 are non-critical (dead code, subscription leaks, stale config, missing SW cache entries).

---

## Category 1 — Broken Imports

**Result: NONE FOUND.**

All import paths use correct `.js` extensions and relative paths. Every imported symbol exists in its target file. The `src/constants.js` file is listed in the SW cache — verify it exists at the filesystem level before shipping (not read during audit as it wasn't imported by anything audited).

---

## Category 2 — Dead Code

### ISSUE-001 · Dead function `checkAnnouncements()` in `app.js`

**File:** `src/app.js:248–264`  
**Status:** Dead — never called anywhere.

`checkAnnouncements()` reads from `localStorage.getItem("ar_announcements")` and calls `showAnnouncementBanner()`. It was the old polling-based approach, superseded by `initAnnouncementListener()` which uses Firebase `onValue`. The new function is called at line 142; the old one is not called anywhere.

**Fix:** Delete lines 248–264 from `app.js`.

---

## Category 3 — Console Errors

**Result: NO CRASHES ON LOAD.**

- `script.js:85,87` — Two `console.log` calls (`"1 - script.js loaded"`, `"3 - App.start() returned"`) fire in production. Benign.
- `MapScreen.js:458` — `console.log("AR Airways map initialized...")` fires in production. Benign.
- No code paths throw on normal use.

---

## Category 4 — Incomplete Implementations

### ISSUE-002 · `config.js` has stale `pwa.cacheName` and all feature flags disabled

**File:** `src/config.js`  
`pwa.cacheName: "ar-airways-v1"` is 31 versions behind the actual SW (`ar-airways-v32`). Feature flags for `passport`, `boardingPass`, `rewards`, `leaderboard`, `treasureHunt`, `notifications` are all `false` despite all these features being fully built and deployed.

**Risk:** Any code gating on these flags (e.g., `AuthService.hasAccess()`) could incorrectly restrict features. However, `hasAccess()` uses its own internal `FULL_FEATURES` and `VIEW_FEATURES` arrays — it does NOT read `config.js` flags — so the impact is limited to `config.js` itself being misleading documentation and the stale `cacheName` being wrong if code ever reads it programmatically.

**Fix:** Update `pwa.cacheName` to `"ar-airways-v33"` (to match the post-fix SW version) and set all flags to `true`.

### ISSUE-003 · Weather is hardcoded in `TopBar.js`

**File:** `src/components/layout/TopBar.js:54`  
`<div class="weather">☀️ 29°C</div>` — hardcoded, not dynamic.

**Assessment:** Known placeholder. Low priority. Not fixing in this session (no weather API is wired up).

---

## Category 5 — UI Inconsistencies

**Result: NO ISSUES.**

- Every screen with a `data-route` navigation pattern uses `TopBar()` and `BottomNav()`.
- `DirectoryPage.js` uses a custom `directory-topbar` header with a back button — this is intentional (the profile-back pattern, not the main nav pattern).
- `HuntClaimScreen.js` has no TopBar/BottomNav — intentional full-screen QR claim overlay.
- `ComingSoonScreen.js` renders into `screen-placeholder` — correct per the Router registration.

---

## Category 6 — Firebase Issues

### ISSUE-004 · **CRITICAL** Concierge requests always saved with `guestId: undefined`

**Files:** `src/modules/concierge/ConciergeScreen.js:53`, `src/modules/concierge/ConciergePage.js:45`

**Root cause:** `PassengerService.getCurrentSnapshot()` returns:
```js
{ isViewer, profile: { id, passengerName, ... }, balance, tier, ... }
```
There is **no top-level `guestId` key**. The guest ID lives at `snapshot.profile.id`.

Both files read `snapshot.guestId` (or `snapshot?.guestId`) which is always `undefined`.

**Impact:**
- Every concierge request is saved to localStorage with `guestId: undefined` → the guest's "My Requests" history filter `r.guestId === guestId` returns nothing (both are `undefined`, which works) BUT the Firebase push (`FirebaseService.postRequest({ guestId: undefined, ... })`) stores the request under the wrong path.
- `getMyRequests(undefined)` short-circuits with `if (!guestId) return []` — so the "My Requests" section is **always empty**.
- `subscribeToGuestRequests(undefined, ...)` in `_startRequestsSubscription()` returns no results.

**Fix:** Change all three occurrences to `snapshot?.profile?.id` / `snapshot.profile?.id`.

### ISSUE-005 · Firebase notification subscription leaks on logout

**File:** `src/app.js:229–244`

`initNotificationListener()` sets `_notifUnsub` but this is never called. On logout, the Firebase `onValue` listener for the guest's notification path keeps running indefinitely.

Additionally, if a viewer logs in mid-session (via OnboardingScreen), `initNotificationListener()` was only called at boot with `getCurrentGuest() === null` → returns immediately → the newly logged-in guest never gets a notification subscription started.

**Fix:** Add lazy-init + cleanup logic to the `route:changed` AppStore handler in `app.js`.

---

## Category 7 — SW Cache

### ISSUE-006 · Hunt files missing from `APP_SHELL` in `sw.js`

**File:** `sw.js:24–235`

The Treasure Hunt module (`HuntPage.js`, `HuntScreen.js`, `HuntClaimScreen.js`, `hunt.css`, `treasureHunt.js`) is fully wired in `app.js` and `index.html`, but none of its files appear in the SW `APP_SHELL` list. Offline use of the Hunt feature will fail silently (network fetch or 404).

Missing entries:
```
/src/data/treasureHunt.js
/src/modules/hunt/HuntPage.js
/src/modules/hunt/HuntScreen.js
/src/modules/hunt/HuntClaimScreen.js
/src/modules/hunt/hunt.css
```

Also: `CACHE_NAME` needs bumping to `ar-airways-v33` after all fixes land.

**Fix:** Add missing entries and bump cache name.

---

## Category 8 — Mobile Issues

**Result: NO SPECIFIC ISSUES FOUND.**

Pull-to-refresh is wired on the main dashboard, events, and rewards screens. The map screen prevents page scroll during touch pan. BottomNav is fixed-position across all screens.

---

## Category 9 — Auth Edge Cases

### ISSUE-007 · Concierge button not removed when guest logs out

**File:** `src/app.js:191–201`

`injectConciergeButton()` injects a `#concierge-btn` element once for logged-in guests. It early-returns if the button already exists (`if (document.getElementById("concierge-btn")) return`). It also early-returns if not logged in. But it **never removes** an existing button.

When a guest logs out → routes to onboarding → `route:changed` fires → `injectConciergeButton()` is called → sees `!AuthService.isLoggedIn()` → returns immediately → **the button stays in the DOM**. Viewers see the concierge bell.

**Fix:** Add `document.getElementById("concierge-btn")?.remove()` to the `!AuthService.isLoggedIn()` branch.

### ISSUE-008 · Firebase notification listener not started for viewer-then-login flow

**File:** `src/app.js:232–244`

See ISSUE-005. Same fix covers both.

---

## Category 10 — Data Inconsistencies

### ISSUE-009 · **CRITICAL** TV Leaderboard family standings always show "0"

**File:** `src/modules/tv/TVLeaderboardScreen.js:59`

`renderFamilyList()` renders `fmtMiles(f.total)` but `LeaderboardService.subscribeToLiveFamilyLeaderboard()` returns objects with key `totalBalance`, not `total`. `f.total` is always `undefined` → `fmtMiles(undefined)` returns `"0"`.

The guest leaderboard column correctly uses `g.balance` and `FamilyRow` in `LeaderboardCard.js` correctly uses `entry.totalBalance` — only the TV screen has the wrong key name.

**Fix:** Change `f.total` → `f.totalBalance` at `TVLeaderboardScreen.js:59`.

### ISSUE-010 · `guests.js` static fallback has wrong `roomId` format

**File:** `src/data/guests.js`

Static guest records use `roomId: "R101"` format, but `rooms.js` defines IDs as `"501"`, `"E-1"`, `"C-2"`, etc. The `"R"` prefix doesn't match anything in ROOMS. If `GuestDatabaseService` ever falls back to `guests.js` (localStorage is empty), room lookups for all guests will fail silently.

**Assessment:** In practice, the CSV import populates localStorage early in onboarding, so this fallback is rarely hit in production. The fix (updating all roomId values in guests.js) requires knowing the real room assignments, which the organiser manages. Flagging as a **known data inconsistency** rather than fixing blind.

---

## Summary of Fixes Applied This Session

| # | File | Issue | Status |
|---|------|-------|--------|
| ISSUE-001 | `src/app.js` | Remove dead `checkAnnouncements()` | FIXED |
| ISSUE-002 | `src/config.js` | Update cacheName + feature flags | FIXED |
| ISSUE-004 | `src/modules/concierge/ConciergePage.js:45` | `guestId` → `profile?.id` | FIXED |
| ISSUE-004 | `src/modules/concierge/ConciergeScreen.js:53,118` | `guestId` → `profile?.id` | FIXED |
| ISSUE-005 | `src/app.js` | Fix `_notifUnsub` leak + lazy init | FIXED |
| ISSUE-006 | `sw.js` | Add hunt files, bump cache to v33 | FIXED |
| ISSUE-007 | `src/app.js` | Remove concierge-btn on logout | FIXED |
| ISSUE-009 | `src/modules/tv/TVLeaderboardScreen.js:59` | `f.total` → `f.totalBalance` | FIXED |

| # | File | Issue | Status |
|---|------|-------|--------|
| ISSUE-003 | `TopBar.js` | Hardcoded weather | NOT FIXED (no API) |
| ISSUE-010 | `src/data/guests.js` | Wrong roomId format | NOT FIXED (requires organiser data) |
