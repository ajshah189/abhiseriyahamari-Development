/**
 * TodaysJourney — dashboard summary of today's flights.
 *
 * Reads live from data/events.js, never hardcodes schedule data.
 * Falls back to Day 1's schedule when "today" falls outside the
 * wedding dates (e.g. testing before 22 Jan 2027), so the dashboard
 * is never empty. Rendered fresh on every dashboard mount — status
 * highlighting inside EventTimeline is derived from the clock, not
 * stored, so it stays correct without this component polling.
 */

import { EVENTS, getCurrentOrNextEvent } from "../../data/events.js";
import { EventTimeline } from "../events/EventTimeline.js";

function getTodaysEvents() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const events = EVENTS.filter(e => e.date === todayStr);
  return events.length ? events : EVENTS.filter(e => e.day === 1);
}

export function TodaysJourney() {
  const events = getTodaysEvents();
  const nextEvent = getCurrentOrNextEvent();

  return `
    <section class="dashboard-section">
      <h3>Today's Journey</h3>
      <p class="journey-next">
        Up next: <strong>${nextEvent.icon} ${nextEvent.name}</strong>
        · ${nextEvent.startTime} · ${nextEvent.venueLabel || nextEvent.venue}
      </p>
      ${EventTimeline(events)}
    </section>
  `;
}
