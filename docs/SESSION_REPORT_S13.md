# Session 13 — Pre-August Cleanup

**Date:** 2026-07-11
**Branch:** develop → main
**SW Cache:** ar-airways-v22
**Status:** App is feature-complete for August Firebase integration

---

## Summary

Four targeted fixes to clean up data accuracy, add offline awareness, and tighten CSV import validation before the August Firebase integration sprint.

---

## Fixes Shipped

### Fix 1 — Passport number format in mock guests.js
**File:** `src/data/guests.js`

**Problem:** First-person entries in shared-room, same-initial groups incorrectly used a `1` suffix (e.g. `AR-504-M1`). The `generatePassportNumber()` function in `guestDatabaseService.js` generates `AR-504-M` for the first person and `AR-504-M2` for the second — no `1` suffix on the base case. The mock data was inconsistent with the generator.

**Fixed 6 guests:**
| Guest | Before | After |
|-------|--------|-------|
| Rohan Mehta | AR-504-M1 | AR-504-M |
| Sameer Mehta | AR-505-M1 | AR-505-M |
| Neel Jain | AR-507-J1 | AR-507-J |
| Dev Jain | AR-508-J1 | AR-508-J |
| Aarav Desai | AR-510-D1 | AR-510-D |
| Vivaan Kothari | AR-512-K1 | AR-512-K |

All 18 passport numbers now follow `AR-[ROOM NUMBER]-[SURNAME INITIAL]` with `2` suffix on conflict (first person gets no suffix).

---

### Fix 2 — Offline banner
**File:** `src/app.js`

Added `initOfflineBanner()` called immediately after `initMilesStore()` in `App.start()` — before any auth-routing early returns, so the banner is always available regardless of login state.

**Behavior:**
- Amber banner at `top: 64px` (below sticky TopBar) when `navigator.onLine === false`
- Auto-hides on `online` event, auto-shows on `offline` event
- Suppressed on map screen (`#screen-map` not hidden) and admin screen (`#screen-admin` not hidden) — both have full-screen layouts where the banner would be intrusive
- A capture-phase `click` listener re-evaluates on every navigation click so map/admin suppression stays current without requiring a route-change hook

**Verified in browser:**
- `displayWhenOffline: "block"` ✓
- `displayOnMap: "none"` ✓
- `displayOnline: "none"` ✓

---

### Fix 3 — CSV import zone validation removed
**File:** `src/services/guestDatabaseService.js`

**Before:** `parseCSVToGuests()` required a non-empty `zone` column, erroring with "missing zone for …" otherwise. Only `name` and `room` should be required per spec — zone is derivable from the room's data.

**After:** Removed `if (!zone) { errors.push(...); skipped++; continue; }`. Only `name`, `family`, and `room` remain required. Family validation against `families.js` was already removed in a prior session.

**CSV test result:**
```
name,family,room,zone,phone,diet,passportNumber
Test Guest,MK Shah,N103,Europe,,Jain Vegetarian,AR-N103-T
```
→ `imported: 1, skipped: 0, errors: []` ✓

---

### Fix 4 — SW cache bump
**File:** `sw.js`

`ar-airways-v21` → `ar-airways-v22`

---

## Files Changed

| File | Change |
|------|--------|
| `src/data/guests.js` | Fixed 6 passport numbers (M1→M, J1→J, D1→D, K1→K) |
| `src/app.js` | Added `initOfflineBanner()` function + call at app start |
| `src/services/guestDatabaseService.js` | Removed zone validation in `parseCSVToGuests()` |
| `sw.js` | Cache bumped to ar-airways-v22 |
| `docs/MASTER_PROGRESS.md` | Pre-August Cleanup 🟢, Firebase + pre-event checklist added |

---

## App Status

**Feature-complete for August Firebase integration.**

All guest-facing screens are built and functional. The app is a fully offline-capable PWA deployable to Cloudflare Pages. The remaining work before the wedding is data (real guest CSV) and infrastructure (Firebase, domain, private repo).
