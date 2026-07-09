/**
 * JourneyScreen — Router adapter for the Journey hub.
 *
 * Matches the mount/show/hide pattern used by EventsScreen and
 * MapScreen. Re-renders on every show() (not just the first mount) so
 * the boarding pass reflects live miles/tier data and the flight
 * schedule preview reflects live event status whenever a guest
 * navigates back here.
 */

import { JourneyPage } from "./JourneyPage.js";
import Router from "../../router.js";

let container = null;

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach((el) => {
    el.addEventListener("click", () => Router.go(el.dataset.route));
  });
}

function render() {
  container.innerHTML = JourneyPage();
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-journey");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const JourneyScreen = { mount, show, hide };
