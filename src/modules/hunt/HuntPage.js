/**
 * HuntPage — Treasure Hunt hub. Pure render function.
 *
 * Shows day tabs, location cards (revealed after discovery), a
 * top-hunters mini-leaderboard (device-local, same as main leaderboard),
 * and a collapsible how-to-play section. Viewers see the page with a
 * login prompt instead of progress.
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import AuthService from "../../services/authService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { HUNT_LOCATIONS, getFoundLocations } from "../../data/treasureHunt.js";

function getHuntMiles(guestId) {
  if (!guestId) return 0;
  return MilesService.getLedger(guestId)
    .filter(tx => tx.kind === "HUNT_DISCOVERY")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function getTopHunters(currentGuestId) {
  return PassengerService.getAllPassengers()
    .map(g => ({ id: g.id, name: g.displayName, miles: getHuntMiles(g.id) }))
    .filter(g => g.miles > 0)
    .sort((a, b) => b.miles - a.miles)
    .slice(0, 5);
}

function locationCard(loc, isFound) {
  return `
    <div class="hunt-location-card ${isFound ? "hunt-location-card--found" : "hunt-location-card--locked"}">
      <div class="hunt-location-card__icon">${isFound ? "✅" : "🔒"}</div>
      <div class="hunt-location-card__body">
        <div class="hunt-location-card__name">
          <span>${isFound ? loc.name : "???"}</span>
          ${isFound ? `<span class="hunt-location-card__miles">+${loc.milesReward} ✈</span>` : ""}
        </div>
        <div class="hunt-location-card__hint">${loc.hint}</div>
        ${!isFound ? `<div class="hunt-location-card__reward">${loc.milesReward} ✈ reward</div>` : ""}
      </div>
    </div>
  `;
}

export function HuntPage(activeDay) {
  const passenger = PassengerService.getCurrentPassenger();
  const guestId = passenger?.id || null;
  const isLoggedIn = AuthService.isLoggedIn();

  const found = getFoundLocations(guestId);
  const totalFound = found.length;
  const huntMiles = getHuntMiles(guestId);

  const locationsForDay = HUNT_LOCATIONS.filter(loc => loc.day === activeDay);
  const topHunters = getTopHunters(guestId);

  return `
    ${TopBar()}
    <main class="hunt-page">

      <div class="hunt-header">
        <h1 class="hunt-title">🗺️ Treasure Hunt</h1>
        <div class="hunt-stats">
          <span class="hunt-stat">${totalFound} / ${HUNT_LOCATIONS.length} found</span>
          ${isLoggedIn ? `<span class="hunt-stat hunt-stat--miles">+${huntMiles} ✈ earned</span>` : ""}
        </div>
      </div>

      ${!isLoggedIn ? `
        <div class="access-locked">
          <div class="access-locked__icon">🗺️</div>
          <p class="access-locked__message">Log in with your passport number to participate and earn AR Miles</p>
          <button class="access-locked__cta" data-route="onboarding">Enter Passport →</button>
        </div>
      ` : ""}

      <div class="hunt-day-tabs">
        ${[1, 2, 3].map(day => `
          <button
            class="hunt-day-tab ${activeDay === day ? "hunt-day-tab--active" : ""}"
            data-hunt-day="${day}">
            Day ${day}
          </button>
        `).join("")}
      </div>

      ${isLoggedIn && totalFound === 0 ? `
        <div class="empty-state" style="margin:var(--s-4) 0">
          <div class="empty-state__icon">🗺</div>
          <p class="empty-state__title">No locations discovered yet.</p>
          <p class="empty-state__subtitle">
            Your first clue:<br>
            <em>"Where the journey begins for every passenger"</em><br>
            <span style="color:var(--cream-faint);font-size:12px">(Hint: look near the Main Gate)</span>
          </p>
        </div>
      ` : ""}

      <div class="hunt-location-list">
        ${locationsForDay.map(loc => locationCard(loc, found.includes(loc.id))).join("")}
      </div>

      ${topHunters.length > 0 ? `
        <section class="dashboard-section">
          <h3>Top Hunters</h3>
          <div class="hunt-leaderboard">
            ${topHunters.map((h, i) => `
              <div class="hunt-leaderboard__row ${h.id === guestId ? "hunt-leaderboard__row--self" : ""}">
                <span class="hunt-leaderboard__rank">${i + 1}</span>
                <span class="hunt-leaderboard__name">${h.name}</span>
                <span class="hunt-leaderboard__miles">+${h.miles} ✈</span>
              </div>
            `).join("")}
          </div>
        </section>
      ` : ""}

      <section class="dashboard-section">
        <details class="hunt-howto">
          <summary class="hunt-howto__toggle">How to play ↓</summary>
          <div class="hunt-howto__content">
            <p>QR codes are hidden around Aayush Resort. Find them, scan with your phone camera, and earn AR Miles.</p>
            <ol>
              <li>Use the hints below to find QR codes placed around the resort</li>
              <li>Scan the QR code with your phone camera (no app needed)</li>
              <li>Tap "Claim Miles" to earn AR Miles on your account</li>
              <li>Follow the clue card to find the next location</li>
              <li>Find all ${HUNT_LOCATIONS.length} locations to become a Champion Traveller!</li>
            </ol>
          </div>
        </details>
      </section>

    </main>
    ${BottomNav("hunt")}
  `;
}
