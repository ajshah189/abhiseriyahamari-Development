/**
 * EventTimeline — compact vertical timeline of flights.
 *
 * Reused wherever a short schedule summary is needed (dashboard today
 * view; could back an events sidebar tomorrow). Not the full departures
 * board — see EventsPage for that. Status is derived fresh from
 * getEventStatus() on every render, never passed in pre-computed.
 */

import { getEventStatus } from "../../data/events.js";

function rowClass(status) {
  if (status === "landed") return "timeline-row landed";
  if (status === "in-flight" || status === "boarding") return "timeline-row current";
  return "timeline-row upcoming";
}

export function EventTimeline(events = []) {
  return `
    <div class="event-timeline">
      ${events.map(event => {
        const status = getEventStatus(event);
        return `
          <div class="${rowClass(status)}">
            <div class="timeline-row-time">${event.startTime}</div>
            <div class="timeline-row-dot"></div>
            <div class="timeline-row-body">
              <h4>${event.icon} ${event.name}</h4>
              <p>${event.venueLabel || event.venue}</p>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}
