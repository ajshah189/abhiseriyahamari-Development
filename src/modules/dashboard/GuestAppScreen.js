/**
 * GuestAppScreen — Router adapter for the guest dashboard.
 *
 * Renders HomePage() once, on first visit, into #screen-guest. After
 * that, go() only toggles visibility — the DOM (and its AppStore
 * subscriptions) stays alive in the background, so live miles updates
 * keep working even while another screen is showing.
 */

import { HomePage } from "./HomePage.js";
import Router from "../../router.js";

let container = null;

function bindRoutes() {
  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => Router.go(button.dataset.route));
  });
}

function mount() {
  container = document.getElementById("screen-guest");
  container.innerHTML = HomePage();
  bindRoutes();
}

function show() {
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const GuestAppScreen = { mount, show, hide };
