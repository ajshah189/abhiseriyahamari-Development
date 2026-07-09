/**
 * LeaderboardPage — Top Passengers + Top Families.
 *
 * Pure render fragment, composed into the Rewards hub. All ranking
 * comes from leaderboardService — nothing is sorted here.
 */

import LeaderboardService from "../../services/leaderboardService.js";
import PassengerService from "../../services/passengerService.js";
import { LeaderboardRow, FamilyRow } from "./LeaderboardCard.js";

export function LeaderboardPage() {
  const currentGuest = PassengerService.getCurrentPassenger();
  const overall = LeaderboardService.getOverall(currentGuest?.id);
  const byFamily = LeaderboardService.getByFamily();

  return `
    <section class="dashboard-section">
      <h3>Top Passengers</h3>
      <div class="leaderboard-list">
        ${overall.map(LeaderboardRow).join("")}
      </div>
    </section>

    <section class="dashboard-section">
      <h3>Top Families</h3>
      <div class="leaderboard-list">
        ${byFamily.map(FamilyRow).join("")}
      </div>
    </section>
  `;
}
