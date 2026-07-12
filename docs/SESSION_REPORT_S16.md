# Session 16 — FCM Push Notifications + Family Leaderboard Firebase Sync

**Date:** 12 July 2026
**Branch:** develop → main
**SW Cache:** v24 → v25

---

## Summary

Two features added this session:

**Part A:** Family leaderboard now syncs in real time from Firebase Realtime Database. The static `getByFamily()` call is supplemented by a live `subscribeToLiveFamilyLeaderboard()` subscription that patches the family list DOM without a full re-render.

**Part B:** Firebase Cloud Messaging wired up for push notification token registration. Guests are asked for notification permission immediately after login. Tokens are saved to Firebase under `fcm_tokens/{guestId}`. Foreground messages (app open) are handled with an in-app banner. Background push (app closed / screen locked) is architecturally ready but requires a Cloud Functions backend to call FCM's send API — documented below.

---

## Files Changed

| File | Change |
|------|--------|
| `src/services/leaderboardService.js` | Added `_getLocalBalance()` helper + `subscribeToLiveFamilyLeaderboard()` |
| `src/modules/leaderboard/LeaderboardPage.js` | Added `family-leaderboard-list` class to family list container |
| `src/modules/rewards/RewardsScreen.js` | Added FamilyRow import, `startLiveFamilyLeaderboard()`, `stopLiveFamilyLeaderboard()`, wire in render/hide |
| `src/config/firebase.js` | Added FCM imports (`getMessaging`, `getToken`, `onMessage`), `messaging` instance, `VAPID_KEY` placeholder |
| `src/services/fcmService.js` | New — FCMService class: permission request, token registration, foreground message handler |
| `src/services/firebaseService.js` | Added `saveFCMToken()` and `getAllFCMTokens()` |
| `src/services/authService.js` | Import FCMService, call `requestPermissionAndRegister()` fire-and-forget after login |
| `src/modules/admin/AdminScreen.js` | Import FCMService, `broadcastAnnouncement()` made async — awaits Firebase, toast reflects online/offline |
| `sw.js` | FCM compat `importScripts` at top, firebase init, background push handler, fcmService.js in APP_SHELL, v24 → v25 |
| `docs/MASTER_PROGRESS.md` | FCM 🟢 100%, Family Leaderboard Firebase 🟢 100%, Firebase Integration → 100% |

---

## Design

### Family Leaderboard — Firebase Sync

`subscribeToLiveFamilyLeaderboard()` in `LeaderboardService` wraps the existing `FirebaseService.subscribeToLeaderboard()` (which fires on any miles change). On each Firebase event:

1. Groups guest balances by `familyId`
2. Looks up family name and color from `GuestDatabaseService.getFamilies()`
3. Falls back to `MilesService.getBalance()` for guests not yet in Firebase
4. Sorts descending, adds `rank`, returns entries shaped for `FamilyRow`

`RewardsScreen.startLiveFamilyLeaderboard()` patches only `.family-leaderboard-list` — the individual leaderboard (`startLiveLeaderboard()`) runs in parallel on the same Firebase snapshot, so both lists update simultaneously when any guest's miles change.

Unsubscribed in `hide()` and when switching away from the leaderboard tab.

### FCM Token Registration

Flow:
1. Guest logs in → `AuthService.login()` calls `FCMService.requestPermissionAndRegister(guestId)` fire-and-forget
2. Browser requests notification permission (system dialog)
3. If granted: `getToken(messaging, { vapidKey, serviceWorkerRegistration })` fetches an FCM token
4. Token saved to Firebase at `fcm_tokens/{guestId}` via `FirebaseService.saveFCMToken()`
5. Token also cached in localStorage (`ar_fcm_token_{guestId}`) to skip re-registration if unchanged
6. `onMessage(messaging, handler)` wired for foreground messages

### Foreground Messages (App Open)

When FCM delivers a message while the app is open, `FCMService._handleForegroundMessage()` renders the same `.announcement-banner` component used by `initAnnouncementListener()` in `app.js`. Auto-dismisses after 8 seconds.

### Background Push (Limitation)

FCM background push (app closed / screen locked) requires:
- A server to call `POST https://fcm.googleapis.com/v1/projects/.../messages:send`
- This must be done server-side (Firebase Cloud Functions or any backend)

The vanilla JS client **cannot** send FCM messages to other devices — only receive them. The existing `FirebaseService.postAnnouncement()` + `onValue` subscription delivers to all **open** app instances in real time. Background push is the natural next step when Cloud Functions is set up.

### VAPID Key

The `VAPID_KEY` in `src/config/firebase.js` is currently `'PASTE_VAPID_KEY_HERE'`. To activate FCM:

1. Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates" → Generate key pair (if none exists)
3. Copy the key pair string
4. Replace `PASTE_VAPID_KEY_HERE` in `src/config/firebase.js`

Without the VAPID key, `getToken()` will fail and FCMService catches + logs the error. The rest of the app is unaffected.

### `broadcastAnnouncement()` Updated

Made async. Now awaits `FirebaseService.postAnnouncement()` and shows `"📢 Broadcast sent to all guests"` on success or `"📢 Sent (offline mode)"` on Firebase failure. localStorage fallback is still written either way.

---

## Verified

- App boots without errors (FCM failure in dev environment is caught + logged, not thrown)
- Leaderboard tab shows family list with `.family-leaderboard-list` class selector target
- Firebase subscription starts on leaderboard tab open, stops on tab switch and hide()
- FCMService module imports cleanly in the ES module graph

---

## Known Limitations

- Background push to locked screens requires Firebase Cloud Functions (future)
- VAPID key placeholder must be replaced before FCM token registration works
- `getToken()` in development may fail if service worker origin doesn't match — caught silently
