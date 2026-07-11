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
import { getSortedRewards, canAfford } from "../../data/rewards.js";
import { RewardCard } from "./RewardCard.js";
import { LeaderboardPage } from "../leaderboard/LeaderboardPage.js";
import { isWeddingWeek } from "../dashboard/TodaysJourney.js";

const WEDDING_START = new Date("2027-01-22T00:00:00+05:30");

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

function preweddingBanner(daysUntil) {
  return `
    <div class="rewards-prewedding-banner">
      <span class="rewards-prewedding-banner__icon">✈</span>
      <div>
        <strong>Redemption opens on 22 January 2027</strong>
        <p>Browse and plan your rewards now${daysUntil > 0 ? ` — opens in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}` : ""}</p>
      </div>
    </div>
  `;
}

export function RewardsPage(view = "rewards") {
  const snapshot = PassengerService.getCurrentSnapshot();
  const balance = snapshot?.balance || 0;
  const weddingActive = isWeddingWeek();
  const daysUntil = weddingActive ? 0 : Math.max(0, Math.ceil((WEDDING_START - new Date()) / (1000 * 60 * 60 * 24)));

  let content;
  if (view === "leaderboard") {
    // Read-only for everyone; PassengerService already returns null for
    // "current guest" in viewer mode, so isSelf naturally never matches.
    content = LeaderboardPage();
  } else if (!AuthService.hasAccess("rewards")) {
    content = rewardsLockedOverlay();
  } else {
    const rewards = getSortedRewards();
    const noneAffordable = !rewards.some(r => canAfford(r, balance));
    const earningHint = weddingActive && noneAffordable ? `
      <div class="empty-state" style="margin-top:var(--s-4)">
        <div class="empty-state__icon">✈</div>
        <p class="empty-state__title">Earn AR Miles at events and the Treasure Hunt to unlock rewards.</p>
        <p class="empty-state__subtitle">Check-in on 22 Jan to get started.</p>
      </div>
    ` : "";
    content = `
      ${!weddingActive ? preweddingBanner(daysUntil) : ""}
      <div class="rewards-grid">${rewards.map(r => RewardCard(r, balance, !weddingActive, daysUntil)).join("")}</div>
      ${earningHint}
    `;
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
