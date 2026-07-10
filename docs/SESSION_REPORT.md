# Session Report — Map UI Remake

Date: 10 July 2026
Scope: Replaced the map screen's bespoke toolbar with design-system chrome matching the rest of the app.

---

## What Changed

### New files
- **`src/modules/map/map.css`** — all new map chrome: TopBar, search slide-down bar, Navigate FAB, nav bottom sheet, popup bottom sheet, admin toolbar strip, zoom control repositioning.

### Modified files
- **`index.html`** — `#screen-map` section fully rewritten. Old `#topbar` replaced by `.map-topbar`. `#navigateBtn`, `#editorToggle`, `#editorTools` repositioned. `#navPanel` restructured as a bottom-sheet modal. `#popupCard` extended with `#popupNavBtn`. Filter panel (`#legend`) removed; `.filter-chip` stubs kept in a hidden container. `<link>` tag for `map.css` added.
- **`src/modules/map/MapScreen.js`** — `homeBtn` reference removed. Back-button, search toggle, nav-panel backdrop/close, and "Navigate Here" flow wired up. Non-passive `touchmove` listener added to prevent page bounce during pan.
- **`sw.js`** — `CACHE_NAME` bumped to `ar-airways-v5`; `/src/modules/map/map.css` added to `APP_SHELL`.
- **`docs/MASTER_PROGRESS.md`** — Interactive Map epic → 100%; Map UI Remake section added.

### No-change files
- `src/modules/core/` — zero modifications. All engine DOM ID contracts intact.
- `data.js` — data-only, no UI logic. No changes needed.
- `script.js` — already minimal, no changes.

---

## Architectural constraints honoured

| Constraint | How respected |
|---|---|
| `labels.js` needs `$("labelToggleBtn").onclick` | Kept as `<button id="labelToggleBtn" hidden>` stub |
| `zones.js` needs `$("worldModeBtn")` | Kept as `<button id="worldModeBtn" hidden>` stub |
| `utilities.js` `initOrganizerToggle` needs `#editorToggle`, `#editorTools`, `#editorDivider` | All three kept; gear icon moved to TopBar, toolbar moved below TopBar, divider kept as hidden span |
| `utilities.js` `initCategoryFilters` uses `.filter-chip` elements | 8 stub chips in a `<div hidden>` — `querySelectorAll` finds them, filters work invisibly |
| `navigation.js` wires `navigateBtn.onclick` | `#navigateBtn` kept in DOM, restyled as FAB via CSS; core handler fires normally |
| `popup.js` toggles `.hidden` class on `#popupOverlay` | CSS override scoped to `#screen-map #popupOverlay:not(.hidden)` — `.hidden { display:none !important }` still wins |
| `navigation.js` toggles `.hidden` class on `#navPanel` | Same pattern: `#screen-map #navPanel:not(.hidden)` adds modal styles; `.hidden` still hides |

---

## "Navigate Here" wiring

`popup.js` calls `openPopup(loc)` from inside the hotspot click handler (which calls `stopPropagation()`). `stopPropagation` blocks bubbling but NOT sibling listeners on the same element. `MapScreen.js` attaches a secondary listener on each polygon after `initMap` returns:

```js
Object.entries(map.hotspotEls).forEach(([id, el]) => {
  el.addEventListener("click", () => { currentPopupLocId = id; });
});
```

Both the core handler and the secondary listener fire in registration order. By the time the user can tap "Navigate Here", `currentPopupLocId` is set. The button then:
1. Closes `#popupOverlay` (adds `.hidden`)
2. Sets `#navToSelect.value = currentPopupLocId`
3. Opens `#navPanel` (removes `.hidden`)

---

## CSS specificity notes

| Rule | Specificity | Beats |
|---|---|---|
| `.hidden { display:none !important }` | (0,0,1,0) + !important | everything without !important |
| `#navPanel { ... }` in style.css | (0,1,0,0) | — |
| `#screen-map #navPanel:not(.hidden)` | (0,3,0,0) | `#navPanel` animation/position/size |
| `#screen-map #navigateBtn` | (0,2,0,0) | `.btn-ghost` (0,0,1,0) class styles |

The `:not(.hidden)` pattern is the invariant: any CSS that sets `display` on an engine-toggled element **must** be scoped to `:not(.hidden)` or `:not([hidden])` so the engine's toggle remains the source of truth.

---

## Verification results

All checks run against the live preview server:

- ✅ Map initializes without errors ("AR Airways map initialized — ledger architecture active")
- ✅ TopBar renders at 72px height; back arrow, brand, search icon visible
- ✅ Admin gear hidden (`display: none`) for guest viewer; shown for admin session
- ✅ Filter chips present in hidden container (querySelectorAll finds 8)
- ✅ `#legend` removed from DOM
- ✅ `#homeBtn`, `#labelToggleBtn`, `#worldModeBtn` all hidden stubs (`hidden: true`)
- ✅ Navigate FAB is `position: fixed`, bottom-right
- ✅ Zoom controls repositioned to left: `16px` from left edge
- ✅ Viewport `paddingBottom: 64px` for BottomNav clearance
- ✅ Search bar opens on toggle click, auto-focuses input; closes and clears on X
- ✅ Nav panel opens as flex modal when FAB clicked; `display: flex` computed
- ✅ Nav selects populated with resort locations
- ✅ Nav panel close button hides the panel
- ✅ 40 hotspot polygons load in SVG overlay
- ✅ Clicking hotspot opens popup ("Palace de Shaan")
- ✅ "Navigate Here" closes popup, pre-fills `navToSelect` to `palace-de-shaan`, opens nav modal
- ✅ Back button navigates to `screen-guest`, hides `screen-map`
- ✅ Journey screen navigates cleanly; returning to Home works
- ✅ Admin screen stays hidden throughout all navigation
