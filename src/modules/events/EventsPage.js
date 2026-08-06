/**
 * EventsPage — the departures board.
 *
 * Pure render function: given a selected day, returns the full screen
 * markup as a string. All interactivity (tab switching, expand/collapse,
 * navigate) is owned by EventsScreen.
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
  upcoming:  "Upcoming",
  boarding:  "Boarding",
  "in-flight": "In Flight",
  landed:    "Landed",
};

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function eventCard(event) {
  const status = getEventStatus(event);
  const c0 = esc(event.themeColors?.[0] ?? "#d4af6a");
  const c1 = esc(event.themeColors?.[1] ?? "#d4af6a");
  const themeNote = event.themeNote ? ` · ${esc(event.themeNote)}` : "";
  const navigateBtn = event.venueId
    ? `<button class="event-navigate-btn" data-event-venue="${esc(event.venueId)}">Navigate to ${esc(event.venueLabel)} →</button>`
    : `<button class="event-navigate-btn" data-route="map">View Map →</button>`;

  return `
    <div class="event-card event-card--${status}" data-event-card="${esc(event.id)}">

      <div class="event-card__summary">
        <!-- Left: time column -->
        <div class="event-card__time">
          <div class="event-card__clock">${esc(event.startTime)}</div>
          <div class="event-card__code">${esc(event.flightCode)}</div>
        </div>

        <!-- Center: event info -->
        <div class="event-card__body">
          <div class="event-card__flag-name">
            <span class="event-card__flag">${event.countryFlag}</span>
            <span class="event-card__name">${event.icon} ${esc(event.name)}</span>
          </div>
          <div class="event-card__tagline">${esc(event.tagline)}</div>

          <div class="event-card__theme" style="background:linear-gradient(90deg,${c0}22,${c1}22);border-color:${c0}44">
            🎨 ${esc(event.theme)}${themeNote}
          </div>

          <div class="event-card__dresscode">${event.dresscodeEmoji} ${esc(event.dresscode)}</div>
          <div class="event-card__venue">📍 ${esc(event.venueLabel)}</div>
        </div>

        <!-- Right: status + miles -->
        <div class="event-card__right">
          <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
          <div class="event-card__miles">+${event.milesReward} ✈</div>
          <div class="event-card__chevron">▾</div>
        </div>
      </div>

      <!-- Expandable detail -->
      <div class="event-card__expanded">
        <div class="event-expect">
          <div class="event-expect__title">WHAT TO EXPECT</div>
          ${(event.whatToExpect || []).map(item => `<div class="event-expect__item">✓ ${esc(item)}</div>`).join("")}
        </div>

        ${event.bestPhotoSpot ? `
        <div class="event-photo-spot">
          <div class="event-photo-spot__title">📸 BEST PHOTO SPOT</div>
          <div class="event-photo-spot__text">${esc(event.bestPhotoSpot)}</div>
          <div class="event-photo-spot__stars">${stars(event.photoSpotRating ?? 3)}</div>
        </div>
        ` : ""}

        ${navigateBtn}
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
          ? dayEvents.map(eventCard).join("")
          : `<p class="muted">No flights scheduled for this gate.</p>`}
      </div>
    </main>
    ${BottomNav("events")}
  `;
}
