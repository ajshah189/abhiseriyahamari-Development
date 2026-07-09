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
}

function render() {
  container.innerHTML = EventsPage(selectedDay);
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-events");
  selectedDay = computeDefaultDay();
  render();
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
