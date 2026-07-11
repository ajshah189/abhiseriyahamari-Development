/**
 * RewardCard — a single reward catalogue tile.
 *
 * Pure display. Afford/redeem logic (canAfford) comes from
 * data/rewards.js; miles formatting comes from MilesService. The
 * actual "Redeem" click behavior (inline confirmation) is wired by
 * RewardsScreen via the data-redeem attribute — this file has no
 * event handling of its own.
 *
 * preWedding: when true, all buttons show "Opens in N days" instead of
 * afford/shortfall state — redemption isn't open yet.
 */

import MilesService from "../../services/milesService.js";
import { canAfford } from "../../data/rewards.js";

const CATEGORY_LABEL = {
  experience: "Experience",
  gift: "Gift",
  "lucky-draw": "Lucky Draw",
  recognition: "Recognition",
};

export function RewardCard(reward, balance, preWedding = false, daysUntil = 0) {
  const affordable = canAfford(reward, balance);
  const shortfall = reward.cost - balance;

  let button;
  if (preWedding) {
    button = `<button class="reward-card__redeem reward-card__redeem--disabled" disabled>Opens in ${daysUntil > 0 ? daysUntil : 0} days · 22 Jan</button>`;
  } else if (affordable) {
    button = `<button class="reward-card__redeem" data-redeem="${reward.id}">Redeem</button>`;
  } else {
    button = `<button class="reward-card__redeem reward-card__redeem--disabled" disabled>Need ${MilesService.format(shortfall)} more</button>`;
  }

  return `
    <div class="reward-card ${reward.featured ? "reward-card--featured" : ""}">
      ${reward.featured ? `<span class="reward-card__badge">Featured</span>` : ""}
      <div class="reward-card__icon">${reward.icon}</div>
      <h4 class="reward-card__name">${reward.name}</h4>
      <p class="reward-card__description">${reward.description}</p>
      <span class="reward-card__category">${CATEGORY_LABEL[reward.category] || reward.category}</span>
      <div class="reward-card__footer">
        <div class="reward-card__cost">${MilesService.format(reward.cost)} ✈</div>
        ${button}
      </div>
    </div>
  `;
}
