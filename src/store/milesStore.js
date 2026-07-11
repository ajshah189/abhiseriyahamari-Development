/**
 * MilesStore — the transaction ledger.
 *
 * This is the single source of truth for AR Miles.
 * It stores an array of Transaction objects, persisted to localStorage.
 * Balance is NEVER stored — always derived by summing the ledger.
 *
 * Migration: on first launch, each guest's `seedMiles` value from
 * data/guests.js is converted into a single OPENING_BALANCE transaction.
 * After that, the seed value is never consulted again.
 *
 * Emits "miles:changed" via AppStore whenever the ledger mutates,
 * so any subscribed module re-renders automatically.
 */

import { storageGet, storageSet, storageHas } from "../utils/storage.js";
import { createTransaction, TX_KINDS } from "../models/Transaction.js";
import { normalizeGuest } from "../models/Guest.js";
import { guests as rawGuests } from "../data/guests.js";
import AppStore from "./appStore.js";
import FirebaseService from "../services/firebaseService.js";

const LEDGER_KEY = "miles_ledger";
const MIGRATED_KEY = "miles_migrated";

let ledger = [];

/**
 * One-time migration: convert each guest's arMiles number into an
 * OPENING_BALANCE transaction. Runs exactly once per device.
 */
function migrate() {
  if (storageHas(MIGRATED_KEY)) return;

  const normalized = rawGuests.map(normalizeGuest);

  for (const guest of normalized) {
    if (guest.seedMiles > 0) {
      const tx = createTransaction({
        guestId: guest.id,
        amount: guest.seedMiles,
        reason: "Opening Balance",
        kind: TX_KINDS.OPENING_BALANCE,
        createdAt: Date.now(),
      });
      ledger.push(tx);
    }
  }

  persist();
  storageSet(MIGRATED_KEY, true);
}

function persist() {
  storageSet(LEDGER_KEY, ledger);
}

function load() {
  ledger = storageGet(LEDGER_KEY, []);
}

// ---- Public API ----

/**
 * Initialize the store. Must be called once at app startup.
 */
export function initMilesStore() {
  load();
  migrate();
}

/**
 * Append a transaction to the ledger. Persists and emits.
 * Returns the created Transaction.
 */
export function addTransaction({ guestId, amount, reason, kind }) {
  const tx = createTransaction({ guestId, amount, reason, kind });
  ledger.push(tx);
  persist();
  AppStore.emit("miles:changed", {
    guestId,
    balance: getBalance(guestId),
    transaction: tx,
  });
  // Fire-and-forget dual-write to Firebase
  FirebaseService.addTransaction(guestId, tx).catch(() => {});
  return tx;
}

/**
 * Full ledger for a guest, newest first.
 */
export function getLedger(guestId) {
  return ledger
    .filter(tx => tx.guestId === guestId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Full ledger across all guests, newest first.
 */
export function getFullLedger() {
  return ledger.slice().sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Derived balance — the sum of all transactions for a guest.
 * This is the ONLY way to get a balance. Never store it.
 */
export function getBalance(guestId) {
  return ledger
    .filter(tx => tx.guestId === guestId)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Lifetime earned miles (positive transactions only).
 */
export function getLifetimeMiles(guestId) {
  return ledger
    .filter(tx => tx.guestId === guestId && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Miles earned today (positive only, since midnight local time).
 */
export function getTodayMiles(guestId) {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const since = midnight.getTime();

  return ledger
    .filter(tx => tx.guestId === guestId && tx.amount > 0 && tx.createdAt >= since)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Count of unique transaction kinds for a guest (for journey breadth).
 */
export function getUniqueKinds(guestId) {
  const kinds = new Set();
  for (const tx of ledger) {
    if (tx.guestId === guestId) kinds.add(tx.kind);
  }
  return kinds;
}

/**
 * Returns all balances keyed by guestId (for leaderboards).
 */
export function getAllBalances() {
  const map = {};
  for (const tx of ledger) {
    if (!map[tx.guestId]) map[tx.guestId] = 0;
    map[tx.guestId] += tx.amount;
  }
  return map;
}
