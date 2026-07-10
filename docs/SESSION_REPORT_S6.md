# Session 6 Report — Foundation Polish: Splash, Transitions, Error Handler, Pull-to-Refresh

**Date:** 11 July 2026
**Branch:** develop
**SW Cache:** ar-airways-v14
**Scope:** Parts A–D of the session task spec

---

## What Was Built

### Part A — Splash Screen

`src/modules/splash/splash.css` — full-viewport branded loading screen styles:
- `#ar-splash`: `position: fixed; inset: 0; z-index: 9999; background: var(--night)`
- `.splash-plane`: 64px gold ✈, `splash-float` keyframe (translateY ±8px, 3s loop)
- `.splash-title`: Cormorant Garamond 48px gold
- `.splash-subtitle`: Inter 14px `var(--cream-dim)`
- `.splash-bar` + `.splash-bar-fill`: 200px gold progress bar, `splash-progress` 1.5s ease-out
- `prefers-reduced-motion` block: disables all animations, pre-fills bar to 100%

`script.js` rewrite — key changes:
1. `hideSplash()` and `showErrorScreen()` defined as synchronous functions first
2. `window.addEventListener('error', ...)` + `window.addEventListener('unhandledrejection', ...)` error boundary
3. Splash HTML injected synchronously into `document.body` (before any imports)
4. `await import('./src/app.js')` (dynamic) replaces the static import so module resolution happens AFTER splash appears
5. `setTimeout(hideSplash, 300)` after `App.start()` — lets first screen render before fade

`src/modules/splash/SplashScreen.js` — companion module documenting why the implementation is in `script.js` rather than a normal import; exports `hideSplash` for reference.

### Part B — Page Transitions

`src/router.js` `_transition()` updated:

```
CONTAINER_IDS = { home: 'screen-guest', leaderboard: 'screen-rewards' }
NO_ANIM_ROUTES = Set(['map'])
```

Transition flow:
1. Check `reduceMotion` (`.reduce-motion` class OR `prefers-reduced-motion` media query)
2. If skip: call `hide()` / `mount()` / `show()` instantly (same as before)
3. Fade out: find current visible container → set `opacity: 0` + `transition: opacity 0.15s` → await 150ms → `hide()` → clear styles
4. Mount: `next.mount()` if `!next.mounted`
5. Fade in: `getElementById(CONTAINER_IDS[name] ?? 'screen-' + name)` → set `opacity: 0` → `show()` → double-`requestAnimationFrame` → set `opacity: 1` → await 200ms → clear styles

Map screen skipped in both directions (entering or leaving).

### Part C — Global Error Handler

Wired in `script.js` before the dynamic App import:
- `window.addEventListener('error', ...)` catches synchronous errors
- `window.addEventListener('unhandledrejection', ...)` only triggers `showErrorScreen` when `e.reason?.critical` is truthy — notification permission denials, icon 404s, etc. are ignored
- `showErrorScreen()` guards: removes splash if still present, returns early if `[id^="screen-"]` elements exist (app already rendered)
- "Technical Delay" fallback: inline styled, branded gold, "Refresh Flight ↻" button calls `location.reload()`

### Part D — Pull-to-Refresh

`src/utils/pullToRefresh.js`:
- `_pullToRefreshBound` flag on container element prevents double-wiring
- `container.style.position = 'relative'` ensures absolute indicator positions correctly
- `touchstart`: captures `startY` when `scrollTop === 0`
- `touchmove`: creates `.pull-indicator` div, sets opacity + `translateX(-50%) translateY(...) rotate(...)` proportional to drag distance
- `touchend`: if dragged past 40% of threshold (80px), shows spin animation, calls `await onRefresh()`, then fades indicator out
- All listeners `{ passive: true }`

`src/utils/utils.css`:
- `.pull-indicator`: `position: absolute; top: 80px; left: 50%; transform: translateX(-50%)`
- `@keyframes pull-spin`

Wired in `mount()` (once per lifetime) on:
- `GuestAppScreen.js` → `pullToRefresh(container, async () => { render(); })`
- `EventsScreen.js` → same
- `RewardsScreen.js` → same

`index.html`: `splash.css` linked as first stylesheet (before `style.css`); `utils.css` linked after.

---

## Key Design Decision

`script.js` had a static `import App from "./src/app.js"` at the top. Static imports resolve before ANY code in the module runs — so the splash injection would have appeared AFTER App resolved (defeating its purpose). Switching to `const { default: App } = await import('./src/app.js')` lets synchronous code above it (splash, error handlers) run first while module resolution happens in the background.

---

## Verification

| Check | Result |
|-------|--------|
| Splash appeared then removed on load | ✅ (`splashGone: true`, `currentRoute: screen-guest`) |
| App loaded correctly behind splash | ✅ (no errors, all screens available) |
| Dashboard pull-to-refresh bound | ✅ (`_pullToRefreshBound: true`) |
| Events pull-to-refresh bound | ✅ |
| Rewards pull-to-refresh bound | ✅ |
| Router transition completes (opacity cleaned up) | ✅ (`homeOpacity: "(no inline - transition complete)"`) |
| No console errors | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `script.js` | Full rewrite: splash inject, error boundary, dynamic import |
| `src/router.js` | `_transition()` with fade animations; map skip; reduce-motion check |
| `src/modules/splash/SplashScreen.js` | Created |
| `src/modules/splash/splash.css` | Created |
| `src/utils/pullToRefresh.js` | Created |
| `src/utils/utils.css` | Created |
| `src/modules/dashboard/GuestAppScreen.js` | Wire pull-to-refresh in mount() |
| `src/modules/events/EventsScreen.js` | Wire pull-to-refresh in mount() |
| `src/modules/rewards/RewardsScreen.js` | Wire pull-to-refresh in mount() |
| `index.html` | splash.css (first), utils.css links |
| `sw.js` | Bumped to v14; 4 new files in APP_SHELL |
