/**
 * GuestAppScreen — Router adapter for the guest dashboard.
 *
 * Re-renders HomePage() on every show(), not just the first mount —
 * matching every other screen built since. Necessary now that "current
 * guest" can actually change mid-session (Sign Out, log back in as
 * someone else, switch to Viewer): a mount-once render would keep
 * showing the previous guest's card forever.
 *
 * The "miles:changed" subscription lives here (subscribed once, at
 * mount) rather than inside HomePage() itself — HomePage used to
 * re-subscribe on every call with no unsubscribe, which was harmless
 * only because it was never called more than once. It now is.
 */

import { HomePage } from "./HomePage.js";
import AppStore from "../../store/appStore.js";
import Router from "../../router.js";

let container = null;
let refreshTimer = null;

function bindRoutes() {
  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => Router.go(button.dataset.route));
  });
}

function render() {
  container.innerHTML = HomePage();
  bindRoutes();
}

function mount() {
  container = document.getElementById("screen-guest");
  render();

  // Batches rapid earns (e.g. admin awarding) into one re-render.
  AppStore.on("miles:changed", () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(render, 80);
  });
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const GuestAppScreen = { mount, show, hide };
