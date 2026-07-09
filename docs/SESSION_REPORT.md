# Session Report — Cache Bust + Local Notifications

Date: 10 July 2026
Scope: v2 CSS cache bust across all stylesheets; browser-native local notification system with bell UI

---

## Task 1 — Cache Bust / v2 Stamp

**Goal:** Force CDN and browser caches to serve fresh CSS after previous-session UI changes.

**What changed:**
- Added `/* v2 */` as the very first line of every CSS file:
  `style.css`, `dashboard.css`, `events.css`, `journey.css`, `rewards.css`,
  `passport.css`, `profile.css`, `hunt.css`, `admin.css`, `onboarding.css`, `pwa.css`
- Verified `html, body` has no `overflow: hidden` (removed in a prior session; remaining `overflow: hidden` uses are all correctly-scoped containers).
- SW `CACHE_NAME` was already `ar-airways-v2` — no bump needed here.

---

## Task 2 — Local Notifications (Bell + Flight Reminders)

**Goal:** Browser-native push-free event reminders. No Firebase, no SW push, no external services.

### New files

| File | Purpose |
|---|---|
| `src/modules/notifications/NotificationService.js` | Core service: permission request, setTimeout scheduling, history, badge refresh, panel |
| `src/modules/notifications/notifications.css` | Bell badge + dropdown panel styles |

### Modified files

| File | Change |
|---|---|
| `src/components/layout/TopBar.js` | Bell button with `data-notif-toggle`; inline badge reads `getHistory().length` |
| `src/modules/onboarding/OnboardingScreen.js` | Calls `requestPermission()` after successful passport login |
| `src/modules/profile/ProfileScreen.js` | Calls `clearAll()` before `AuthService.logout()` on sign-out |
| `src/app.js` | Imports and calls `initBell()` at app startup |
| `index.html` | `<link>` for `notifications.css` added before `</head>` |
| `sw.js` | Bumped to `ar-airways-v3`; added notification files to `APP_SHELL` |

### Architecture decisions

**Event delegation over per-render binding** — `TopBar()` is a pure string function called on every `show()`. Rather than wiring the bell on each render, `initBell()` registers a single `document.addEventListener("click", ...)` at startup. The handler matches `[data-notif-toggle]` wherever it appears, surviving repeated TopBar re-renders.

**Panel appended to `document.body`** — Avoids clipping by `overflow: hidden` on screen `<div>`s. Positioned with `getBoundingClientRect()` on the bell button.

**Badge freshness two ways** — TopBar reads `getHistory().length` at render time for the initial count. `_refreshBadge()` also runs after each timer fires to update the badge in the live DOM without re-rendering TopBar.

**IST timezone** — Events parsed as `new Date(\`${ev.date}T${ev.startTime}:00+05:30\`)` so timers fire at the correct local time regardless of device timezone.

**Two notifications per event:**
- 30 min before start: `"{icon} {name} boards in 30 minutes — Head to {venue} 🛫"`
- At start: `"{icon} {name} has begun ✈"`

**History** — Last 10 notifications stored in `localStorage` under `ar_notification_history`. Shown in panel newest-first. Cleared on sign-out via `clearAll()`.

**SW cache bump to v3** — New JS/CSS files added to `APP_SHELL` so the notification feature works fully offline after first load.
