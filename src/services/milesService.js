/**
 * MilesService — the single choke point for all AR Miles operations.
 *
 * Every module that needs to earn, spend, query balance, or determine
 * tier calls this service. It delegates storage to MilesStore and reads
 * tier configuration from config.js.
 *
 * NEVER mutate a balance directly. NEVER import MilesStore from a UI
 * module. Always go through MilesService.
 */

import { APP_CONFIG } from "../config.js";
import {
  addTransaction,
  getBalance,
  getLifetimeMiles,
  getTodayMiles,
  getLedger,
  getAllBalances,
  getFullLedger,
} from "../store/milesStore.js";

const tiers = APP_CONFIG.arMiles.tiers
  .slice()
  .sort((a, b) => a.minimumMiles - b.minimumMiles);

class MilesService {

  /**
   * Award miles to a guest.
   * Returns the created transaction.
   */
  earn(guestId, amount, reason, kind) {
    if (amount <= 0) {
      throw new Error(`earn() requires a positive amount. Got: ${amount}`);
    }
    return addTransaction({ guestId, amount, reason, kind });
  }

  /**
   * Deduct miles from a guest (reward redemption, penalties).
   * Amount should be positive — it will be stored as negative.
   * Throws if insufficient balance.
   */
  spend(guestId, amount, reason, kind = "REDEEM") {
    if (amount <= 0) {
      throw new Error(`spend() requires a positive amount. Got: ${amount}`);
    }
    const balance = this.getBalance(guestId);
    if (balance < amount) {
      throw new Error(`Insufficient AR Miles. Balance: ${balance}, requested: ${amount}`);
    }
    return addTransaction({ guestId, amount: -amount, reason, kind });
  }

  /**
   * Current derived balance.
   */
  getBalance(guestId) {
    return getBalance(guestId);
  }

  /**
   * Lifetime earned miles (positive transactions only).
   */
  getLifetimeMiles(guestId) {
    return getLifetimeMiles(guestId);
  }

  /**
   * Miles earned today.
   */
  getTodayMiles(guestId) {
    return getTodayMiles(guestId);
  }

  /**
   * Transaction history for a guest, newest first.
   */
  getLedger(guestId) {
    return getLedger(guestId);
  }

  /**
   * Determine the guest's current tier based on lifetime miles.
   */
  getTier(guestId) {
    const lifetime = this.getLifetimeMiles(guestId);
    let current = tiers[0];
    let next = tiers[1] || null;

    for (let i = 0; i < tiers.length; i++) {
      if (lifetime >= tiers[i].minimumMiles) {
        current = tiers[i];
        next = tiers[i + 1] || null;
      }
    }

    const progress = next
      ? Math.min(1, (lifetime - current.minimumMiles) / (next.minimumMiles - current.minimumMiles))
      : 1;

    const toNext = next ? next.minimumMiles - lifetime : 0;

    return { current, next, progress, toNext };
  }

  /**
   * Complete snapshot of a guest's miles state.
   * This is the canonical data shape that every UI component should consume.
   */
  getSnapshot(guestId) {
    return {
      guestId,
      balance: this.getBalance(guestId),
      lifetime: this.getLifetimeMiles(guestId),
      todayMiles: this.getTodayMiles(guestId),
      tier: this.getTier(guestId),
      recentActivity: this.getLedger(guestId).slice(0, APP_CONFIG.dashboard.recentActivityLimit),
    };
  }

  /**
   * All balances for leaderboard computation.
   * Returns { [guestId]: balance }.
   */
  getAllBalances() {
    return getAllBalances();
  }

  /**
   * Total AR Miles ever awarded across every guest (positive
   * transactions only — redemptions/spends don't reduce this figure).
   * Admin Overview stat.
   */
  getTotalAwarded() {
    return getFullLedger()
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Format a miles number for display.
   */
  format(amount) {
    return (amount || 0).toLocaleString("en-IN");
  }

  /**
   * Format a transaction timestamp for display.
   */
  formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
}

export default new MilesService();
