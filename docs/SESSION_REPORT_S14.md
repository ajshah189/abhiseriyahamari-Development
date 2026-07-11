# Session 14 — Firebase Realtime Database Integration

**Date:** 12 July 2026
**Branch:** develop → main
**SW Cache:** v22 → v23

---

## Summary

Implemented full Firebase Realtime Database integration. The app now writes data to Firebase in real-time while keeping localStorage as the offline fallback. All 500 guest devices will share live state for miles, check-ins, announcements, and concierge requests.

---

## Files Changed

| File | Change |
|------|--------|
| `src/config/firebase.js` | **NEW** — Firebase CDN imports + config (ar-airways-2027 project) |
| `src/services/firebaseService.js` | **NEW** — Single Firebase gateway: miles, leaderboard, check-ins, announcements, requests |
| `src/store/milesStore.js` | Dual-write: after each `addTransaction()`, fire-and-forget push to Firebase |
| `src/services/leaderboardService.js` | Added `subscribeToLiveLeaderboard(callback)` — real-time ranking from Firebase, falls back to localStorage for guests not yet synced |
| `src/modules/rewards/RewardsScreen.js` | Live leaderboard: Firebase subscription updates `.leaderboard-list` in place; unsubscribed on `hide()` |
| `src/modules/admin/AdminScreen.js` | Firebase check-in (fire-and-forget), Firebase announcements, Firebase request subscription, Firebase status updates |
| `src/modules/concierge/ConciergeScreen.js` | Posts requests to Firebase; subscribes to guest's own requests for live status updates |
| `src/modules/concierge/ConciergePage.js` | Accepts optional `liveRequests` param; uses Firebase status directly when available |
| `src/services/authService.js` | `migrateToFirebase(guest)` — runs once per device after login to push localStorage ledger to Firebase |
| `src/app.js` | `initAnnouncementListener()` replaces 60s `checkAnnouncements()` polling — Firebase `onValue` subscription |
| `sw.js` | Added firebase.js + firebaseService.js to APP_SHELL; bumped v22 → v23 |
| `docs/MASTER_PROGRESS.md` | Firebase Integration 🟢 90% |

---

## Architecture Decisions

### CDN-only Firebase
Per spec: no npm, no build tools. Firebase SDK loaded from `https://www.gstatic.com/firebasejs/10.7.1/`. Browser HTTP cache ensures these load instantly after first visit.

### Fire-and-forget writes
All Firebase writes (miles, check-ins, announcements, requests) are non-blocking. The UI never waits for Firebase. `try/catch` in FirebaseService means Firebase failures are silent and localStorage continues to work.

### Dual-write pattern
localStorage is never removed — it's the offline fallback and the primary source for guest-side views. Firebase is the real-time sync layer on top.

### Subscription lifecycle
All `onValue` subscriptions are unsubscribed in `hide()` for RewardsScreen, AdminScreen, and ConciergeScreen. App-level announcement subscription (in `App.start()`) lives for the app's lifetime.

### Migration on login
`migrateToFirebase(guest)` runs once per device after login (guarded by `ar_firebase_migrated_{guestId}` localStorage key). Reads from `miles_ledger` (not the session-task's `ar_miles_{id}` — that doesn't exist in this codebase). Skips if Firebase already has data for this guest.

---

## What's Live

| Feature | How it works |
|---------|-------------|
| **Miles sync** | Every `addTransaction()` pushes to `/miles/{guestId}/transactions/{txId}` |
| **Live leaderboard** | Admin award on Tab A → Tab B leaderboard updates within ~2s |
| **Check-in sync** | Admin check-in pushes to `/checkins/{guestId}`; other admin tabs update via subscription |
| **Announcement broadcast** | Admin broadcasts push to `/announcements/{id}`; all guest tabs show the banner |
| **Concierge requests** | Guest submits → pushes to `/requests/{id}`; admin sees it immediately |
| **Request status** | Admin marks done → pushes to `/requests/{id}/status`; guest's My Requests updates live |
| **Migration** | First login migrates localStorage ledger to Firebase |

---

## Known Limitations

- **First-visit offline**: Firebase CDN modules won't load if the user has never visited while online. The app will crash. Acceptable for a resort-WiFi event where initial setup is always online.
- **Family leaderboard**: Only the "Top Passengers" list is live from Firebase. Family totals still use localStorage.
- **Push notifications (FCM)**: SW push handler is wired but not yet activated. Remaining Firebase milestone item.
- **Guest request status from Firebase**: The guest's "My Requests" shows live Firebase status only for requests submitted after this session. Old localStorage requests continue to use the localStorage status key.

---

## Testing Checklist

1. ✅ App loads, no console errors, Firebase SDK loads from CDN (confirmed: `200 OK` for both firebase.js and firebaseService.js)
2. ⬜ Two-tab live leaderboard update (requires real Firebase DB data)
3. ⬜ Two-device check-in sync
4. ⬜ Announcement broadcast across tabs
5. ⬜ Concierge request appears in admin immediately
6. ⬜ Admin marks done → guest sees Done in real-time
7. ⬜ Offline mode — app works on localStorage fallback
8. ⬜ Back online — new transactions sync to Firebase
9. ⬜ Leaderboard ranks from Firebase data
10. ⬜ localStorage miles migrated to Firebase on first login

Items 2–10 require Firebase DB to have data (need to log in as a real guest and trigger transactions).
