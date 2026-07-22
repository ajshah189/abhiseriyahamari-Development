# Session 20 Report — TV Leaderboard + Journey Complete + Daily Challenges

Date: 22 July 2026

---

## Summary

Three-part feature implementation: a fullscreen live leaderboard for projector display, an end-of-journey stats modal, and an admin-launched daily challenge system with guest-facing banner and "I Found It!" flow.

---

## Changes

### Part A — TV Leaderboard Screen (`/leaderboard-tv`)

- `src/modules/tv/tv.css` (NEW): Fullscreen dark theme for 1920×1080 TV display. All text ≥24px. LIVE badge with pulsing green dot via CSS animation. Two-column panel layout (Guest Leaderboard + Family Standings). Gold-on-dark color scheme matching AR Airways brand.
- `src/modules/tv/TVLeaderboardScreen.js` (NEW): No auth check — loads instantly for anyone. Uses `LeaderboardService.subscribeToLiveLeaderboard` and `subscribeToLiveFamilyLeaderboard` for Firebase real-time data. 10s `setInterval` refreshes the clock between Firebase pushes. All subscriptions and intervals cleared in `hide()`.
- `src/app.js`: Early return guard at top of `start()` — detects `window.location.pathname === '/leaderboard-tv'`, registers only `TVLeaderboardScreen`, calls `Router.go('leaderboard-tv')`, returns without any auth/shell setup.
- `index.html`: Added `<div id="screen-leaderboard-tv" hidden></div>` and `<link rel="stylesheet" href="src/modules/tv/tv.css">`.

### Part B — Journey Complete Card

- `src/modules/journey/JourneyCompleteCard.js` (NEW): `isJourneyComplete()` returns true in dev (IS_DEV flag) or when Date.now() ≥ 24 Jan 2027 18:00 IST. `buildJourneyStats(guestId)` is synchronous — reads from MilesService ledger for miles/eventsAttended/connections, derives countriesVisited from EVENTS data, huntFound from `getFoundLocations`. `showJourneyCompleteCard(snapshot, stats)` creates a fixed overlay modal with stats grid and WhatsApp share link. Overlay closes on backdrop click or ✕ button.
- `src/modules/dashboard/dashboard.css`: Added `.journey-complete-overlay` / `.journey-complete-card` / `.journey-complete-stats` / `.journey-complete-cta` styles.
- `src/modules/dashboard/GuestAppScreen.js`: `show()` calls `_maybeShowJourneyCard()` — shows the card 1.5s after navigation for logged-in guests on Day 3, once per session (sessionStorage flag `ar_journey_card_shown`).
- `src/modules/profile/ProfilePage.js`: Imported `isJourneyComplete`; added `journeySummaryButton()` rendered when journey is complete.
- `src/modules/profile/ProfileScreen.js`: `bindJourneySummary()` — handles `[data-journey-summary]` click; calls `buildJourneyStats` and `showJourneyCompleteCard`.

### Part C — Daily Challenges

- `src/services/firebaseService.js`: Added `launchChallenge()`, `completeChallenge()`, `subscribeToActiveChallenges()`, `endChallenge()`, `getChallengeCompletions()` for `/challenges/` Firebase path.
- `src/models/Transaction.js`: Added `CHALLENGE: "CHALLENGE"` to TX_KINDS.
- `src/components/cards/ActivityCard.js`: Added `CHALLENGE: "🎯"` to KIND_ICONS.
- `src/modules/admin/AdminPage.js`: Added `{ id: "challenges", label: "🎯 Challenges" }` to NAV_ITEMS. Added `challengesSection(state)` — type selector (Speed Rush/Timed/Open), title/description/miles/limit/expiry fields, Launch button, active challenge list with End buttons. Added to `SECTION_RENDERERS`.
- `src/modules/admin/AdminScreen.js`: Added `challenges` to `createInitialState()`. Added `_unsubChallenges`. Added `bindChallengeEvents()` + `launchChallenge()`. Added challenge subscription in `_startFirebaseSubscriptions()`, unsubscribed in `hide()`.
- `src/modules/dashboard/dashboard.css`: Added `.challenge-banner` styles (gold border, flex layout, mobile-responsive wrap).
- `src/modules/dashboard/HomePage.js`: Added `esc()` helper and `ChallengeBanner(challenge)` render function (shows Speed Rush spot count, Timed countdown in minutes, Open type label). `HomePage()` now accepts `(chronicle, challenge)` parameter.
- `src/modules/dashboard/GuestAppScreen.js`: Added `_activeChallenge`, `_unsubChallenges`, `_challengeTimer`. `render()` passes `_activeChallenge` to `HomePage`. `_startChallengeSubscription()` called in `show()`. `bindChallengeFound()` handles "I Found It!" — auth check, confirm dialog, `FirebaseService.completeChallenge`, `MilesService.earn("CHALLENGE")`, Speed Rush limit auto-end. Timer cleared in `hide()`.

### Wire-up

- `sw.js`: Bumped to `ar-airways-v32`. Added `TVLeaderboardScreen.js`, `tv.css`, `JourneyCompleteCard.js` to APP_SHELL.

---

## Architecture Notes

- TV screen bypasses the entire auth/shell initialization — `app.js` returns after `Router.go('leaderboard-tv')` with no miles store, no bell, no concierge button.
- Journey Complete stats are synchronous (ledger-based) — no async Firebase calls needed at show-time, keeping the modal snappy.
- Challenge "I Found It!" is honor-system — no verification. For Speed Rush, the completion push is optimistic; the limit check reads completions after the write and auto-ends the challenge when limit is reached.
- All three timers (TV clock, challenge Timed refresh, challenge Timed auto-render) are cleared in their respective `hide()` functions — no memory leaks.
