/**
 * RewardsScreen — Router adapter for the Rewards hub.
 *
 * Owns which view is active ("rewards" | "leaderboard"). The segmented
 * control toggle is purely local — it calls setView() directly and
 * re-renders without going through the Router, per spec ("no route
 * change needed").
 *
 * The Router-level "rewards" and "leaderboard" routes both point here
 * (registered separately in app.js, each wrapping mount/show with the
 * view they represent) so a deep link to either lands on the right
 * segment pre-selected.
 */

import { RewardsPage } from "./RewardsPage.js";
import { animateLeaderboard } from "../leaderboard/LeaderboardCard.js";
import Router from "../../router.js";
import { pullToRefresh } from "../../utils/pullToRefresh.js";

const REDEEM_MESSAGE_MS = 2200;

let container = null;
let activeView = "rewards";

function bindEvents() {
  container.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeView = btn.dataset.view;
      render();
    });
  });

  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  container.querySelectorAll("[data-redeem]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const original = btn.textContent.trim();
      btn.textContent = "Opens 22 Jan 2027 ✈";
      btn.disabled = true;
      btn.classList.add("reward-card__redeem--confirmed");

      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        btn.classList.remove("reward-card__redeem--confirmed");
      }, REDEEM_MESSAGE_MS);
    });
  });
}

function render() {
  container.innerHTML = RewardsPage(activeView);
  bindEvents();
  if (activeView === "leaderboard") {
    setTimeout(() => animateLeaderboard(), 0);
  }
}

function mount(view) {
  container = document.getElementById("screen-rewards");
  if (view) activeView = view;
  render();
  pullToRefresh(container, async () => { render(); });
}

function show(view) {
  if (view) activeView = view;
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

/**
 * Router registration for a specific initial view. Both "rewards" and
 * "leaderboard" route names get registered against this same screen,
 * each pinned to the segment it represents — see app.js.
 */
function forView(view) {
  return {
    mount: () => mount(view),
    show: () => show(view),
    hide,
  };
}

export const RewardsScreen = { mount, show, hide, forView };
