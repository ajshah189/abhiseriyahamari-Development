/**
 * RewardsPage — the Rewards hub.
 *
 * Pure render function, takes a "view" param ("rewards" | "leaderboard").
 * The balance bar is always visible; the segmented control below it
 * swaps between the reward catalogue grid and the leaderboard without
 * a route change — RewardsScreen owns which view is active and
 * re-invokes this on toggle.
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { getSortedRewards } from "../../data/rewards.js";
import { RewardCard } from "./RewardCard.js";
import { LeaderboardPage } from "../leaderboard/LeaderboardPage.js";

function balanceBar(snapshot) {
  const tierName = snapshot?.tier?.current?.name || "Explorer";

  return `
    <div class="miles-balance-bar">
      <div class="miles-balance-bar__amount">
        ${MilesService.format(snapshot?.balance)} <span>✈ AR Miles</span>
      </div>
      <div class="tier-badge">${tierName}</div>
    </div>
  `;
}

function segmentToggle(activeView) {
  return `
    <div class="segment-toggle">
      <button
        class="segment-toggle__option ${activeView === "rewards" ? "segment-toggle__option--active" : ""}"
        data-view="rewards">
        Rewards
      </button>
      <button
        class="segment-toggle__option ${activeView === "leaderboard" ? "segment-toggle__option--active" : ""}"
        data-view="leaderboard">
        Leaderboard
      </button>
    </div>
  `;
}

export function RewardsPage(view = "rewards") {
  const snapshot = PassengerService.getCurrentSnapshot();
  const balance = snapshot?.balance || 0;

  const content = view === "leaderboard"
    ? LeaderboardPage()
    : `<div class="rewards-grid">${getSortedRewards().map(r => RewardCard(r, balance)).join("")}</div>`;

  return `
    ${TopBar()}
    <main class="rewards-page">
      ${balanceBar(snapshot)}
      ${segmentToggle(view)}
      <div class="rewards-content">
        ${content}
      </div>
    </main>
    ${BottomNav(view)}
  `;
}
