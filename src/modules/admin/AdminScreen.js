/**
 * AdminScreen — Router adapter for the Ground Crew tool.
 *
 * Gated by a sessionStorage PIN flag instead of the mount-once pattern
 * everything else uses: every mount()/show() checks auth first and
 * renders AdminPinGate instead of AdminPage if it's missing. Owns all
 * admin UI state (active section, Award Miles form, Guests
 * search/filter/expansion) as in-memory module state that survives
 * show/hide toggling exactly like every other screen's state — plus
 * two session-scoped override maps (check-in, redemption-fulfilled)
 * that are also mirrored to sessionStorage so a full page reload
 * during the wedding doesn't lose them.
 *
 * Award Miles goes through MilesService.earn() — the same ledger
 * choke point the rest of the app uses — never milesStore directly.
 */

import { AdminPage } from "./AdminPage.js";
import { renderAdminPinGate } from "./AdminPinGate.js";
import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import Router from "../../router.js";

const AUTH_KEY = "ar_admin_auth";
const CHECKIN_KEY = "ar_admin_checkins";
const FULFILLED_KEY = "ar_admin_fulfilled";

function readSessionMap(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function writeSessionMap(key, map) {
  sessionStorage.setItem(key, JSON.stringify(map));
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function createInitialState() {
  return {
    section: "overview",
    award: { search: "", selectedGuestId: null, amount: null, customAmount: "", reason: "" },
    guests: { search: "", tierFilter: "all", expandedGuestId: null },
    checkins: readSessionMap(CHECKIN_KEY),
    fulfilled: readSessionMap(FULFILLED_KEY),
  };
}

let container = null;
let state = createInitialState();

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "admin-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function effectiveCheckIn(guest) {
  const override = state.checkins[guest.id];
  return override === undefined ? guest.checkedIn : override;
}

function renderPage(focus) {
  container.innerHTML = AdminPage(state);
  bindEvents();

  if (focus?.selector) {
    const el = container.querySelector(focus.selector);
    if (el) {
      el.focus();
      if (typeof focus.cursor === "number" && el.setSelectionRange) {
        el.setSelectionRange(focus.cursor, focus.cursor);
      }
    }
  }
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  container.querySelectorAll("[data-admin-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.section = btn.dataset.adminSection;
      renderPage();
    });
  });

  bindAwardEvents();
  bindGuestEvents();
  bindRedemptionEvents();
}

// ---------- Award Miles ----------

function bindAwardEvents() {
  const search = container.querySelector("[data-award-search]");
  search?.addEventListener("input", (e) => {
    state.award.search = e.target.value;
    renderPage({ selector: "[data-award-search]", cursor: e.target.selectionStart });
  });

  container.querySelectorAll("[data-award-guest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.award.selectedGuestId = btn.dataset.awardGuest;
      renderPage();
    });
  });

  container.querySelectorAll("[data-award-amount]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.award.amount = Number(btn.dataset.awardAmount);
      state.award.customAmount = "";
      renderPage();
    });
  });

  const custom = container.querySelector("[data-award-custom]");
  custom?.addEventListener("input", (e) => {
    state.award.customAmount = e.target.value;
    state.award.amount = null;
    renderPage({ selector: "[data-award-custom]", cursor: e.target.selectionStart });
  });

  const reason = container.querySelector("[data-award-reason]");
  reason?.addEventListener("input", (e) => {
    state.award.reason = e.target.value;
    renderPage({ selector: "[data-award-reason]", cursor: e.target.selectionStart });
  });

  container.querySelector("[data-award-submit]")?.addEventListener("click", submitAward);
}

function submitAward() {
  const { selectedGuestId, amount, customAmount, reason } = state.award;
  const finalAmount = customAmount ? Number(customAmount) : amount;

  if (!selectedGuestId) {
    showToast("Select a guest first");
    return;
  }
  if (!finalAmount || finalAmount <= 0) {
    showToast("Enter a valid amount");
    return;
  }
  if (!reason.trim()) {
    showToast("Add a reason for the award");
    return;
  }

  const guest = PassengerService.getPassengerById(selectedGuestId);
  MilesService.earn(selectedGuestId, finalAmount, reason.trim(), "AWARD_MANUAL");

  showToast(`${finalAmount} AR Miles awarded to ${guest?.displayName || "guest"}`);

  state.award = { search: "", selectedGuestId: null, amount: null, customAmount: "", reason: "" };
  renderPage();
}

// ---------- Guests ----------

function bindGuestEvents() {
  const search = container.querySelector("[data-guest-search]");
  search?.addEventListener("input", (e) => {
    state.guests.search = e.target.value;
    renderPage({ selector: "[data-guest-search]", cursor: e.target.selectionStart });
  });

  container.querySelectorAll("[data-guest-tier-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.guests.tierFilter = btn.dataset.guestTierFilter;
      renderPage();
    });
  });

  container.querySelectorAll("[data-guest-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.guestRow;
      state.guests.expandedGuestId = state.guests.expandedGuestId === id ? null : id;
      renderPage();
    });
  });

  container.querySelectorAll("[data-checkin-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.checkinToggle;
      const guest = PassengerService.getPassengerById(id);
      state.checkins[id] = !effectiveCheckIn(guest);
      writeSessionMap(CHECKIN_KEY, state.checkins);
      renderPage();
    });
  });

  container.querySelectorAll("[data-award-shortcut]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.award.selectedGuestId = btn.dataset.awardShortcut;
      state.section = "award";
      renderPage();
    });
  });
}

// ---------- Redemptions ----------

function bindRedemptionEvents() {
  container.querySelectorAll("[data-fulfilled-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.fulfilledToggle;
      state.fulfilled[key] = !state.fulfilled[key];
      writeSessionMap(FULFILLED_KEY, state.fulfilled);
      renderPage();
    });
  });
}

// ---------- Auth gate + Router adapter ----------

function renderGate() {
  if (isAuthed()) {
    renderPage();
    return;
  }

  renderAdminPinGate(container, () => {
    sessionStorage.setItem(AUTH_KEY, "true");
    renderPage();
  });
}

function mount() {
  container = document.getElementById("screen-admin");
  renderGate();
}

function show() {
  container.hidden = false;
  renderGate();
}

function hide() {
  container.hidden = true;
}

export const AdminScreen = { mount, show, hide };
