/**
 * EventsPage — the departures board.
 *
 * Pure render function: given a selected day, returns the full screen
 * markup as a string. All interactivity (tab switching, live status
 * refresh) is owned by EventsScreen, which re-invokes this on change —
 * this file has no state of its own.
 */

import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { getEventsForDay, getEventStatus } from "../../data/events.js";

const GATES = [
  { day: 1, label: "Gate 1 — 22 Jan" },
  { day: 2, label: "Gate 2 — 23 Jan" },
  { day: 3, label: "Gate 3 — 24 Jan" },
];

const STATUS_LABEL = {
  upcoming: "Upcoming",
  boarding: "Boarding",
  "in-flight": "In Flight",
  landed: "Landed",
};

function flightCard(event) {
  const status = getEventStatus(event);

  return `
    <div class="flight-card">
      <div class="flight-time">${event.startTime}</div>

      <div class="flight-info">
        <div class="flight-code">${event.flightCode}</div>
        <h3 class="flight-name">${event.icon} ${event.name}</h3>
        <p class="flight-tagline">${event.tagline}</p>
        <div class="flight-country">${event.countryFlag} ${event.country}</div>
        <div class="flight-venue">📍 ${event.venueLabel || event.venue}</div>
        <span class="dresscode-chip">${event.dresscode}</span>
      </div>

      <div class="flight-status">
        <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
        <div class="miles-reward">+ ${event.milesReward} ✈</div>
      </div>
    </div>
  `;
}

export function EventsPage(selectedDay = 1) {
  const dayEvents = getEventsForDay(selectedDay);

  return `
    ${TopBar()}
    <main class="events-page">
      <div class="gate-tabs">
        ${GATES.map(gate => `
          <button class="gate-tab ${gate.day === selectedDay ? "active" : ""}" data-day="${gate.day}">
            ${gate.label}
          </button>
        `).join("")}
      </div>

      <div class="flight-list">
        ${dayEvents.length
          ? dayEvents.map(flightCard).join("")
          : `<p class="muted">No flights scheduled for this gate.</p>`}
      </div>
    </main>
    ${BottomNav("events")}
  `;
}
