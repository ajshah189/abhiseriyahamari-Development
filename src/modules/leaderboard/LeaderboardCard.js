/**
 * LeaderboardCard — single-row renderers for the leaderboard lists.
 *
 * Pure display. Ranking, sorting and tier/member-count computation all
 * happen in leaderboardService — this file only turns an already-ranked
 * entry into markup.
 */

import MilesService from "../../services/milesService.js";

export function initials(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

// Deterministic per-name hue so each guest's avatar reads as distinct
// without maintaining a manual color list. Exported for reuse anywhere
// else an avatar is derived from a name (e.g. the Profile page).
export function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 42%, 40%)`;
}

/**
 * One row of the individual (Top Passengers) leaderboard.
 */
export function LeaderboardRow(entry) {
  return `
    <div class="leaderboard-row ${entry.isSelf ? "leaderboard-row--self" : ""}">
      <div class="leaderboard-rank">${entry.rank}</div>
      <div class="leaderboard-avatar" style="background:${colorFromName(entry.name)}">${initials(entry.name)}</div>
      <div class="leaderboard-name">
        <div>${entry.name}</div>
        <span class="leaderboard-tier">${entry.tier}</span>
      </div>
      <div class="leaderboard-miles">${MilesService.format(entry.balance)} ✈</div>
    </div>
  `;
}

/**
 * One row of the family leaderboard.
 */
export function FamilyRow(entry) {
  return `
    <div class="leaderboard-row">
      <div class="leaderboard-rank">${entry.rank}</div>
      <div class="leaderboard-avatar" style="background:${entry.color || "var(--panel-hover)"}">${initials(entry.name)}</div>
      <div class="leaderboard-name">
        <div>${entry.name}</div>
        <span class="leaderboard-tier">${entry.memberCount} member${entry.memberCount === 1 ? "" : "s"}</span>
      </div>
      <div class="leaderboard-miles">${MilesService.format(entry.totalBalance)} ✈</div>
    </div>
  `;
}
