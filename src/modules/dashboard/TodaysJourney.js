/**
 * TodaysJourney — dashboard hero card + timeline.
 *
 * Up Next / IN FLIGHT / BOARDING NOW hero card above the event timeline.
 * Outside wedding dates (22–24 Jan 2027): shows a pre-wedding countdown
 * with Day 1 preview.
 *
 * The live countdown in #up-next-countdown is only the initial render —
 * GuestAppScreen owns the setInterval that updates it every second and
 * clears it in hide().
 *
 * getUpNextCountdownText() is exported for GuestAppScreen's interval.
 */

import { EVENTS, getCurrentOrNextEvent, getEventStatus } from "../../data/events.js";
import { EventTimeline } from "../events/EventTimeline.js";

const WEDDING_START = new Date("2027-01-22T00:00:00+05:30");
const WEDDING_END   = new Date("2027-01-25T00:00:00+05:30");

export function isWeddingWeek() {
  const now = new Date();
  return now >= WEDDING_START && now < WEDDING_END;
}

/** Public — also used by GuestAppScreen's interval. */
export function getCountdownText(event) {
  const now = new Date();
  const start = new Date(`${event.date}T${event.startTime}:00+05:30`);
  const diff = start - now;
  if (diff <= 0) return null;
  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (hours > 0)   return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getDurationRemaining(event) {
  const now = new Date();
  const end = new Date(`${event.date}T${event.endTime}:00+05:30`);
  const diff = end - now;
  if (diff <= 0) return null;
  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/**
 * Single source of truth for GuestAppScreen's 1-second interval.
 * Returns the text to set on #up-next-countdown, or null when a
 * full re-render is needed (event ended/started).
 */
export function getUpNextCountdownText() {
  if (!isWeddingWeek()) return null;
  const event  = getCurrentOrNextEvent();
  const status = getEventStatus(event);
  if (status === "in-flight") return getDurationRemaining(event); // null → re-render
  if (status === "landed")    return null; // all done — suppress
  return getCountdownText(event); // null → event just started → re-render
}

function upNextCard() {
  const event  = getCurrentOrNextEvent();
  const status = getEventStatus(event);

  if (status === "landed") return ""; // all events over

  const isInFlight = status === "in-flight";
  const isBoarding = status === "boarding";

  let label, countdownHtml, buttonText, extraClass;

  if (isInFlight) {
    const remaining = getDurationRemaining(event);
    if (!remaining) return "";
    label        = "IN FLIGHT";
    countdownHtml = `<div class="up-next__countdown" id="up-next-countdown">${remaining}</div>`;
    buttonText   = "Join Now →";
    extraClass   = "up-next--inflight";
  } else if (isBoarding) {
    const text = getCountdownText(event);
    if (!text) return "";
    label        = "BOARDING NOW";
    countdownHtml = `<div class="up-next__starts-in">Starts in <span class="up-next__countdown" id="up-next-countdown">${text}</span></div>`;
    buttonText   = "Navigate →";
    extraClass   = "up-next--boarding";
  } else {
    const text = getCountdownText(event);
    if (!text) return "";
    label        = "UP NEXT";
    countdownHtml = `<div class="up-next__starts-in">Starts in <span class="up-next__countdown" id="up-next-countdown">${text}</span></div>`;
    buttonText   = "Navigate →";
    extraClass   = "";
  }

  return `
    <div class="up-next ${extraClass}">
      <div class="up-next__label">${label}</div>
      <div class="up-next__name">${event.icon} ${event.name}</div>
      <div class="up-next__meta">${event.venueLabel || event.venue} · ${event.startTime}</div>
      ${countdownHtml}
      <button class="up-next__nav" data-route="map">${buttonText}</button>
    </div>
  `;
}

function getDaysToWedding() {
  const now = new Date();
  const diff = WEDDING_START - now;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function preweddingCard() {
  const days = getDaysToWedding();
  return `
    <div class="up-next up-next--prewedding">
      <div class="up-next__label">YOUR JOURNEY</div>
      <div class="up-next__name">✈ Begins in <strong class="up-next__days">${days} day${days !== 1 ? "s" : ""}</strong></div>
      <div class="up-next__meta">22 January 2027 · Aayush Resort</div>
      <div class="up-next__preview-label">Preview: Day 1 Schedule</div>
    </div>
  `;
}

function getTodaysEvents() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const events = EVENTS.filter(e => e.date === todayStr);
  return events.length ? events : EVENTS.filter(e => e.day === 1);
}

export function TodaysJourney() {
  const events = getTodaysEvents();

  return `
    <section class="dashboard-section">
      <h3>Today's Journey</h3>
      ${isWeddingWeek() ? upNextCard() : preweddingCard()}
      ${EventTimeline(events)}
    </section>
  `;
}
