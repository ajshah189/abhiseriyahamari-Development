/**
 * HuntPage — Treasure Hunt hub. Pure render function.
 *
 * Pre-wedding: countdown banner, how-to, locked state.
 * Wedding week, 0 found: "BEGIN YOUR HUNT" hero with first clue.
 * Wedding week, 1+ found: progress bar, gate tabs, location grid.
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import AuthService from "../../services/authService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { HUNT_LOCATIONS, getFoundLocations, getFoundTimestamps } from "../../data/treasureHunt.js";
import { isWeddingWeek } from "../dashboard/TodaysJourney.js";

const WEDDING_START = new Date("2027-01-22T00:00:00+05:30");
const DAY_LABELS = { 1: "22 JAN", 2: "23 JAN", 3: "24 JAN" };
const TOTAL_MILES = HUNT_LOCATIONS.reduce((s, l) => s + l.milesReward, 0);

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

function formatFoundTime(isoTime) {
  if (!isoTime) return null;
  try {
    return new Date(isoTime).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch {
    return null;
  }
}

function locationCard(loc, isFound, timeStr, isNext) {
  if (isFound) {
    return `
      <div class="hunt-location-card hunt-location-card--found">
        <div class="hunt-location-card__icon">✅</div>
        <div class="hunt-location-card__body">
          <div class="hunt-location-card__name">
            <span>${loc.name}</span>
            <span class="hunt-location-card__miles">+${loc.milesReward} ✈</span>
          </div>
          <div class="hunt-location-card__hint hunt-location-card__found-label">Found${timeStr ? ` · ${timeStr}` : " ✓"}</div>
          ${loc.clueToNext
            ? `<div class="hunt-location-card__next-clue">
                <span class="hunt-location-card__clue-label">NEXT CLUE ↗</span>
                <em>${loc.clueToNext}</em>
              </div>`
            : `<div class="hunt-location-card__hint" style="color:var(--gold);margin-top:var(--s-2);font-weight:600">All locations found — Champion Traveller! 🏆</div>`}
        </div>
      </div>
    `;
  }

  return `
    <div class="hunt-location-card hunt-location-card--locked${isNext ? " hunt-location-card--next" : ""}">
      <div class="hunt-location-card__icon">🔒</div>
      <div class="hunt-location-card__body">
        <div class="hunt-location-card__name">
          <span>Hidden Location</span>
          <span class="hunt-location-card__miles">+${loc.milesReward} ✈</span>
        </div>
        <div class="hunt-location-card__hint">${loc.hint}</div>
        <div class="hunt-location-card__reward">+${loc.milesReward} ✈ reward when found</div>
      </div>
    </div>
  `;
}

function huntHero(firstLoc) {
  return `
    <div class="hunt-hero">
      <div class="hunt-hero__eyebrow">🗺️ AR Airways Treasure Hunt</div>
      <h2 class="hunt-hero__title">Begin Your Hunt</h2>
      <div class="hunt-hero__clue-card">
        <div class="hunt-hero__clue-label">YOUR FIRST CLUE</div>
        <p class="hunt-hero__clue-text">"${firstLoc.hint}"</p>
        <div class="hunt-hero__clue-location">📍 ${firstLoc.location}</div>
      </div>
      <button class="hunt-hero__cta" data-start-hunt>Start Treasure Hunt →</button>
      <p class="hunt-hero__sub">Find all ${HUNT_LOCATIONS.length} locations · Earn ${TOTAL_MILES.toLocaleString()} ✈</p>
    </div>
  `;
}

function progressBar(found, total, huntMiles) {
  const pct = Math.round((found / total) * 100);
  return `
    <div class="hunt-progress">
      <div class="hunt-progress__header">
        <span class="hunt-progress__count">${found} / ${total} locations</span>
        <span class="hunt-progress__miles">${huntMiles} ✈ earned</span>
      </div>
      <div class="hunt-progress__bar">
        <div class="hunt-progress__fill" style="width:${pct}%"></div>
      </div>
    </div>
  `;
}

function gateTabs(activeDay) {
  return `
    <div class="hunt-day-tabs">
      ${[1, 2, 3].map(day => `
        <button class="hunt-day-tab${activeDay === day ? " hunt-day-tab--active" : ""}" data-hunt-day="${day}">
          GATE ${day} · ${DAY_LABELS[day]}
        </button>
      `).join("")}
    </div>
  `;
}

function howToPlay() {
  return `
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
  `;
}

export function HuntPage(activeDay) {
  const passenger = PassengerService.getCurrentPassenger();
  const guestId = passenger?.id || null;
  const isLoggedIn = AuthService.isLoggedIn();

  // Pre-wedding state
  if (!isWeddingWeek()) {
    const now = new Date();
    const days = Math.ceil((WEDDING_START - now) / (1000 * 60 * 60 * 24));
    return `
      ${TopBar()}
      <main class="hunt-page">
        <div class="hunt-header">
          <h1 class="hunt-title">🗺️ Treasure Hunt</h1>
        </div>
        <div class="empty-state" style="padding:var(--s-8) var(--s-4)">
          <div class="empty-state__icon">🗺️</div>
          <p class="empty-state__title">Treasure Hunt unlocks on 22 January 2027</p>
          <p class="empty-state__subtitle">
            ${days > 0 ? `${days} day${days !== 1 ? "s" : ""} to go · ` : ""}${HUNT_LOCATIONS.length} QR codes hidden around Aayush Resort.<br>
            Scan them to earn AR Miles and win big.
          </p>
        </div>
        ${howToPlay()}
      </main>
      ${BottomNav("hunt")}
    `;
  }

  // Not logged in
  if (!isLoggedIn) {
    return `
      ${TopBar()}
      <main class="hunt-page">
        <div class="hunt-header">
          <h1 class="hunt-title">🗺️ Treasure Hunt</h1>
        </div>
        <div class="access-locked">
          <div class="access-locked__icon">🗺️</div>
          <p class="access-locked__message">Log in with your passport number to participate and earn AR Miles</p>
          <button class="access-locked__cta" data-route="onboarding">Enter Passport →</button>
        </div>
        ${howToPlay()}
      </main>
      ${BottomNav("hunt")}
    `;
  }

  const found = getFoundLocations(guestId);
  const timestamps = getFoundTimestamps(guestId);
  const totalFound = found.length;
  const huntMiles = getHuntMiles(guestId);
  const nextLocId = HUNT_LOCATIONS.find(l => !found.includes(l.id))?.id;
  const locationsForDay = HUNT_LOCATIONS.filter(loc => loc.day === activeDay);
  const topHunters = getTopHunters(guestId);

  return `
    ${TopBar()}
    <main class="hunt-page">

      ${totalFound === 0 ? huntHero(HUNT_LOCATIONS[0]) : `
        <div class="hunt-header">
          <h1 class="hunt-title">🗺️ Treasure Hunt</h1>
        </div>
      `}

      ${progressBar(totalFound, HUNT_LOCATIONS.length, huntMiles)}
      ${gateTabs(activeDay)}

      <div class="hunt-location-list">
        ${locationsForDay.map(loc => {
          const isFound = found.includes(loc.id);
          const timeStr = isFound ? formatFoundTime(timestamps[loc.id]) : null;
          const isNext = loc.id === nextLocId;
          return locationCard(loc, isFound, timeStr, isNext);
        }).join("")}
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

      ${howToPlay()}

    </main>
    ${BottomNav("hunt")}
  `;
}
