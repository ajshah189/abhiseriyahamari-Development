# Session Report — Guest Onboarding + Two-Tier Access

Date: 09 July 2026
Scope: Real passport-number login replacing the hardcoded guest, two-tier (Viewer / Full) access across every screen, Sign Out

---

## Files Created

- `src/services/authService.js` — single source of truth for auth state. `login(passportNumber)` (case-insensitive, trimmed), `loginAsViewer()`, `logout()`, `getCurrentGuest()`, `isLoggedIn()`, `isViewer()`, `hasAccess(feature)`. Reads `data/guests.js` directly (same reasoning as `milesStore.js`'s own migration: `PassengerService.getCurrentPassenger()` delegates here, so this resolving its own guest list avoids a circular import between the two services).
- `src/modules/onboarding/OnboardingPage.js` / `OnboardingScreen.js` / `onboarding.css` — the first screen a guest ever sees. No TopBar/BottomNav. Hero, passport input (auto-uppercase, auto-focus, Enter-to-submit, inline error), a divider, and "Continue as Guest Viewer". Success briefly fades the whole screen before handing off to `Router.go("home")`.

## Files Modified

- `src/data/guests.js` — every one of the 18 guests got a unique `passportNumber`. Format `AR-[cottage]-[FAMILY_INITIAL]`; where a room+initial collision exists (e.g. two Mehtas in the same cottage), a numeric suffix differentiates them, per the spec's own collision rule — except Abhishek/Riya, which use the spec's own literal examples (`AR-501-S` / `AR-501-R`) since the testing checklist explicitly requires `AR-501-S` to log in as Abhishek. Verified all 18 unique by grep.
- `src/models/Guest.js` — `normalizeGuest()` passes through `passportNumber`.
- `src/config.js` — added the `auth` block (`storageKey`, `viewerKey`, `sessionKey`) exactly as specified. Note: `sessionKey` is declared but not consumed by anything — no step described what it should cache, and caching `getCurrentSnapshot()` would risk staleness against the ledger's "always derive live" rule this app has enforced all session, so I didn't invent behavior for it.
- `src/services/passengerService.js` — `getCurrentPassenger()` now delegates to `AuthService.getCurrentGuest()` (returns `null` in viewer mode). `getCurrentSnapshot()` falls back to a new `getViewerSnapshot()`. I nested the viewer snapshot under the same `profile{}` shape as a real snapshot rather than the flatter shape in the task's illustrative code — every existing consumer's `snapshot?.profile?.x` optional-chaining stays crash-safe without touching every call site, and an `isViewer` flag is there for the screens that need to render something deliberately different, not just null-safe fallback text.
- `src/app.js` — registered `OnboardingScreen`; the final unconditional `Router.go("home")` is now gated on `AuthService.isLoggedIn() || AuthService.isViewer()`, falling back to `Router.go("onboarding")`. (The task's snippet said this check runs "at the very start of `start()`" — read literally that's impossible, since `Router.go()` needs every screen registered first. Applied as the last routing decision instead, which is what actually makes it work.)
- `src/modules/dashboard/GuestAppScreen.js` / `HomePage.js` — see "A Bug This Feature Exposed" below.
- `src/components/layout/TopBar.js` — see "One More Hardcode" below.
- `src/modules/rewards/RewardsPage.js` — rewards view locked behind `AuthService.hasAccess("rewards")`; leaderboard view was already correct for free once `PassengerService` was fixed (`isSelf` naturally never matches for a `null` current guest).
- `src/modules/passport/PassportPage.js` — every stamp force-renders `locked` when `!AuthService.hasAccess("passport")`, regardless of real event status, plus the specified banner + CTA.
- `src/modules/profile/ProfilePage.js` / `ProfileScreen.js` — not-logged-in state (generic ✈ avatar, still carrying `data-admin-trigger`) replaces all 5 sections when `!AuthService.isLoggedIn()`. Sign Out button at the bottom of the logged-in view; `ProfileScreen` wires `confirm()` → `AuthService.logout()` → `Router.go("onboarding")`.
- `src/modules/journey/JourneyPage.js` — boarding pass shows `—` for name/boarding-group/gate/seat/class in viewer mode; From/To/Flight/Date stay generic since they were never personalized. Flight schedule and passport previews are untouched — they don't depend on identity.
- `src/components/cards/PassengerCard.js` — added a viewer branch (name "Guest Viewer", dashes, a prompt + CTA instead of the miles/progress block) and removed the hardcoded `"Abhishek Shah"` / `"C204"` fallback strings, which were always placeholder-ish but are now a real, reachable, and wrong thing to show a browsing stranger.
- `src/components/cards/ActivityCard.js` — returning `""` for no passenger silently disappeared the whole section; now renders "Log in to see your journey." per spec.
- `src/modules/shared/shared.css` — new `.access-locked` pattern (icon/message/CTA), reused by Rewards, Passport, and Profile's `PassengerCard` prompt. Small viewer-specific additions to `rewards.css`, `cards.css`, `profile.css`.
- `index.html` — `#screen-onboarding` container + `onboarding.css` link.
- `docs/MASTER_PROGRESS.md` — new "Guest Onboarding / Auth" section, "Guest Login" and "Passenger System" both marked 🟢 Completed (were stale/unstarted), overall progress 48% → 54%.

## A Bug This Feature Exposed (Fixed)

`GuestAppScreen` rendered `HomePage()` once at `mount()` and never again on subsequent `show()` calls — harmless for the entire life of this app so far, because "current guest" was permanently hardcoded to Abhishek. `HomePage()` also self-subscribed to `AppStore`'s `miles:changed` event on every call it received, with no unsubscribe — also harmless, because it was never called more than once.

Real guest-switching (Sign Out, log back in as someone else, or drop to Viewer) breaks both assumptions at once: without a re-render, Home would keep showing the *previous* guest's boarding pass forever. Fixed by moving the `miles:changed` subscription into `GuestAppScreen` (subscribed exactly once, at `mount()`) and having it call a full re-render on every `show()` — the same "go live via re-render-on-show" pattern every other screen in this app already uses (Journey, Rewards, Profile, Passport). `HomePage.js` is a pure render function again.

## One More Hardcode (Not in Scope, Fixed Anyway)

`TopBar.js` — which renders on nearly every guest screen — hardcoded `"Abhishek Shah"` and a static `"A"` avatar letter. STEP 7 doesn't name it explicitly, but leaving it would have meant every screen showing the wrong guest's name in the header even after a correct, working login — directly contradicting this session's own premise ("With 18 guests in the system this is no longer acceptable"). Now reads the real current guest (or "Guest Viewer") via `PassengerService`, with a dynamic avatar reusing `initials()`/`colorFromName()` from `LeaderboardCard.js` (same reuse pattern `ProfilePage.js` already established).

---

## What Works (verified in live preview)

Cleared `localStorage`/`sessionStorage` before testing. All 13 checklist items:

1. Fresh load → onboarding renders, confirmed via accessibility snapshot that no BottomNav/TopBar exist anywhere on the page.
2. Wrong passport number (`AR-999-X`): error message + red input border, confirmed `#screen-onboarding` stayed visible and `#screen-guest` stayed hidden. (First attempt at this showed a false failure — `screen-guest` appeared visible — that turned out to be a race in my own test sequencing, not the app; re-ran with each step awaited individually and it passed cleanly and repeatably.)
3. Correct passport (`AR-501-S`): success fade, routes to Home, boarding pass shows "Abhishek Shah", `localStorage` has `ar_guest_id: "G001"`.
4. "Continue as Guest Viewer": routes to Home immediately, boarding pass shows "Guest Viewer", no miles block.
5. Viewer → Rewards: leaderboard tab shows all 23 rows (18 guests + 5 families) with zero self-highlighted (correct — no current guest to match); rewards tab shows the locked overlay with the exact specified message and CTA.
6. Viewer → Passport: all 7 stamps locked regardless of real status, correct banner message.
7. Viewer → Profile: "Not Logged In" heading, generic ✈ avatar (not a letter), CTA present, no Sign Out button — and the 5-tap admin trigger still works from the placeholder avatar, confirmed by completing the PIN flow through to `AdminPage` and back.
8. Viewer → Dashboard: no miles block, "Log in to see your journey" in place of the activity feed, Map/Events quick actions unaffected.
9. Reload persistence checked both ways: viewer mode survives a reload (still Guest Viewer, onboarding skipped); logging in as Abhishek, waiting for the fade, then reloading also skips onboarding and shows Abhishek again.
10. Profile → Sign Out (confirm dialog stubbed to auto-accept for the automated check) → both `localStorage` auth keys cleared, onboarding shown again.
11. Admin reachable via the 5-tap trigger in both viewer mode and while logged in; PIN flow and Exit Admin both confirmed round-trip correctly.
12. Journey's boarding pass in viewer mode: name/boarding-group/gate/seat/class all render as `—`; flight-schedule and passport previews still populate normally.
13. Mobile (375px): title drops to the specified 36px, input wrap fits the viewport; Enter-key submission confirmed via a real `keydown` dispatch (not just a click). Auto-focus itself: the code correctly calls `.focus()` on mount (confirmed the call succeeds when invoked manually), but I can't fully certify it fires automatically in this preview environment — `document.hasFocus()` reports `false` here, meaning the automated browser tab never holds real OS-level window focus, which is a testing-environment limitation rather than something the app controls.

Zero console errors throughout. One `net::ERR_ABORTED` on a root-document request during a rapid reload — the same known-benign preview-tool artifact documented in the Passport session, not a real failure.

---

## What to Build Next

Per the task's own recommendation: **backend persistence** (Cloudflare D1 or Firebase). Every guest's ledger, redemptions, and now their login state, live in that one browser's `localStorage` — 500 guests on 500 devices means 500 isolated leaderboards. For a live wedding leaderboard (and for Admin's Award Miles to mean anything across devices) this needs to move server-side.
