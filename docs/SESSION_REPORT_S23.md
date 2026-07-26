# Session 23 — Journey Fix + Chronicle Delete + Diet Removal + Wedding Rituals

**Date:** 2026-07-26
**SW Cache:** `ar-airways-v35`

---

## Goal

Four targeted fixes: correct the Journey Complete auto-show condition, fix chronicle delete to also clean Storage, remove dietary preference from all UI, and build the full Wedding Rituals page system.

---

## Fixes Applied

### FIX 1 — Journey Complete: Only auto-show on Day 3 after 18:00 IST

| File | Change |
|------|--------|
| `src/modules/journey/JourneyCompleteCard.js` | Changed `IS_DEV = true` → `IS_DEV = false` |

The card now only auto-shows once per session on/after 2027-01-24T18:00:00+05:30. "My Journey Summary" on Profile page remains always-accessible as on-demand.

### FIX 2 — Chronicle Delete: also removes photos from Firebase Storage

| File | Change |
|------|--------|
| `src/config/firebase.js` | Added `deleteObject` to Storage imports and exports |
| `src/services/firebaseService.js` | Added `deleteChroniclePhotos(day)` — lists and deletes all photos under `chronicles/day${day}` |
| `src/modules/admin/AdminScreen.js` | Updated handler: confirms, calls both `deleteChronicle` + `deleteChroniclePhotos` in parallel, then re-renders |

### FIX 3 — Remove dietary preference from all UI (keep in data model)

| File | Change |
|------|--------|
| `src/modules/profile/ProfilePage.js` | Removed "Diet Preference" row from `quickInfo()` |
| `src/modules/directory/DirectoryPage.js` | Already clean — no change needed |
| `src/modules/concierge/ConciergePage.js` | Already clean — no change needed |

### FIX 4 — Wedding Rituals Page System

**New files:**

| File | Purpose |
|------|---------|
| `src/data/rituals.js` | RITUALS array (Mameru, Haldi, Lagna) + `getRitualById()` |
| `src/modules/rituals/RitualsPage.js` | Pure render — list view + detail view |
| `src/modules/rituals/RitualsScreen.js` | Router adapter with `show({ ritualId })` support |
| `src/modules/rituals/rituals.css` | Full styles — cards, detail hero, sections, dresscode block |

**Updated files:**

| File | Change |
|------|--------|
| `src/app.js` | Import + register `RitualsScreen`; handle `?ritual=` URL param; add `ritualId` click-through in announcement banner |
| `src/modules/dashboard/QuickActions.js` | Added `🙏 Rituals` to MORE_ACTIONS |
| `src/modules/admin/AdminPage.js` | Import `RITUALS`; added "Link to Ritual" dropdown in announce section |
| `src/modules/admin/AdminScreen.js` | Added `ritualId` to announcements state; wire `[data-ann-ritual]` change; pass `ritualId` to `FirebaseService.postAnnouncement`; reset on send |
| `src/services/firebaseService.js` | Updated `postAnnouncement` to accept and store optional `ritualId` |
| `src/modules/admin/announcements.css` | Added `.announcement-banner--clickable` and `.announcement-banner__link` styles |
| `index.html` | Added `<link>` for `rituals.css`; added `<div id="screen-rituals" hidden>` |
| `sw.js` | Bumped `CACHE_NAME` to `ar-airways-v35`; added 4 rituals files to APP_SHELL |
| `src/config.js` | `cacheName: "ar-airways-v35"`, `cacheVersion: 35` |

---

## Ritual Content

| Ritual | Day | Time | Venue |
|--------|-----|------|-------|
| Mameru | Day 1 · 22 Jan | 11:00 AM | Palace Lawn |
| Haldi | Day 2 · 23 Jan | 10:00 AM | Pool Deck |
| Lagna (Wedding) | Day 3 · 24 Jan | 07:00 AM | The Palace |

Each ritual has: icon, tagline, description, significance, what-to-expect list, dress code.

## Announcement → Ritual Flow

1. Admin selects a ritual in the "Link to Ritual" dropdown before broadcasting
2. `ritualId` is stored in Firebase alongside the announcement
3. When banner appears on guest devices, tapping the text routes to `rituals` detail view for that ritual
4. Close button dismisses without navigating (stopPropagation)

---

## Commit

```
feat(S23): journey fix, chronicle delete+storage, diet removal, wedding rituals page
```
