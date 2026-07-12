/**
 * LeaderboardPage — Top Passengers + Top Families.
 *
 * Pure render fragment, composed into the Rewards hub. All ranking
 * comes from leaderboardService — nothing is sorted here.
 */

import LeaderboardService from "../../services/leaderboardService.js";
import PassengerService from "../../services/passengerService.js";
import { LeaderboardRow, FamilyRow } from "./LeaderboardCard.js";

const EMPTY_LEADERBOARD = `
  <div class="empty-state" style="padding:var(--s-8) var(--s-4)">
    <div class="empty-state__icon">🏆</div>
    <p class="empty-state__title">The leaderboard fills up as guests check in on 22 Jan.</p>
    <p class="empty-state__subtitle">Will you be #1?</p>
  </div>
`;

export function LeaderboardPage() {
  const currentGuest = PassengerService.getCurrentPassenger();
  const overall  = LeaderboardService.getOverall(currentGuest?.id);
  const byFamily = LeaderboardService.getByFamily();

  const hasActivity = overall.some(e => e.balance > 0);

  if (!hasActivity) {
    return `
      <section class="dashboard-section">
        <h3>Top Passengers</h3>
        ${EMPTY_LEADERBOARD}
      </section>
    `;
  }

  return `
    <section class="dashboard-section">
      <h3>Top Passengers</h3>
      <div class="leaderboard-list">
        ${overall.map(LeaderboardRow).join("")}
      </div>
    </section>

    <section class="dashboard-section">
      <h3>Top Families</h3>
      <div class="leaderboard-list family-leaderboard-list">
        ${byFamily.map(FamilyRow).join("")}
      </div>
    </section>
  `;
}
