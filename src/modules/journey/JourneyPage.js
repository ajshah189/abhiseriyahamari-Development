/**
 * JourneyPage — the Journey hub.
 *
 * Pure render function. Three stacked sections: the boarding pass
 * (hero), a compact preview of today's flight schedule, and a passport
 * preview of countries visited so far. All data is live — passenger
 * data from PassengerService, event/country data from data/events.js.
 *
 * "View all" and individual flight-card taps both route to the full
 * EventsPage via the "events" route with no params. That page computes
 * the same "today, or Day 1 if outside the wedding dates" default
 * independently (see EventsScreen.computeDefaultDay), so it always
 * lands on the same day this preview is already showing — without this
 * module needing to reach into the Events screen's internals.
 */

import PassengerService from "../../services/passengerService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { APP_CONFIG } from "../../config.js";
import { EVENTS, getEventStatus } from "../../data/events.js";

const STATUS_LABEL = {
  upcoming: "Upcoming",
  boarding: "Boarding",
  "in-flight": "In Flight",
  landed: "Landed",
};

function classFromTier(tierName) {
  if (tierName === "Platinum Voyager" || tierName === "Global Ambassador") return "First";
  if (tierName === "Gold Traveller") return "Business";
  return "Economy";
}

function getTodaysEvents() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const events = EVENTS.filter(e => e.date === todayStr);
  return events.length ? events : EVENTS.filter(e => e.day === 1);
}

function getCountries() {
  const seen = new Map();
  for (const event of EVENTS) {
    if (!seen.has(event.country)) {
      seen.set(event.country, { name: event.country, flag: event.countryFlag });
    }
  }

  return [...seen.values()].map(country => ({
    ...country,
    visited: EVENTS.some(e => e.country === country.name && getEventStatus(e) === "landed"),
  }));
}

function boardingPass(snapshot) {
  const isViewer = snapshot?.isViewer;
  const room = snapshot?.profile?.room || "TBD";
  const zone = snapshot?.profile?.roomZone;
  const cottage = snapshot?.profile?.roomCottage;
  const family = isViewer ? "—" : (snapshot?.profile?.family || "—");
  const tierName = snapshot?.tier?.current?.name || "Explorer";
  const passengerName = isViewer ? "—" : (snapshot?.profile?.passengerName || "Guest");
  const gate = isViewer ? "—" : (zone ? zone.toUpperCase() : "TBD");
  const seat = isViewer ? "—" : (cottage || room);
  const flightClass = isViewer ? "—" : classFromTier(tierName);

  return `
    <div class="boarding-pass">
      <div class="boarding-pass-left">
        <div class="boarding-pass__airline">AR Airways</div>
        <div class="boarding-pass__route">
          <div>
            <div class="boarding-pass__label">From</div>
            <div class="boarding-pass__value">Home</div>
          </div>
          <div class="boarding-pass__plane">✈</div>
          <div>
            <div class="boarding-pass__label">To</div>
            <div class="boarding-pass__value">Aayush Resort</div>
          </div>
        </div>
        <div class="boarding-pass__row">
          <div>
            <div class="boarding-pass__label">Flight</div>
            <div class="boarding-pass__value">AR-2027</div>
          </div>
          <div>
            <div class="boarding-pass__label">Date</div>
            <div class="boarding-pass__value">${APP_CONFIG.weddingDate.display.toUpperCase()}</div>
          </div>
        </div>
        <div class="boarding-pass__row">
          <div>
            <div class="boarding-pass__label">Boarding Group</div>
            <div class="boarding-pass__value">${family}</div>
          </div>
        </div>
      </div>

      <div class="boarding-pass-right">
        <div class="boarding-pass__label">Passenger</div>
        <div class="boarding-pass__name">${passengerName}</div>
        <div class="boarding-pass__row">
          <div>
            <div class="boarding-pass__label">Gate</div>
            <div class="boarding-pass__value">${gate}</div>
          </div>
          <div>
            <div class="boarding-pass__label">Seat</div>
            <div class="boarding-pass__value">${seat}</div>
          </div>
        </div>
        <div class="boarding-pass__class">${flightClass}</div>
      </div>

      <div class="boarding-pass__barcode"></div>
    </div>
  `;
}

function flightPreviewCard(event) {
  const status = getEventStatus(event);

  return `
    <button class="journey-flight-card" data-route="events">
      <div class="journey-flight-time">${event.startTime}</div>
      <div class="journey-flight-body">
        <h4>${event.icon} ${event.name}</h4>
        <p>${event.venueLabel || event.venue}</p>
      </div>
      <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
    </button>
  `;
}

function countryCircle(country) {
  return `
    <div class="country-circle ${country.visited ? "country-circle--visited" : "country-circle--locked"}">
      <div class="country-circle__flag">${country.flag}</div>
      <div class="country-circle__name">${country.name}</div>
    </div>
  `;
}

export function JourneyPage() {
  const snapshot = PassengerService.getCurrentSnapshot();
  const todaysEvents = getTodaysEvents();
  const countries = getCountries();

  return `
    ${TopBar()}
    <main class="journey-page">
      ${boardingPass(snapshot)}

      <section class="dashboard-section">
        <div class="section-header">
          <h3>Flight Schedule</h3>
          <button class="section-link" data-route="events">View all →</button>
        </div>
        <div class="journey-flight-list">
          ${todaysEvents.map(flightPreviewCard).join("")}
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-header">
          <h3>Passport</h3>
          <button class="section-link" data-route="passport">View all →</button>
        </div>
        <div class="country-scroll">
          ${countries.map(countryCircle).join("")}
        </div>
      </section>
    </main>
    ${BottomNav("journey")}
  `;
}
