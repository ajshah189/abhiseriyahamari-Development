# Session 15 — Miles Reversal / Deduct Miles in Admin

**Date:** 12 July 2026
**Branch:** develop → main
**SW Cache:** v23 → v24

---

## Summary

Added miles deduction and reversal capability to the admin tool. The ledger remains append-only — deductions are negative transactions with kind `DEDUCT_MANUAL`, preserving the full audit trail. Firebase dual-write fires automatically for all deductions via the existing `addTransaction` path.

---

## Files Changed

| File | Change |
|------|--------|
| `src/models/Transaction.js` | Added `DEDUCT_MANUAL: "DEDUCT_MANUAL"` to TX_KINDS |
| `src/modules/admin/AdminPage.js` | Award/Deduct toggle, negative presets in deduct mode, amber submit button, "↩ Reverse Last" button in guest row |
| `src/modules/admin/AdminScreen.js` | `mode` field in award state, toggle binding, deduct logic in `submitAward()`, new `reverseLastTransaction()` |
| `src/components/cards/ActivityCard.js` | `DEDUCT_MANUAL` icon (↩) and label ("Miles Deducted") |
| `src/modules/admin/admin.css` | Toggle, deduct-mode chip, amber submit, reverse button, guest actions row |
| `sw.js` | v23 → v24 |
| `docs/MASTER_PROGRESS.md` | Miles Reversal 🟢 100% |

---

## Design

### Append-only ledger
Deductions create a new negative transaction — no transactions are ever deleted or modified. This matches the airline-miles architecture already in place.

### Award/Deduct toggle
The Award Miles form now shows a TYPE row with two buttons:
- **✈ Award** (gold highlight) — existing behaviour, positive amounts
- **⚠ Deduct** (amber highlight) — presets flip to -50/-100/-200/-500/-1000, submit turns amber

### Balance guard
Deductions that would push balance below zero are blocked with a toast: `⚠ Cannot deduct N — only M miles available`. The guard runs before `MilesService.spend()` and additionally catch()es the spend throw as a second safety net.

### Reverse Last Transaction
Each expanded guest row in the Guests section now has an "↩ Reverse Last" button. It:
1. Finds the most recent non-DEDUCT_MANUAL, non-OPENING_BALANCE transaction
2. Confirms with `window.confirm()` showing the amount and reason
3. Checks balance can cover the reversal
4. Creates a `DEDUCT_MANUAL` transaction with `reason: "Reversal: <original reason>"`

OPENING_BALANCE transactions are excluded from reversal by the `find()` filter.

### Firebase sync
No changes to FirebaseService. Deductions sync automatically — `milesStore.addTransaction()` already calls `FirebaseService.addTransaction()` fire-and-forget for every transaction, positive or negative.

---

## Verified

- Toggle switches between Award/Deduct mode correctly
- Preset chips show `-50,-100,-200,-500,-1000` in deduct mode
- Submit button reads "Deduct Miles ⚠" in deduct mode
- Functional test: G001 balance 1550 → 1450 after -100 deduction ✓
- Ledger shows `DEDUCT_MANUAL | -100 | Test deduction` ✓
- ActivityCard shows ↩ icon and "Miles Deducted" label for DEDUCT_MANUAL transactions
