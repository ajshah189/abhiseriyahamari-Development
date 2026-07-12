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
 *
 * When the leaderboard tab is active, a Firebase subscription keeps the
 * Top Passengers list live. Unsubscribed on hide().
 */

import { RewardsPage } from "./RewardsPage.js";
import { animateLeaderboard, LeaderboardRow, FamilyRow } from "../leaderboard/LeaderboardCard.js";
import Router from "../../router.js";
import { pullToRefresh } from "../../utils/pullToRefresh.js";
import LeaderboardService from "../../services/leaderboardService.js";
import AuthService from "../../services/authService.js";

const REDEEM_MESSAGE_MS = 2200;

let container = null;
let activeView = "rewards";
let _unsubLeaderboard = null;
let _unsubFamilyLeaderboard = null;

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
    startLiveLeaderboard();
    startLiveFamilyLeaderboard();
  } else {
    stopLiveLeaderboard();
    stopLiveFamilyLeaderboard();
  }
}

function startLiveLeaderboard() {
  if (_unsubLeaderboard) _unsubLeaderboard();
  _unsubLeaderboard = LeaderboardService.subscribeToLiveLeaderboard((entries) => {
    const currentGuest = AuthService.getCurrentGuest();
    const listEl = container?.querySelector('.leaderboard-list');
    if (!listEl) return;
    const enriched = entries.slice(0, 20).map(e => ({
      ...e,
      isSelf: e.guestId === currentGuest?.id,
    }));
    listEl.innerHTML = enriched.map(LeaderboardRow).join('');
  });
}

function stopLiveLeaderboard() {
  if (_unsubLeaderboard) {
    _unsubLeaderboard();
    _unsubLeaderboard = null;
  }
}

function startLiveFamilyLeaderboard() {
  if (_unsubFamilyLeaderboard) _unsubFamilyLeaderboard();
  _unsubFamilyLeaderboard = LeaderboardService.subscribeToLiveFamilyLeaderboard((data) => {
    const listEl = container?.querySelector('.family-leaderboard-list');
    if (listEl) {
      listEl.innerHTML = data.slice(0, 10).map(FamilyRow).join('');
    }
  });
}

function stopLiveFamilyLeaderboard() {
  if (_unsubFamilyLeaderboard) {
    _unsubFamilyLeaderboard();
    _unsubFamilyLeaderboard = null;
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
  stopLiveLeaderboard();
  stopLiveFamilyLeaderboard();
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
