# Session 7 Report — Dashboard Alive: Countdown + Empty States + Onboarding Warmth

**Date:** 11 July 2026
**Branch:** develop
**SW Cache:** ar-airways-v15
**Scope:** Parts A–E of the session task spec

---

## What Was Built

### Part A — Live Countdown on Dashboard (TodaysJourney.js + GuestAppScreen.js + dashboard.css)

`TodaysJourney.js` rewritten with:
- `isWeddingWeek()` — checks `now >= 2027-01-22T00:00 IST && now < 2027-01-25T00:00 IST`
- `getCountdownText(event)` — exported; returns `Xh Ym`, `Xm Ys`, or `Xs`; null when event started
- `getUpNextCountdownText()` — exported; single source of truth for GuestAppScreen's interval; returns null when re-render needed
- `upNextCard()` — UP NEXT / BOARDING NOW / IN FLIGHT hero card with gold left border, gold gradient bg, 24px Cormorant name, "Navigate →" / "Join Now →" button, tabular-nums countdown
- `preweddingCard()` — outside wedding dates: "✈ Begins in 195 days" with "Preview: Day 1 Schedule" label
- `NO_ANIM_ROUTES`-safe: skips `#up-next-countdown` id in pre-wedding so interval is a no-op

`GuestAppScreen.js` changes:
- `startCountdown()` / `stopCountdown()` — `setInterval(tickCountdown, 1000)`, only started when `isWeddingWeek()`
- `tickCountdown()` — querySelector for `#up-next-countdown`, updates textContent; calls `render()` when `getUpNextCountdownText()` returns null (event state changed)
- `show()` → `startCountdown()`; `hide()` → `stopCountdown()` — no memory leak

CSS additions in `dashboard.css`:
- `.up-next` — gold left border (4px), `linear-gradient(135deg, rgba(212,175,106,0.08), …)`, border-radius
- `.up-next--boarding` — `@keyframes boarding-pulse` gold border pulse
- `.up-next--inflight` — green tint (`rgba(76,175,80,…)`)
- `.up-next--prewedding` — plain gold border
- `.up-next__label` — 11px small-caps gold
- `.up-next__name` — 24px Cormorant cream
- `.up-next__countdown` — 22px tabular-nums gold bold
- `.up-next__nav` — ghost button, gold border pill

### Part B — Empty States

| Location | Empty State |
|----------|-------------|
| PassengerCard (0 miles) | "Your journey starts at Check-in. Earn your first miles on 22 Jan." — italic faint below the 0 |
| Profile: Events Attended = 0 | "Your adventure awaits on 22 Jan" |
| Profile: Countries Visited = 0 | "Your passport stamps await ✈" |
| Profile: Transaction History empty | ✈ "Your ledger is empty / First miles arrive at Check-in on 22 January 2027" |
| Leaderboard (all balances 0) | 🏆 "The leaderboard fills up as guests check in on 22 Jan. / Will you be #1?" |
| Passport (0 stamps) | ✈ "Your passport is blank — for now. / Every event earns a new stamp. Start at the Main Gate on 22 Jan." |
| Treasure Hunt (0 found) | 🗺 "No locations discovered yet. / Your first clue: 'Where the journey begins for every passenger' (Hint: look near the Main Gate)" |
| Rewards (can't afford any) | ✈ "Earn AR Miles at events and the Treasure Hunt to unlock rewards. / Check-in on 22 Jan to get started." |

**New shared CSS** in `shared.css`: `.empty-state`, `.empty-state__icon`, `.empty-state__title`, `.empty-state__subtitle` — reused by all 8 locations above.

**`stat-card__hint`** added to `profile.css` for the inline stat-card hints.

### Part C — Onboarding Warmth (OnboardingPage.js + onboarding.css)

New hero hierarchy replacing the old monolithic block:

```
✈ (floating plane, unchanged)

Riya & Abhishek     ← .onboarding__couple (Cormorant 20px, muted gold)
invite you aboard   ← .onboarding__invite (Inter 14px, muted, italic)

AR Airways          ← .onboarding__title (Cormorant 52px, gold, bold)

Your journey begins at Aayush Resort  ← .onboarding__subtitle (Inter 13px, muted)
22 · 23 · 24 January 2027
```

Other changes:
- Hint: "Your passport number is on your physical boarding pass 🎫" (italic, centered)
- Viewer subtitle: "Browse the schedule and map · No passport needed"

### Part D — Activity Feed Warmth (ActivityCard.js)

- Empty state (no transactions, or opening-balance-only): "✈ No activity yet / Your journey begins at Check-in on 22 January. See you there!"
- `KIND_LABELS` override map: `OPENING_BALANCE → "Welcome aboard · Opening balance"`, `AWARD_MANUAL → "Award from Ground Crew"`, `HUNT_DISCOVERY → "Treasure Hunt discovery"`
- `formatActivityTime()`: "Today at 14:32" / "Yesterday at 20:15" / "22 Jan at 09:00" — replaces bare `MilesService.formatTime()` in the feed
- `AWARD_MANUAL` icon updated from ⚙️ to 🏆

### Part E — TopBar Countdown Pill (TopBar.js)

`getWeddingPill()` replaces hardcoded "Wedding in 198 Days":

| Date range | Text |
|------------|------|
| Before 22 Jan 2027 | "🎉 Wedding in N days" |
| 22 Jan | "Day 1 of 3 ✈" |
| 23 Jan | "Day 2 of 3 ✈" |
| 24 Jan | "Day 3 of 3 ✈" |
| 25 Jan+ | "Thank you for flying ✈" |

---

## Verification

| Check | Result |
|-------|--------|
| Pre-wedding hero card "Begins in 195 days" | ✅ |
| TopBar pill "🎉 Wedding in 195 days" | ✅ |
| 0 miles warm hint in PassengerCard | ✅ |
| Activity feed warm empty state | ✅ |
| Profile stat-card hints (events + countries = 0) | ✅ |
| Profile transaction history warm empty state | ✅ |
| Leaderboard warm state (all zeros) | ✅ |
| Passport blank state warm message | ✅ |
| Hunt no-finds warm state with first clue | ✅ |
| Rewards insufficient-miles warm hint | ✅ |
| Onboarding new hero hierarchy (couple/invite/AR Airways) | ✅ |
| Onboarding boarding pass hint + viewer subtitle | ✅ |
| No console errors | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/dashboard/TodaysJourney.js` | Full rewrite: upNextCard, preweddingCard, exported helpers |
| `src/modules/dashboard/GuestAppScreen.js` | Add countdown interval (startCountdown/stopCountdown) |
| `src/modules/dashboard/dashboard.css` | Add .up-next family of styles |
| `src/components/cards/PassengerCard.js` | 0-miles warm hint |
| `src/components/cards/cards.css` | .miles-empty-hint |
| `src/components/cards/ActivityCard.js` | Warm empty, KIND_LABELS, formatActivityTime |
| `src/modules/profile/ProfilePage.js` | stat-card hints, transaction empty state |
| `src/modules/profile/profile.css` | .stat-card__hint |
| `src/modules/leaderboard/LeaderboardPage.js` | Warm empty when all balances 0 |
| `src/modules/passport/PassportPage.js` | Warm message below stamp grid |
| `src/modules/hunt/HuntPage.js` | Warm empty state with first clue |
| `src/modules/rewards/RewardsPage.js` | Insufficient-miles warm hint after grid |
| `src/modules/onboarding/OnboardingPage.js` | New hero hierarchy, hints, viewer subtitle |
| `src/modules/onboarding/onboarding.css` | .onboarding__couple, .onboarding__invite, updated title/subtitle |
| `src/modules/shared/shared.css` | .empty-state family (shared across all screens) |
| `src/components/layout/TopBar.js` | getWeddingPill() — dynamic countdown |
| `sw.js` | Bumped to ar-airways-v15 |
