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
import AuthService from "../../services/authService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { getSortedRewards } from "../../data/rewards.js";
import { RewardCard } from "./RewardCard.js";
import { LeaderboardPage } from "../leaderboard/LeaderboardPage.js";

function balanceBar(snapshot) {
  if (snapshot?.isViewer) {
    return `
      <div class="miles-balance-bar miles-balance-bar--viewer">
        <p>Log in with your passport number to see your AR Miles</p>
      </div>
    `;
  }

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

function rewardsLockedOverlay() {
  return `
    <div class="access-locked">
      <div class="access-locked__icon">🔒</div>
      <p class="access-locked__message">Log in with your passport number to earn and redeem AR Miles</p>
      <button class="access-locked__cta" data-route="onboarding">Enter Passport →</button>
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

  let content;
  if (view === "leaderboard") {
    // Read-only for everyone; PassengerService already returns null for
    // "current guest" in viewer mode, so isSelf naturally never matches.
    content = LeaderboardPage();
  } else if (!AuthService.hasAccess("rewards")) {
    content = rewardsLockedOverlay();
  } else {
    content = `<div class="rewards-grid">${getSortedRewards().map(r => RewardCard(r, balance)).join("")}</div>`;
  }

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
