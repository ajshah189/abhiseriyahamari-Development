/**
 * RewardService — redemption logic over the reward catalogue.
 *
 * The catalogue itself lives in data/rewards.js (single source of
 * truth — the Rewards hub UI reads it directly for display). This
 * service owns the one thing that isn't pure display: redeeming a
 * reward deducts miles via MilesService.spend(), so the ledger always
 * reflects it and the balance never goes out of sync.
 *
 * Redemption is not yet wired into the UI — the Rewards hub shows an
 * "opens on 22 Jan 2027" message instead of calling redeem(). This
 * exists so the plumbing is ready for when redemption actually opens.
 */

import { storageGet, storageSet } from "../utils/storage.js";
import { REWARDS } from "../data/rewards.js";
import MilesService from "./milesService.js";
import AppStore from "../store/appStore.js";

const REDEMPTIONS_KEY = "reward_redemptions";

// Remaining stock per reward, seeded from totalAvailable (null = unlimited).
// Tracked here rather than mutated onto the imported catalogue, since
// data/rewards.js is read elsewhere as the immutable source of truth.
const remainingStock = new Map(
  REWARDS.map(r => [r.id, r.totalAvailable === null ? Infinity : r.totalAvailable])
);

class RewardService {

  getCatalogue() {
    return REWARDS.filter(r => remainingStock.get(r.id) > 0);
  }

  getRewardById(id) {
    return REWARDS.find(r => r.id === id) || null;
  }

  getRedemptions(guestId) {
    const all = storageGet(REDEMPTIONS_KEY, []);
    return all.filter(r => r.guestId === guestId);
  }

  /**
   * Every redemption across every guest, newest first. Admin-only view —
   * getRedemptions(guestId) above stays the one guests themselves use.
   */
  getAllRedemptions() {
    return storageGet(REDEMPTIONS_KEY, []).slice().sort((a, b) => b.redeemedAt - a.redeemedAt);
  }

  /**
   * Redeem a reward. Deducts miles via MilesService.spend(),
   * decrements stock, and records the redemption.
   *
   * Throws if insufficient balance or out of stock.
   */
  redeem(guestId, rewardId) {
    const reward = this.getRewardById(rewardId);
    if (!reward) throw new Error(`Reward ${rewardId} not found.`);
    if (remainingStock.get(rewardId) <= 0) throw new Error(`${reward.name} is out of stock.`);

    // This throws if insufficient balance — intentional, no partial state.
    MilesService.spend(guestId, reward.cost, `Redeemed: ${reward.name}`, "REDEEM");

    remainingStock.set(rewardId, remainingStock.get(rewardId) - 1);

    const redemptions = storageGet(REDEMPTIONS_KEY, []);
    redemptions.push({
      guestId,
      rewardId,
      name: reward.name,
      cost: reward.cost,
      redeemedAt: Date.now(),
    });
    storageSet(REDEMPTIONS_KEY, redemptions);

    AppStore.emit("reward:redeemed", { guestId, reward });

    return { success: true, reward };
  }
}

export default new RewardService();
