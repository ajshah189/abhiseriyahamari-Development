/**
 * SocialClaimScreen — guest-to-guest social scanning claim handler.
 *
 * Shown when a guest navigates via /?social=AR-XXX-S (scanned another
 * guest's boarding pass QR). The scanned passport is read from
 * sessionStorage (set by app.js before routing here).
 *
 * States: loading → success | already_connected | self_scan | not_found
 *
 * Both guests earn +50 miles. Each pair can only connect once.
 * Self-scan is blocked. Only works for logged-in guests (not viewers).
 */

import Router from "../../router.js";
import AuthService from "../../services/authService.js";
import MilesService from "../../services/milesService.js";
import GuestDatabaseService from "../../services/guestDatabaseService.js";
import FirebaseService from "../../services/firebaseService.js";

const LOADING_MS = 1000;
const SOCIAL_MILES = 50;

const CONFETTI_COLORS = [
  "#d4af6a", "#e6c886", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6",
];

let container = null;

function confettiHTML() {
  return Array.from({ length: 20 }, (_, i) => {
    const left     = i * 5 + 2;
    const delay    = (i * 0.1).toFixed(1);
    const duration = (2.5 + (i % 4) * 0.2).toFixed(1);
    const color    = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    return `<div class="social-confetti__piece" style="left:${left}%;--delay:${delay}s;--duration:${duration}s;background:${color}"></div>`;
  }).join("");
}

function bindBtn(selector, route) {
  container.querySelector(selector)?.addEventListener("click", () => Router.go(route));
}

// ── State renders ────────────────────────────────────────────────────────────

function renderLoading() {
  container.innerHTML = `
    <div class="social-claim">
      <div class="social-claim__spinner">✈</div>
      <p class="social-claim__status">Connecting passengers…</p>
    </div>
  `;
}

function renderSuccess(guest) {
  container.innerHTML = `
    <div class="social-claim">
      <div class="social-confetti" aria-hidden="true">${confettiHTML()}</div>
      <div class="social-claim__plane">✈</div>
      <div class="social-claim__label">NEW CONNECTION!</div>
      <div class="social-claim__name">${_esc(guest.displayName)}</div>
      <div class="social-claim__miles">+${SOCIAL_MILES} AR Miles each</div>
      <button class="social-claim__btn" data-home>Awesome!</button>
    </div>
  `;
  bindBtn("[data-home]", "home");
}

function renderAlreadyConnected(guest) {
  container.innerHTML = `
    <div class="social-claim">
      <div class="social-claim__icon">🤝</div>
      <div class="social-claim__msg">Already connected!</div>
      <div class="social-claim__sub">You've already connected with ${_esc(guest.displayName)}.</div>
      <button class="social-claim__btn" data-home>Back to Home</button>
    </div>
  `;
  bindBtn("[data-home]", "home");
}

function renderSelfScan() {
  container.innerHTML = `
    <div class="social-claim">
      <div class="social-claim__icon">😄</div>
      <div class="social-claim__msg">That's your own boarding pass!</div>
      <div class="social-claim__sub">Share it with other guests to connect and both earn +${SOCIAL_MILES} AR Miles.</div>
      <button class="social-claim__btn" data-home>Back to Home</button>
    </div>
  `;
  bindBtn("[data-home]", "home");
}

function renderNotFound() {
  container.innerHTML = `
    <div class="social-claim">
      <div class="social-claim__icon">❓</div>
      <div class="social-claim__msg">Passenger not found</div>
      <div class="social-claim__sub">This QR code doesn't match any AR Airways guest.</div>
      <button class="social-claim__btn" data-home>Back to Home</button>
    </div>
  `;
  bindBtn("[data-home]", "home");
}

// ── Connection logic ─────────────────────────────────────────────────────────

async function processSocialClaim(scannedPassport) {
  const scanner = AuthService.getCurrentGuest();
  if (!scanner) return { error: "not_logged_in" };

  const scanned = GuestDatabaseService.getByPassport(scannedPassport.trim().toUpperCase());
  if (!scanned) return { error: "not_found" };

  if (scanned.id === scanner.id) return { error: "self_scan" };

  const connectionKey = [scanner.id, scanned.id].sort().join("_");
  const existing = await FirebaseService.getConnection(connectionKey);
  if (existing) return { error: "already_connected", guest: scanned };

  await FirebaseService.saveConnection(connectionKey, {
    guest1: scanner.id,
    guest2: scanned.id,
    connectedAt: Date.now(),
  });

  MilesService.earn(scanner.id, SOCIAL_MILES, `Connected with ${scanned.displayName}`, "SOCIAL_CONNECTION");
  MilesService.earn(scanned.id, SOCIAL_MILES, `Connected with ${scanner.displayName}`, "SOCIAL_CONNECTION");

  FirebaseService.postNotification(scanned.id, {
    message: `${scanner.displayName} connected with you ✈ +${SOCIAL_MILES} AR Miles`,
    type: "social_connection",
    timestamp: Date.now(),
  }).catch(() => {});

  return { success: true, guest: scanned };
}

async function resolveState() {
  const scannedPassport = sessionStorage.getItem("ar_pending_social");

  if (!scannedPassport) {
    Router.go("home");
    return;
  }

  const scanner = AuthService.getCurrentGuest();
  if (!scanner) {
    Router.go("onboarding");
    return;
  }

  const result = await processSocialClaim(scannedPassport);
  sessionStorage.removeItem("ar_pending_social");

  if (result.error === "not_found")           { renderNotFound();                      return; }
  if (result.error === "self_scan")           { renderSelfScan();                      return; }
  if (result.error === "already_connected")   { renderAlreadyConnected(result.guest);  return; }
  if (result.error === "not_logged_in")       { Router.go("onboarding");               return; }

  renderSuccess(result.guest);
}

// ── Screen lifecycle ─────────────────────────────────────────────────────────

function mount() {
  container = document.getElementById("screen-social-claim");
}

function show() {
  container.hidden = false;
  renderLoading();
  setTimeout(resolveState, LOADING_MS);
}

function hide() {
  container.hidden = true;
}

export const SocialClaimScreen = { mount, show, hide };

// ── Helpers ──────────────────────────────────────────────────────────────────

function _esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
