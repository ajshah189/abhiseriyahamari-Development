/**
 * JourneyCompleteCard — end-of-journey stats modal.
 *
 * Auto-shows on Day 3 (24 Jan 2027) after 18:00 IST; always visible in dev.
 * Accessible any time from the Profile page via "My Journey Summary ✈".
 */

import MilesService from "../../services/milesService.js";
import { EVENTS } from "../../data/events.js";
import { getFoundLocations } from "../../data/treasureHunt.js";

const JOURNEY_END_MS = new Date("2027-01-24T18:00:00+05:30").getTime();
const IS_DEV = true;

export function isJourneyComplete() {
  return IS_DEV || Date.now() >= JOURNEY_END_MS;
}

export function buildJourneyStats(guestId) {
  const totalMiles = MilesService.getBalance(guestId);
  const ledger     = MilesService.getLedger(guestId);

  const eventsAttended = ledger.filter(tx => tx.kind === "EVENT_ATTENDANCE").length;
  const countriesVisited = new Set(EVENTS.map(e => e.country)).size;
  const huntFound = getFoundLocations(guestId).length;
  const connections = ledger.filter(tx => tx.kind === "SOCIAL_CONNECTION").length;

  return { totalMiles, eventsAttended, countriesVisited, huntFound, connections };
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function showJourneyCompleteCard(snapshot, stats) {
  document.querySelector(".journey-complete-overlay")?.remove();

  const name = snapshot?.profile?.passengerName || snapshot?.displayName || "Traveller";
  const waText = encodeURIComponent(
    `✈ My AR Airways journey is complete!\n\n` +
    `${name}'s stats:\n` +
    `• ${stats.totalMiles.toLocaleString()} AR Miles earned\n` +
    `• ${stats.eventsAttended} events attended\n` +
    `• ${stats.countriesVisited} countries visited\n` +
    `• ${stats.huntFound} treasures discovered\n` +
    `• ${stats.connections} fellow travellers connected\n\n` +
    `What an unforgettable celebration with Riya & Abhishek! 💛✈`
  );

  const overlay = document.createElement("div");
  overlay.className = "journey-complete-overlay";
  overlay.innerHTML = `
    <div class="journey-complete-card">
      <button class="journey-complete-card__close" aria-label="Close">✕</button>
      <div class="journey-complete-card__badge">🎉</div>
      <h2 class="journey-complete-card__title">Journey Complete</h2>
      <p class="journey-complete-card__sub">Your AR Airways adventure, ${esc(name)}</p>
      <div class="journey-complete-stats">
        <div class="journey-complete-stat">
          <div class="journey-complete-stat__value">${stats.totalMiles.toLocaleString()}</div>
          <div class="journey-complete-stat__label">AR Miles ✈</div>
        </div>
        <div class="journey-complete-stat">
          <div class="journey-complete-stat__value">${stats.eventsAttended}</div>
          <div class="journey-complete-stat__label">Events Attended</div>
        </div>
        <div class="journey-complete-stat">
          <div class="journey-complete-stat__value">${stats.countriesVisited}</div>
          <div class="journey-complete-stat__label">Countries Visited</div>
        </div>
        <div class="journey-complete-stat">
          <div class="journey-complete-stat__value">${stats.huntFound}</div>
          <div class="journey-complete-stat__label">Treasures Found</div>
        </div>
        <div class="journey-complete-stat">
          <div class="journey-complete-stat__value">${stats.connections}</div>
          <div class="journey-complete-stat__label">Connections Made</div>
        </div>
      </div>
      <a class="journey-complete-cta"
         href="https://wa.me/?text=${waText}"
         target="_blank"
         rel="noopener noreferrer">
        Share on WhatsApp 📱
      </a>
    </div>
  `;

  overlay.querySelector(".journey-complete-card__close")
    .addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
