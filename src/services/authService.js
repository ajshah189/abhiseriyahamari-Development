/**
 * AuthService — manages guest identity across sessions.
 *
 * Login state persists via localStorage so guests don't re-enter their
 * passport number every visit. This is the SINGLE source of truth for
 * auth state — no screen should read localStorage directly, and
 * PassengerService goes through here rather than re-reading guests.js.
 *
 * Reads data/guests.js directly (like MilesStore's own migration does,
 * for the same reason: PassengerService.getCurrentPassenger() delegates
 * to AuthService.getCurrentGuest(), so AuthService resolving its own
 * guest list here avoids a circular import between the two services).
 *
 * Public API:
 *   AuthService.login(passportNumber) → { success, guest } | { success: false, error }
 *   AuthService.loginAsViewer() → void
 *   AuthService.logout() → void
 *   AuthService.getCurrentGuest() → Guest | null
 *   AuthService.isLoggedIn() → boolean (full mode)
 *   AuthService.isViewer() → boolean
 *   AuthService.hasAccess(feature) → boolean
 */

import { normalizeGuest } from "../models/Guest.js";
import { storageGet, storageSet, storageRemove } from "../utils/storage.js";
import { APP_CONFIG } from "../config.js";
import GuestDatabaseService from "./guestDatabaseService.js";
import FirebaseService from "./firebaseService.js";

const FULL_FEATURES = [
  "miles", "rewards", "passport", "profile", "leaderboard_self",
];
const VIEW_FEATURES = [
  "map", "events", "leaderboard_readonly", "boarding_generic",
];

class AuthService {

  /**
   * Look up a guest by passport number (case-insensitive, trimmed).
   * On success, persists the guest ID and clears viewer mode.
   */
  login(passportNumber) {
    const query = (passportNumber || "").trim().toUpperCase();

    const guest = GuestDatabaseService.getAll().find(
      g => g.passportNumber && g.passportNumber.toUpperCase() === query
    );

    if (!guest) {
      return {
        success: false,
        error: "Passport number not found. Please check your boarding pass.",
      };
    }

    storageSet(APP_CONFIG.auth.storageKey, guest.id);
    storageRemove(APP_CONFIG.auth.viewerKey);

    // Fire-and-forget: migrate existing localStorage ledger to Firebase once per device
    migrateToFirebase(guest).catch(() => {});

    return { success: true, guest };
  }

  /**
   * Browse without a personalised identity. Clears any logged-in guest.
   */
  loginAsViewer() {
    storageSet(APP_CONFIG.auth.viewerKey, true);
    storageRemove(APP_CONFIG.auth.storageKey);
  }

  /**
   * Clears both login and viewer state — back to a first-visit state.
   */
  logout() {
    storageRemove(APP_CONFIG.auth.storageKey);
    storageRemove(APP_CONFIG.auth.viewerKey);
  }

  /**
   * The logged-in guest's full normalized record, or null if in viewer
   * mode / not logged in / the stored ID no longer matches anyone.
   */
  getCurrentGuest() {
    const id = storageGet(APP_CONFIG.auth.storageKey, null);
    if (!id) return null;
    return GuestDatabaseService.getAll().find(g => g.id === id) || null;
  }

  /**
   * True only if a valid guest ID is stored AND it resolves to a real
   * guest — "full mode" per the two-tier access table.
   */
  isLoggedIn() {
    return this.getCurrentGuest() !== null;
  }

  /**
   * True if the guest explicitly chose "Continue as Guest Viewer".
   */
  isViewer() {
    return storageGet(APP_CONFIG.auth.viewerKey, false) === true;
  }

  /**
   * Whether the current auth state (full / viewer / neither) can reach
   * a given feature. VIEW_FEATURES are always allowed; FULL_FEATURES
   * require a real login; anything else is denied by default.
   */
  hasAccess(feature) {
    if (VIEW_FEATURES.includes(feature)) return true;
    if (FULL_FEATURES.includes(feature)) return this.isLoggedIn();
    return false;
  }
}

export default new AuthService();

async function migrateToFirebase(guest) {
  const migrationKey = `ar_firebase_migrated_${guest.id}`;
  if (localStorage.getItem(migrationKey)) return;
  try {
    const existing = await FirebaseService.getTransactions(guest.id);
    if (existing && existing.length > 0) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }
    let guestTxs = [];
    try {
      const ledger = JSON.parse(localStorage.getItem('miles_ledger') || '[]');
      guestTxs = ledger.filter(tx => tx.guestId === guest.id);
    } catch {}
    for (const tx of guestTxs) {
      await FirebaseService.addTransaction(guest.id, tx);
    }
    localStorage.setItem(migrationKey, 'true');
    if (guestTxs.length > 0) {
      console.log(`Firebase: migrated ${guestTxs.length} tx for ${guest.displayName || guest.id}`);
    }
  } catch (e) {
    console.warn('Firebase migration failed:', e.message);
  }
}
