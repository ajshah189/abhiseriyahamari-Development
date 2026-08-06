/**
 * EventsScreen — Router adapter for the departures board.
 *
 * Owns the interactive state EventsPage itself doesn't: which gate/day
 * is selected, and a 60-second refresh so status badges (upcoming ->
 * boarding -> in-flight -> landed) advance on their own while a guest
 * is looking at the screen, with no re-navigation needed.
 */

import { EventsPage } from "./EventsPage.js";
import { EVENTS } from "../../data/events.js";
import Router from "../../router.js";
import { pullToRefresh } from "../../utils/pullToRefresh.js";

const REFRESH_INTERVAL_MS = 60 * 1000;

let container = null;
let selectedDay = 1;
let refreshTimer = null;

function computeDefaultDay() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const match = EVENTS.find(e => e.date === todayStr);
  return match ? match.day : 1;
}

function bindEvents() {
  container.querySelectorAll("[data-day]").forEach((tab) => {
    tab.addEventListener("click", () => {
      selectedDay = Number(tab.dataset.day);
      render();
    });
  });

  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => Router.go(button.dataset.route));
  });

  // Expand/collapse: click the summary row to toggle
  container.querySelectorAll("[data-event-card]").forEach((card) => {
    const summary = card.querySelector(".event-card__summary");
    if (!summary) return;
    summary.addEventListener("click", () => {
      card.classList.toggle("event-card--open");
      const chevron = card.querySelector(".event-card__chevron");
      if (chevron) chevron.textContent = card.classList.contains("event-card--open") ? "▴" : "▾";
    });
  });

  // Navigate button: pre-fill map highlight and route to map
  container.querySelectorAll("[data-event-venue]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      sessionStorage.setItem("ar_map_highlight", btn.dataset.eventVenue);
      Router.go("map");
    });
  });
}

function render() {
  container.innerHTML = EventsPage(selectedDay);
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-events");
  selectedDay = computeDefaultDay();
  render();
  pullToRefresh(container, async () => { render(); });
}

function show() {
  container.hidden = false;
  render();
  refreshTimer = setInterval(render, REFRESH_INTERVAL_MS);
}

function hide() {
  container.hidden = true;
  clearInterval(refreshTimer);
  refreshTimer = null;
}

export const EventsScreen = { mount, show, hide };
