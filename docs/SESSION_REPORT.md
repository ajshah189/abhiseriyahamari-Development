# Session Report — Guest Directory + "Take Me There" Navigation

Date: 10 July 2026 (Session 2)
Scope: Full Guest Directory screen + one-tap navigation UX for the map.

---

## What Changed

### New files
- **`src/modules/directory/DirectoryPage.js`** — pure render function; 18 guests sorted alphabetically; avatar with `colorFromName()` / `initials()`; viewer mode hides room/zone/button; "Find on Map" sets `ar_map_highlight` sessionStorage key
- **`src/modules/directory/DirectoryScreen.js`** — router adapter; re-renders on `show()` (stays fresh after sign in/out); wires back button, live search filter, and "Find on Map" click handlers
- **`src/modules/directory/directory.css`** — `.directory-topbar`, `.directory-search`, `.guest-card`, `.guest-card__avatar`, `.guest-card__map-btn`; dark card grid with sticky topbar and always-visible search

### Modified files
- **`src/modules/map/MapScreen.js`** — full rewrite; added `PassengerService` import; module-level `_hotspotEls` + `_flyTo` (set during `mount()`, used in `show()` for highlight); `polygonCentroid()` helper; `findNavLocId()` helper (matches room name against navFromSelect text); `autoFillNavFrom()` (idempotent, used in 3 places); FAB listener auto-fills on open; "Navigate Here" also auto-fills; "Take Me There ✈" button handler: closes popup → sets To → auto-fills From → opens panel → fires navGoBtn after 60ms; guest search extension appends `.search-guests` section after core results; `show()` reads + clears `ar_map_highlight`, pans + pulses + clicks polygon
- **`src/modules/map/map.css`** — appended: `.map-popup-take-me-there` (gold-filled variant), `.nav-autofill-label`, `.search-section-label`, `.search-guest-result`, `.search-result__body`, `.search-result__name`, `.search-result__room`, `.map-highlight-pulse` (drop-shadow filter animation)
- **`index.html`** — `directory.css` link; `#navFromAutoFill` div below navFromSelect; `#popupTakeMeThereBtn` below popupNavBtn; `#screen-directory` div
- **`src/modules/dashboard/QuickActions.js`** — added `{ icon: "👥", title: "Guest Directory", route: "directory" }` (10th action)
- **`src/modules/profile/ProfilePage.js`** — added `directoryLink()` helper; called in both logged-in and logged-out branches (above Sign Out, below Quick Info)
- **`src/app.js`** — `import { DirectoryScreen }` + `Router.register("directory", DirectoryScreen)`
- **`sw.js`** — `CACHE_NAME` bumped to `ar-airways-v6`; 3 new directory files added to `APP_SHELL`

---

## Room → Map matching logic

`rooms.js` uses themed names (Japan, Bali, Bangkok, etc.) while `data.js` room clusters use `destinationCity` (Tokyo, Bali, Bangkok, etc.). The matching bridge:

```
navFromSelect option text = "${loc.name} — ${loc.destinationCity}"
                                e.g. "C29–C34 — Bali"

room.name "Bali" → opt.textContent.toLowerCase().includes("bali") → loc.id "c29-c34"
```

Matching rooms (8/12): Bali → c29-c34, Bangkok → c27-c28, Marrakech → c12, Cairo → c11a-c11b, Zanzibar → c18, Rio de Janeiro → c7-c8, Sydney → e1-e8, Fiji → e17-e25.

No match (4/12): Japan, New York, Buenos Aires, Venice — no cluster has those destination cities. For these, `autoFillNavFrom()` leaves the picker manual and hides the label; `show()` silently skips the highlight (pan never fires).

"Find on Map" buttons appear for all rooms (not just matched ones). Clicking a "no-match" room name navigates to the map without a highlight — the guest still lands on the map.

---

## Verification results

- ✅ Directory renders in viewer mode: 18 guests, rooms "—", no "Find on Map" buttons
- ✅ Directory renders in logged-in mode: 18 guests, room names + zones visible, all "Find on Map" buttons present
- ✅ Search filter: typing "shah" → 4 cards (Abhishek, Kiran, Nikita, Riya), 14 hidden
- ✅ "Find on Map" (Nikita Shah / Bali): sessionStorage set to "Bali", routed to map, key consumed by show(), map showing 45 polygons
- ✅ Navigate FAB auto-fill (Nikita Shah / Bali): panel visible, navFromSelect.value = "c29-c34", text = "C29–C34 — Bali", autoFillLabel visible with "Your room · auto-filled"
- ✅ Map guest search ("mehta"): GUESTS section rendered with 4 results (Rohan, Priya, Sameer, Anjali), correct room names and locIds (c12, c11a-c11b)
- ✅ Quick Actions tile: "👥 Guest Directory" present with data-route="directory"
- ✅ Profile page: "👥 Browse Guest Directory" button present (data-route="directory"), ProfileScreen wires it via querySelectorAll("[data-route]")
- ✅ "Take Me There ✈" button: element exists in DOM, text correct, starts hidden — visibility toggled per-hotspot by secondary listener on open
- ✅ No JS errors on any navigation path

---

## Key architectural decisions

| Decision | Reason |
|---|---|
| `ar_map_highlight` stores room.name (not locId) | DirectoryPage has no access to navFromSelect DOM; MapScreen.show() has both the populated select and the hotspotEls map, so it's the right place to resolve the final locId |
| `polygonCentroid()` computes center from polygon points attribute | Avoids storing data.js `cx`/`cy` at module level; works for both generated-box and hand-traced polygons |
| Module-level `_hotspotEls` / `_flyTo` | `show()` is always called after `mount()`, so these are safe to read; avoids re-importing or repeating the async map boot |
| `autoFillNavFrom()` called in 3 places (FAB listener, popupNavBtn, popupTakeMeThereBtn) | All three entry points that open the nav panel; no MutationObserver needed, simpler and more explicit |
| Guest cards store search data in `data-name`, `data-family`, `data-room` attributes | Filter runs entirely in DOM without re-querying PassengerService; instant on 18 records |
