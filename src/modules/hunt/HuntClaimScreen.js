/**
 * HuntClaimScreen — full-screen QR scan claim handler.
 *
 * Shown when a guest navigates via /?hunt=HUNT-NNN (QR code scan).
 * The hunt ID is read from sessionStorage (set by app.js before routing here).
 *
 * Four states:
 *   loading        — 1-second spinner while we look up the location
 *   already-found  — guest already claimed this location
 *   discovery      — first-time find, confetti, clue card, claim button
 *   invalid        — hunt ID doesn't match any known location
 *
 * Miles go through MilesService.earn() — never milesStore directly.
 * Double-claim is prevented by alreadyFound() / markLocationFound() in
 * treasureHunt.js (localStorage per guestId).
 */

import Router from "../../router.js";
import AuthService from "../../services/authService.js";
import MilesService from "../../services/milesService.js";
import {
  getHuntLocation,
  alreadyFound,
  markLocationFound,
} from "../../data/treasureHunt.js";

const LOADING_MS = 1000;

const CONFETTI_COLORS = [
  "#d4af6a", // gold
  "#e6c886", // gold-bright
  "#e74c3c", // red
  "#3498db", // blue
  "#2ecc71", // green
  "#9b59b6", // purple
];

let container = null;

function currentGuestId() {
  const guest = AuthService.getCurrentGuest();
  return guest ? guest.id : null;
}

function confettiHTML() {
  return Array.from({ length: 20 }, (_, i) => {
    const left = i * 5 + 2;
    const delay = (i * 0.1).toFixed(1);
    const duration = (2.5 + (i % 4) * 0.2).toFixed(1);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    return `<div class="hunt-confetti__piece" style="left:${left}%;--delay:${delay}s;--duration:${duration}s;background:${color}"></div>`;
  }).join("");
}

function renderLoading() {
  container.innerHTML = `
    <div class="hunt-claim hunt-claim--loading">
      <div class="hunt-claim__spinner">✈</div>
      <p class="hunt-claim__status">Scanning location…</p>
    </div>
  `;
}

function renderInvalid() {
  container.innerHTML = `
    <div class="hunt-claim hunt-claim--invalid">
      <div class="hunt-claim__icon">❓</div>
      <p class="hunt-claim__discovered">Unknown Location</p>
      <p class="hunt-claim__subtitle">This QR code is not part of the AR Airways Treasure Hunt</p>
      <button class="hunt-claim__cta" data-route="home">Back to Home</button>
    </div>
  `;
  bindRouteLinks();
}

function renderAlreadyFound(location) {
  container.innerHTML = `
    <div class="hunt-claim hunt-claim--found">
      <div class="hunt-claim__icon">${location.icon}</div>
      <p class="hunt-claim__discovered">Already Discovered</p>
      <h2 class="hunt-claim__name">${location.name}</h2>
      <p class="hunt-claim__subtitle">You already claimed +${location.milesReward} AR Miles here ✈</p>
      <button class="hunt-claim__cta" data-route="hunt">Back to Hunt</button>
    </div>
  `;
  bindRouteLinks();
}

function renderDiscovery(location) {
  container.innerHTML = `
    <div class="hunt-claim hunt-claim--discovery">
      <div class="hunt-confetti" aria-hidden="true">${confettiHTML()}</div>
      <div class="hunt-claim__icon hunt-claim__icon--reveal">${location.icon}</div>
      <p class="hunt-claim__discovered">Location Discovered!</p>
      <h2 class="hunt-claim__name">${location.name}</h2>
      <div class="hunt-claim__miles">+${location.milesReward} ✈</div>
      ${location.clueToNext ? `
        <div class="hunt-claim__clue-card">
          <p class="hunt-claim__clue-label">Clue to Next Location</p>
          <p class="hunt-claim__clue-text">${location.clueToNext}</p>
        </div>
      ` : ""}
      <button class="hunt-claim__cta" data-claim>Claim Miles ✈</button>
    </div>
  `;
  container.querySelector("[data-claim]")?.addEventListener("click", () => claimMiles(location));
}

function claimMiles(location) {
  const guestId = currentGuestId();
  if (!guestId) {
    // Viewer mode: redirect to login, pending hunt stays in sessionStorage
    Router.go("onboarding");
    return;
  }

  MilesService.earn(guestId, location.milesReward, `Discovered: ${location.name}`, "HUNT_DISCOVERY");
  markLocationFound(guestId, location.id);
  sessionStorage.removeItem("ar_pending_hunt");

  Router.go("hunt");
}

function bindRouteLinks() {
  container.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });
}

function resolveState() {
  const huntId = sessionStorage.getItem("ar_pending_hunt");

  if (!huntId) {
    Router.go("home");
    return;
  }

  const location = getHuntLocation(huntId);
  if (!location) {
    renderInvalid();
    return;
  }

  const guestId = currentGuestId();
  if (guestId && alreadyFound(guestId, huntId)) {
    renderAlreadyFound(location);
    return;
  }

  renderDiscovery(location);
}

function mount() {
  container = document.getElementById("screen-hunt-claim");
}

function show() {
  container.hidden = false;
  renderLoading();
  setTimeout(resolveState, LOADING_MS);
}

function hide() {
  container.hidden = true;
}

export const HuntClaimScreen = { mount, show, hide };
