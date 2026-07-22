/**
 * TVLeaderboardScreen — fullscreen live leaderboard for projector display.
 *
 * No auth check — loads instantly for anyone at /leaderboard-tv.
 * Uses Firebase-backed LeaderboardService for real-time data.
 * 10s setInterval keeps the clock ticking between Firebase pushes.
 */

import LeaderboardService from "../../services/leaderboardService.js";

let container    = null;
let _unsubGuests = null;
let _unsubFamily = null;
let _clockTimer  = null;
let _guests      = [];
let _families    = [];

const MEDALS = ["🥇", "🥈", "🥉"];

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtMiles(n) {
  if (typeof n !== "number") return "0";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function renderGuestList(guests) {
  if (!guests.length) return `<div class="tv-empty">Loading leaderboard…</div>`;
  return `<div class="tv-list">
    ${guests.slice(0, 10).map((g, i) => `
      <div class="tv-row ${i === 0 ? "tv-row--top" : i < 3 ? "tv-row--medal" : ""}">
        <div class="tv-rank">${MEDALS[i] ?? (i + 1)}</div>
        <div class="tv-name">${esc(g.name || g.displayName || "")}</div>
        <div class="tv-miles">${fmtMiles(g.balance)} ✈</div>
      </div>
    `).join("")}
  </div>`;
}

function renderFamilyList(families) {
  if (!families.length) return `<div class="tv-empty">Loading…</div>`;
  return `<div class="tv-list">
    ${families.map((f, i) => `
      <div class="tv-row ${i === 0 ? "tv-row--top" : ""}">
        <div class="tv-rank">${i === 0 ? "🏆" : i + 1}</div>
        <div class="tv-name">${esc(f.name || "")}</div>
        <div class="tv-miles">${fmtMiles(f.total)} ✈</div>
      </div>
    `).join("")}
  </div>`;
}

function render() {
  container.innerHTML = `
    <div class="tv-screen">
      <div class="tv-header">
        <div class="tv-logo">✈ AR Airways</div>
        <div class="tv-live-badge">
          <span class="tv-live-dot"></span>LIVE
        </div>
        <div class="tv-clock">${fmtTime()}</div>
      </div>
      <div class="tv-body">
        <div class="tv-panel">
          <div class="tv-panel-title">🏆 Guest Leaderboard</div>
          ${renderGuestList(_guests)}
        </div>
        <div class="tv-panel">
          <div class="tv-panel-title">🏅 Family Standings</div>
          ${renderFamilyList(_families)}
        </div>
      </div>
      <div class="tv-footer">AR AIRWAYS — WEDDING EDITION · Riya &amp; Abhishek · January 2027</div>
    </div>
  `;
}

function mount() {
  container = document.getElementById("screen-leaderboard-tv");
  render();
}

function show() {
  container.hidden = false;
  _unsubGuests = LeaderboardService.subscribeToLiveLeaderboard((data) => {
    _guests = data || [];
    render();
  });
  _unsubFamily = LeaderboardService.subscribeToLiveFamilyLeaderboard((data) => {
    _families = data || [];
    render();
  });
  _clockTimer = setInterval(render, 10_000);
}

function hide() {
  container.hidden = true;
  if (_unsubGuests) { _unsubGuests(); _unsubGuests = null; }
  if (_unsubFamily) { _unsubFamily(); _unsubFamily = null; }
  if (_clockTimer)  { clearInterval(_clockTimer);  _clockTimer  = null; }
}

export const TVLeaderboardScreen = { mount, show, hide };
