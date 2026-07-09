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
  COUNTRY_VISIT: "🌍",
  ACHIEVEMENT: "🏅",
  MISSION: "🔎",
  REDEEM: "🎁",
  ADMIN: "⚙️",
  AWARD_MANUAL: "⚙️",
  BONUS: "⭐",
  MANUAL: "✨",
};

export function ActivityCard() {
  const passenger = PassengerService.getCurrentPassenger();
  if (!passenger) return "";

  const limit = APP_CONFIG.dashboard.recentActivityLimit;
  const transactions = MilesService.getLedger(passenger.id).slice(0, limit);

  if (transactions.length === 0) {
    return `
      <section class="dashboard-section">
        <h3>Recent Activity</h3>
        <p class="muted" style="padding:var(--s-4) 0">Your journey hasn't started yet.</p>
      </section>
    `;
  }

  return `
    <section class="dashboard-section">
      <h3>Recent Activity</h3>
      <div class="activity-feed">
        ${transactions.map(tx => {
          const icon = KIND_ICONS[tx.kind] || "✨";
          const sign = tx.amount >= 0 ? "+" : "";
          return `
            <div class="feed-item">
              <div class="feed-icon">${icon}</div>
              <div class="feed-content">
                <h4>${tx.reason}</h4>
                <p>${MilesService.formatTime(tx.createdAt)}</p>
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
