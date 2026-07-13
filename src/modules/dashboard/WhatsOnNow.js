/**
 * WhatsOnNow — "What's happening right now" widget for the dashboard.
 *
 * Pure render function. States: live (in-flight), soon (boarding),
 * up-next (upcoming), between events, outside wedding dates.
 * GuestAppScreen refreshes this every 60s via its countdown interval.
 */

import { EVENTS, getCurrentOrNextEvent, getEventStatus } from "../../data/events.js";

const WEDDING_START = new Date("2027-01-22T00:00:00+05:30");
const WEDDING_END   = new Date("2027-01-25T00:00:00+05:30");

function isWeddingPeriod() {
  const now = new Date();
  return now >= WEDDING_START && now < WEDDING_END;
}

function getDaysToWedding() {
  const now = new Date();
  return Math.max(1, Math.ceil((WEDDING_START - now) / (1000 * 60 * 60 * 24)));
}

function minutesSince(event) {
  const start = new Date(`${event.date}T${event.startTime}:00+05:30`);
  return Math.floor((Date.now() - start) / 60000);
}

function minutesUntil(event) {
  const start = new Date(`${event.date}T${event.startTime}:00+05:30`);
  return Math.floor((start - Date.now()) / 60000);
}

function fmtRelTime(mins) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function navBtn() {
  return `<button class="won-navigate" data-route="map">Navigate →</button>`;
}

function upNextCard(event) {
  const mins = minutesUntil(event);
  return `
    <div class="whats-on-now whats-on-now--next">
      <div class="won-status">
        <span class="won-dot won-dot--next"></span>UP NEXT
      </div>
      <div class="won-event-name">${event.icon} ${event.name}</div>
      <div class="won-meta">${event.venueLabel || event.venue} · Starts in ${fmtRelTime(mins)}</div>
      ${navBtn()}
    </div>
  `;
}

export function WhatsOnNow() {
  const now = new Date();

  // Outside wedding dates
  if (!isWeddingPeriod()) {
    if (now < WEDDING_START) {
      const days = getDaysToWedding();
      const first = EVENTS.find(e => e.day === 1);
      return `
        <div class="whats-on-now whats-on-now--next">
          <div class="won-status">
            <span class="won-dot won-dot--next"></span>YOUR JOURNEY
          </div>
          <div class="won-event-name">Begins in ${days} day${days !== 1 ? "s" : ""}</div>
          <div class="won-meta">22 January 2027 · Aayush Resort</div>
          ${first ? `<div class="won-meta" style="margin-top:var(--s-2)">First up: ${first.icon} ${first.name} at ${first.startTime}</div>` : ""}
        </div>
      `;
    }
    return `
      <div class="whats-on-now whats-on-now--next">
        <div class="won-status">
          <span class="won-dot won-dot--next"></span>AR AIRWAYS
        </div>
        <div class="won-event-name">Enjoy the celebration ✈</div>
        <div class="won-meta">Thank you for flying with us</div>
      </div>
    `;
  }

  const event = getCurrentOrNextEvent();
  const status = event ? getEventStatus(event) : "landed";

  if (!event || status === "landed") {
    // Look for a future event (e.g. next day's first event)
    const next = EVENTS.find(e => new Date(`${e.date}T${e.startTime}:00+05:30`) > now);
    if (next) return upNextCard(next);
    return `
      <div class="whats-on-now whats-on-now--next">
        <div class="won-status">
          <span class="won-dot won-dot--next"></span>AR AIRWAYS
        </div>
        <div class="won-event-name">Enjoy the celebration ✈</div>
        <div class="won-meta">All flights complete for today</div>
      </div>
    `;
  }

  if (status === "in-flight") {
    const elapsed = minutesSince(event);
    const elapsedText = elapsed < 60
      ? `Started ${elapsed} min ago`
      : `Started ${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`;
    return `
      <div class="whats-on-now whats-on-now--live">
        <div class="won-status won-status--live">
          <span class="won-dot won-dot--live"></span>HAPPENING NOW
        </div>
        <div class="won-event-name">${event.icon} ${event.name}</div>
        <div class="won-meta">${event.venueLabel || event.venue} · ${elapsedText}</div>
        ${navBtn()}
      </div>
    `;
  }

  if (status === "boarding") {
    const mins = minutesUntil(event);
    return `
      <div class="whats-on-now whats-on-now--soon">
        <div class="won-status won-status--soon">
          <span class="won-dot won-dot--soon"></span>STARTING SOON
        </div>
        <div class="won-event-name">${event.icon} ${event.name}</div>
        <div class="won-meta">Starts in ${mins} minute${mins !== 1 ? "s" : ""}</div>
        ${navBtn()}
      </div>
    `;
  }

  return upNextCard(event);
}
