# Session 17 Report — UX Simplification + Bug Fixes

**Date:** 13 July 2026
**Branch:** develop → main
**Service Worker:** ar-airways-v28

---

## Summary

Two distinct workstreams in one session: four targeted bug fixes from pre-session QA, then a full UX Simplification pass covering viewer-default onboarding, the new "What's On Now" dashboard widget, simplified Quick Actions grid, and dashboard layout reorder.

---

## Bug Fixes (Pre-UX)

### Fix 1 — Concierge Bell Missing for First-Time Users
**File:** `src/app.js`
**Root cause:** `injectConciergeButton()` was called once at startup, but the button requires the `#concierge-btn` container injected by `HomePage()`. First-time users hit the early-return path (unauthenticated) before any screen rendered — so the call was a no-op.
**Fix:** Added `AppStore.on("route:changed", injectConciergeButton)` so the bell is injected after every navigation. The function is idempotent (checks for existing `#concierge-btn`), so re-runs are safe.

### Fix 2 — Map TopBar Missing Search Icon
**File:** `src/modules/map/MapScreen.js`
**Root cause:** The 🔍 icon to toggle `#mapSearchBar` was never programmatically added to `.top-right` in the map's bespoke TopBar.
**Fix:** In `mount()`, after the TopBar renders, a `🔍` button is inserted into `.top-right` via `insertBefore`. Click toggles `bar.hidden` and auto-focuses `#searchInput`.

### Fix 3 — Guest Directory BottomNav Taps Doing Nothing
**File:** `src/modules/directory/DirectoryScreen.js`
**Root cause:** `wireEvents()` used `container.querySelector("[data-route]")` (singular) — only wired the first `[data-route]` button. BottomNav tabs after the first were silently ignored.
**Fix:** Changed to `container.querySelectorAll("[data-route]").forEach(...)`.

### Fix 4 — Admin Custom Amount Input Reversed Digits (0001 → 1000)
**File:** `src/modules/admin/AdminPage.js`
**Root cause:** Input was `type="number"`. On each re-render the screen tried to restore cursor position via `setSelectionRange`, but `type="number"` throws `InvalidStateError` — cursor landed at position 0, so each new digit was inserted before the previous ones.
**Fix:** Changed to `type="text" inputmode="numeric" pattern="[0-9]*"`. Text inputs allow `setSelectionRange` normally; the `inputmode` keeps the numeric keyboard on mobile.

---

## UX Simplification

### Part A — Viewer Mode as Default
**Files:** `src/app.js`, `src/modules/onboarding/OnboardingPage.js`, `src/modules/onboarding/OnboardingScreen.js`, `src/modules/onboarding/onboarding.css`

- **`app.js`:** On first open with no auth state, calls `AuthService.loginAsViewer()` silently instead of redirecting to onboarding. Then routes straight to `home`. No flash, no redirect.
- **`OnboardingPage.js`:** Removed `divider()` and `viewerAccess()` functions. Added a `"Maybe later"` `data-route="home"` button below the passport-entry CTA.
- **`OnboardingScreen.js`:** Removed `continueAsViewer()` function. Added `querySelectorAll("[data-route]")` delegation to handle the new "Maybe later" button.
- **`onboarding.css`:** Removed `.onboarding__divider`, `.onboarding__viewer-wrap`, `.onboarding__viewer`, `.onboarding__viewer-subtitle`. Added `.onboarding__later-wrap` and `.onboarding__later` (muted text link style).

**Onboarding is now reach-only** — users only see it when they tap "Board Your Flight →" from the login banner.

### Part B — "What's On Now" Widget
**File:** `src/modules/dashboard/WhatsOnNow.js` (NEW)

Pure render function, no state, no subscriptions. Handles all time states:

| State | Trigger | Visual |
|-------|---------|--------|
| Pre-wedding | Today < Jan 22 2027 | "Journey begins in N days" — UP NEXT grey |
| Starting Soon | ≤ 30 min before event | STARTING SOON amber + `won-pulse` animation |
| Happening Now | Event in-flight | HAPPENING NOW green + `dot-pulse` dot |
| Up Next | Next future event | UP NEXT grey |
| All events done | Post-last-event, still wedding week | Celebrate state |
| Post-wedding | After Jan 25 2027 | "Journey complete" farewell |

Navigate button uses `data-route="map"` — handled by `GuestAppScreen.bindRoutes()`.

**`sw.js`** bumped to `ar-airways-v28` with `WhatsOnNow.js` added to `APP_SHELL`.

### Part C — Simplified Quick Actions
**File:** `src/modules/dashboard/QuickActions.js` (REWRITTEN)

- **4 primary tiles** always visible in a 2-col grid: Map, Events, My Room, Leaderboard
- **6 secondary tiles** in a collapsible `#qa-more-grid` div: Treasure Hunt, Rewards, Passport, Guest Directory, Profile, Settings
- **"More ✈ ▾" / "Less ▴" toggle button** with `data-qa-toggle` attribute
- Pure CSS class toggle: `#qa-more-grid.expanded { display: grid; }` — no JS re-render, no Router call

Toggle handler in `GuestAppScreen.js`:
```js
const open = grid?.classList.toggle("expanded");
btn.innerHTML = open ? `Less <span>▴</span>` : `More ✈ <span>▾</span>`;
```

### Part D — Dashboard Layout Reorder
**File:** `src/modules/dashboard/HomePage.js` (REWRITTEN)

New layout order (top to bottom):
1. TopBar
2. Login Banner (viewer only, dismissible for 24h)
3. What's On Now widget
4. Quick Actions (primary + expandable more)
5. Passenger Card
6. Today's Journey
7. Recent Activity (sidebar / below on mobile)
8. BottomNav

**Login Banner:**
- Shows only for non-logged-in (viewer) users
- Dismissed by clicking ✕ → stores `Date.now()` in `localStorage["ar_login_banner_dismissed"]`
- Stays dismissed for 24 hours (TTL check in `isBannerDismissed()`)
- "Board Your Flight →" routes to onboarding

**`GuestAppScreen.js`** updated:
- Banner dismiss handler: writes timestamp to localStorage, removes `.login-banner` from DOM
- QA toggle handler: CSS class flip + innerHTML update

**`dashboard.css`** additions:
- `.login-banner` (gold border, gradient bg, flex layout with cta + dismiss)
- `.whats-on-now` with `--live` (green), `--soon` (amber + animation), `--next` (grey) variants
- `.won-status`, `.won-dot`, `.won-event-name`, `.won-meta`, `.won-navigate`
- `@keyframes dot-pulse` and `@keyframes won-pulse`
- `.quick-actions__grid` (2-col), `.quick-actions__more-grid` (hidden), `.quick-actions__more-grid.expanded`, `.quick-action--more`

---

## Verification

All checks run via `javascript_tool` against the live preview:

| Check | Result |
|-------|--------|
| `#qa-more-grid` initial display | `none` ✅ |
| `.login-banner` visible | `true` ✅ |
| `WhatsOnNow` class | `whats-on-now whats-on-now--next` ✅ |
| `WhatsOnNow` text | "Begins in 193 days" ✅ |
| More toggle → expanded | `display: grid`, btn "Less ▴" ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `sw.js` | Bumped to v28, added WhatsOnNow.js to APP_SHELL |
| `src/app.js` | Auto-loginAsViewer on first open; AppStore subscription for concierge bell |
| `src/modules/onboarding/OnboardingPage.js` | Removed viewer option, added "Maybe later" |
| `src/modules/onboarding/OnboardingScreen.js` | Removed continueAsViewer, added [data-route] delegation |
| `src/modules/onboarding/onboarding.css` | Removed viewer CSS, added .later styles |
| `src/modules/dashboard/WhatsOnNow.js` | NEW — all-states pure render |
| `src/modules/dashboard/QuickActions.js` | Rewritten — 4 primary + expandable more |
| `src/modules/dashboard/HomePage.js` | Rewritten — LoginBanner + new layout |
| `src/modules/dashboard/GuestAppScreen.js` | Dismiss handler + qa-toggle handler |
| `src/modules/dashboard/dashboard.css` | Login banner, WhatsOnNow, QuickActions CSS |
| `src/modules/map/MapScreen.js` | Added 🔍 search toggle to map TopBar |
| `src/modules/directory/DirectoryScreen.js` | querySelector → querySelectorAll for BottomNav |
| `src/modules/admin/AdminPage.js` | Custom amount input: type=number → type=text inputmode=numeric |
