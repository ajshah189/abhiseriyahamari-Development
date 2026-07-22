/**
 * ActivityCard — recent AR Miles activity feed.
 *
 * Reads from the live transaction ledger via MilesService.
 * No hardcoded data. Every earn/spend that hits the ledger
 * appears here on re-render.
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import { APP_CONFIG } from "../../config.js";

const KIND_ICONS = {
  OPENING_BALANCE: "✈️",
  CHECK_IN: "🏨",
  EVENT: "💃",
  GAME: "🎯",
  QR_SCAN: "📱",
  SOCIAL: "📸",
  TREASURE: "🗝️",
  HUNT_DISCOVERY: "🗺️",
  COUNTRY_VISIT: "🌍",
  ACHIEVEMENT: "🏅",
  MISSION: "🔎",
  REDEEM: "🎁",
  ADMIN: "⚙️",
  AWARD_MANUAL: "🏆",
  DEDUCT_MANUAL: "↩",
  BONUS: "⭐",
  MANUAL: "✨",
  SOCIAL_CONNECTION: "🤝",
  EVENT_ATTENDANCE: "🎉",
  CHALLENGE: "🎯",
};

const KIND_LABELS = {
  OPENING_BALANCE: "Welcome aboard · Opening balance",
  AWARD_MANUAL: "Award from Ground Crew",
  DEDUCT_MANUAL: "Miles Deducted",
  HUNT_DISCOVERY: "Treasure Hunt discovery",
};

function formatActivityTime(timestamp) {
  const d   = new Date(timestamp);
  const now = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ` at ${time}`;
}

export function ActivityCard() {
  const passenger = PassengerService.getCurrentPassenger();

  if (!passenger) {
    return `
      <section class="dashboard-section">
        <h3>Recent Activity</h3>
        <p class="muted" style="padding:var(--s-4) 0">Log in to see your journey.</p>
      </section>
    `;
  }

  const limit = APP_CONFIG.dashboard.recentActivityLimit;
  const transactions = MilesService.getLedger(passenger.id).slice(0, limit);

  const hasRealActivity = transactions.some(tx => tx.kind !== "OPENING_BALANCE");

  if (transactions.length === 0 || !hasRealActivity) {
    return `
      <section class="dashboard-section">
        <h3>Recent Activity</h3>
        <div class="empty-state">
          <div class="empty-state__icon">✈</div>
          <p class="empty-state__title">No activity yet</p>
          <p class="empty-state__subtitle">Your journey begins at Check-in on 22 January. See you there!</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="dashboard-section">
      <h3>Recent Activity</h3>
      <div class="activity-feed">
        ${transactions.map(tx => {
          const icon  = KIND_ICONS[tx.kind] || "✨";
          const label = KIND_LABELS[tx.kind] || tx.reason;
          const sign  = tx.amount >= 0 ? "+" : "";
          return `
            <div class="feed-item">
              <div class="feed-icon">${icon}</div>
              <div class="feed-content">
                <h4>${label}</h4>
                <p>${formatActivityTime(tx.createdAt)}</p>
              </div>
              <div class="feed-miles ${tx.amount < 0 ? "negative" : ""}">
                ${sign}${MilesService.format(tx.amount)}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}
