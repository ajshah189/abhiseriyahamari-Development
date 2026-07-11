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
 *
 * Countdown interval: started in show(), cleared in hide(). Ticks
 * every second to update #up-next-countdown in-place so the whole
 * page doesn't re-render every second.
 */

import { HomePage } from "./HomePage.js";
import AppStore from "../../store/appStore.js";
import Router from "../../router.js";
import { pullToRefresh } from "../../utils/pullToRefresh.js";
import { getUpNextCountdownText, isWeddingWeek } from "./TodaysJourney.js";
import { getCurrentOrNextEvent, getEventStatus } from "../../data/events.js";

let container     = null;
let refreshTimer  = null;
let countdownTimer = null;

function bindRoutes() {
  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => Router.go(button.dataset.route));
  });
}

function render() {
  container.innerHTML = HomePage();
  bindRoutes();
}

function tickCountdown() {
  const el = container.querySelector("#up-next-countdown");
  if (!el) return;

  const text = getUpNextCountdownText();
  if (text === null) {
    // Event just started or ended — full re-render to pick up new state.
    render();
    return;
  }
  el.textContent = text;
}

function startCountdown() {
  stopCountdown();
  if (!isWeddingWeek()) return; // pre-wedding: days don't need per-second update
  countdownTimer = setInterval(tickCountdown, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function mount() {
  container = document.getElementById("screen-guest");
  render();

  // Batches rapid earns (e.g. admin awarding) into one re-render.
  AppStore.on("miles:changed", () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(render, 80);
  });

  pullToRefresh(container, async () => { render(); });
}

function show() {
  render();
  container.hidden = false;
  startCountdown();
}

function hide() {
  container.hidden = true;
  stopCountdown();
}

export const GuestAppScreen = { mount, show, hide };
