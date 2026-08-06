/**
 * WhatsOnNow — "What's happening right now" widget for the dashboard.
 *
 * Pure render function. States: live (in-flight), soon (boarding),
 * up-next (upcoming), between events, outside wedding dates.
 * GuestAppScreen refreshes this every 60s via its countdown interval,
 * and also ticks the HH:MM:SS spans every second.
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

function countdownParts(event) {
  const diff = new Date(`${event.date}T${event.startTime}:00+05:30`) - Date.now();
  if (diff <= 0) return { h: "00", m: "00", s: "00" };
  return {
    h: String(Math.floor(diff / 3600000)).padStart(2, "0"),
    m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"),
    s: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"),
  };
}

function boardingBoard(event) {
  const { h, m, s } = countdownParts(event);
  return `
    <div class="won-countdown-board">
      <div class="won-countdown-unit">
        <span class="won-countdown-num" id="won-countdown-hrs">${h}</span>
        <span class="won-countdown-label">HRS</span>
      </div>
      <span class="won-countdown-sep">:</span>
      <div class="won-countdown-unit">
        <span class="won-countdown-num" id="won-countdown-mins">${m}</span>
        <span class="won-countdown-label">MIN</span>
      </div>
      <span class="won-countdown-sep">:</span>
      <div class="won-countdown-unit">
        <span class="won-countdown-num" id="won-countdown-secs">${s}</span>
        <span class="won-countdown-label">SEC</span>
      </div>
    </div>
  `;
}

function navBtn() {
  return `<button class="won-navigate" data-route="map">Navigate →</button>`;
}

function upNextCard(event) {
  return `
    <div class="whats-on-now whats-on-now--next">
      <div class="won-status">
        <span class="won-dot won-dot--next"></span>UP NEXT
      </div>
      <div class="won-event-name">${event.icon} ${event.name}</div>
      <div class="won-meta">${event.venueLabel || event.venue}</div>
      ${boardingBoard(event)}
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
    return `
      <div class="whats-on-now whats-on-now--soon">
        <div class="won-status won-status--soon">
          <span class="won-dot won-dot--soon"></span>STARTING SOON
        </div>
        <div class="won-event-name">${event.icon} ${event.name}</div>
        <div class="won-meta">${event.venueLabel || event.venue}</div>
        ${boardingBoard(event)}
        ${navBtn()}
      </div>
    `;
  }

  return upNextCard(event);
}
