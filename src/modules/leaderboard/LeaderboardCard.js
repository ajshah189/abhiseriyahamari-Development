/**
 * LeaderboardCard — single-row renderers for the leaderboard lists.
 *
 * Pure display. Ranking, sorting and tier/member-count computation all
 * happen in leaderboardService — this file only turns an already-ranked
 * entry into markup.
 *
 * Exports animateLeaderboard() — call it after inserting leaderboard
 * HTML into the DOM. Runs once per session (sessionStorage flag).
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

const TROPHIES = { 1: "🥇", 2: "🥈", 3: "🥉" };
const TIER_CLASS = { 1: "gold", 2: "silver", 3: "bronze" };

function getRankChange(name, currentRank) {
  const key = `ar_rank_${name.replace(/\W+/g, "_")}`;
  const prev = sessionStorage.getItem(key);
  sessionStorage.setItem(key, String(currentRank));
  if (prev === null) return null;
  return Number(prev) - currentRank; // positive = moved up
}

function rankChangeHtml(delta) {
  if (delta === null || delta === 0) return "";
  if (delta > 0) return ` <span class="rank-change--up">▲${delta}</span>`;
  return ` <span class="rank-change--down">▼${Math.abs(delta)}</span>`;
}

function animateCount(el, target, duration = 1200) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
    el.textContent = `${MilesService.format(Math.round(eased * target))} ✈`;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = `${MilesService.format(target)} ✈`;
  }
  requestAnimationFrame(tick);
}

export function animateLeaderboard() {
  if (sessionStorage.getItem("ar_lb_animated")) return;
  sessionStorage.setItem("ar_lb_animated", "1");
  document.querySelectorAll("[data-miles-target]").forEach(el => {
    const target = Number(el.dataset.milesTarget);
    if (target > 0) animateCount(el, target);
  });
}

export function LeaderboardRow(entry) {
  const trophy = TROPHIES[entry.rank];
  const tierClass = TIER_CLASS[entry.rank];
  const delta = getRankChange(entry.name, entry.rank);

  return `
    <div class="leaderboard-row${entry.isSelf ? " leaderboard-row--self" : ""}${tierClass ? ` leaderboard-row--${tierClass}` : ""}">
      ${trophy
        ? `<div class="leaderboard-trophy">${trophy}</div>`
        : `<div class="leaderboard-rank">${entry.rank}</div>`}
      <div class="leaderboard-avatar" style="background:${colorFromName(entry.name)}">${initials(entry.name)}</div>
      <div class="leaderboard-name">
        <div>${entry.name}${entry.isSelf ? `<span class="leaderboard-you-badge">YOU</span>` : ""}${rankChangeHtml(delta)}</div>
        <span class="leaderboard-tier">${entry.tier}</span>
      </div>
      <div class="leaderboard-miles" data-miles-target="${entry.balance}">${MilesService.format(entry.balance)} ✈</div>
    </div>
  `;
}

export function FamilyRow(entry) {
  const trophy = TROPHIES[entry.rank];
  const tierClass = TIER_CLASS[entry.rank];

  return `
    <div class="leaderboard-row${tierClass ? ` leaderboard-row--${tierClass}` : ""}">
      ${trophy
        ? `<div class="leaderboard-trophy">${trophy}</div>`
        : `<div class="leaderboard-rank">${entry.rank}</div>`}
      <div class="leaderboard-avatar" style="background:${entry.color || "var(--panel-hover)"}">${initials(entry.name)}</div>
      <div class="leaderboard-name">
        <div>${entry.name}</div>
        <span class="leaderboard-tier">${entry.memberCount} member${entry.memberCount === 1 ? "" : "s"}</span>
      </div>
      <div class="leaderboard-miles" data-miles-target="${entry.totalBalance}">${MilesService.format(entry.totalBalance)} ✈</div>
    </div>
  `;
}
