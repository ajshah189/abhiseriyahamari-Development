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
import GuestDatabaseService from "../../services/guestDatabaseService.js";
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
    import: { status: "idle", preview: null, result: null },
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
  bindQrEvents();
  bindImportEvents();
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

// ---------- QR Codes ----------

function bindQrEvents() {
  container.querySelectorAll("[data-qr-print]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { qrName, qrUrl, qrIcon, qrReward } = btn.dataset;
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;

      const printWin = window.open("", "_blank");
      if (!printWin) return;

      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>AR Airways — ${qrName}</title>
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 40px; background: #fff; color: #0a0a0f; }
    .brand { font-size: 11px; letter-spacing: 3px; color: #d4af6a; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 28px; margin: 12px 0 6px; }
    p { font-size: 15px; color: #555; margin: 4px 0; }
    img { margin: 20px auto; display: block; }
    .url { font-size: 11px; color: #aaa; margin-top: 12px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="brand">AR Airways · Treasure Hunt</div>
  <h1>${qrIcon} ${qrName}</h1>
  <p>Scan to discover this location and earn <strong>+${qrReward} AR Miles</strong></p>
  <img src="${qrSrc}" width="400" height="400" />
  <p class="url">${qrUrl}</p>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
      printWin.document.close();
    });
  });
}

// ---------- Import Guests ----------

function handleFileRead(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showToast("Please select a .csv file");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = GuestDatabaseService.parseCSVToGuests(e.target.result || "");
    state.import = { status: "previewing", preview, result: null };
    renderPage();
  };
  reader.onerror = () => showToast("Failed to read file");
  reader.readAsText(file);
}

function generateGuestsJS(guests) {
  function v(val) {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean" || typeof val === "number") return String(val);
    return JSON.stringify(val);
  }
  const entries = guests.map(g => [
    `  {`,
    `    id: ${v(g.id)},`,
    `    firstName: ${v(g.firstName)},`,
    `    lastName: ${v(g.lastName)},`,
    `    displayName: ${v(g.displayName)},`,
    `    familyId: ${v(g.familyId)},`,
    `    roomId: ${v(g.roomId)},`,
    `    passportId: ${v(g.passportId)},`,
    `    boardingPassId: ${v(g.boardingPassId)},`,
    `    passportNumber: ${v(g.passportNumber)},`,
    `    arMiles: ${v(g.seedMiles || 0)},`,
    `    status: "Explorer",`,
    `    profilePhoto: ${v(g.profilePhoto)},`,
    `    checkedIn: ${v(g.checkedIn)},`,
    `    dietPreference: ${v(g.dietPreference)},`,
    `    emergencyContact: ${v(g.emergencyContact)},`,
    `    role: ${v(g.role || "GUEST")},`,
    `  }`,
  ].join("\n")).join(",\n\n");
  return `export const guests = [\n${entries},\n];\n`;
}

function downloadGuestsJS() {
  const guests = GuestDatabaseService.getAll();
  const content = generateGuestsJS(guests);
  const blob = new Blob([content], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "guests.js";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
  showToast(`guests.js downloaded — ${guests.length} guests`);
}

function downloadTemplate() {
  const lines = [
    "name,family,room,zone,phone,diet,passportNumber",
    '"Abhishek Shah","Shah Family","Japan","Asia","+91 98765 43210","Vegetarian","AR-Japan-S"',
    '"Priya Mehta","Mehta Family","Bali","Asia","+91 87654 32109","Jain Vegetarian",""',
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ar-airways-guest-template.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
}

function bindImportEvents() {
  container.querySelector("[data-import-template]")?.addEventListener("click", downloadTemplate);
  container.querySelector("[data-import-export]")?.addEventListener("click", downloadGuestsJS);

  container.querySelector("[data-import-clear]")?.addEventListener("click", () => {
    GuestDatabaseService.clearImported();
    state.import = { status: "idle", preview: null, result: null };
    showToast("Reverted to mock data");
    renderPage();
  });

  const dropzone = container.querySelector("[data-import-dropzone]");
  const fileInput = container.querySelector("#importFileInput");

  container.querySelector("[data-import-browse]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  dropzone?.addEventListener("click", (e) => {
    if (!e.target.closest("[data-import-browse]")) fileInput?.click();
  });

  fileInput?.addEventListener("change", (e) => {
    handleFileRead(e.target.files?.[0]);
  });

  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("import-dropzone--dragover");
  });
  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("import-dropzone--dragover");
  });
  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("import-dropzone--dragover");
    handleFileRead(e.dataTransfer.files?.[0]);
  });

  container.querySelector("[data-import-confirm]")?.addEventListener("click", () => {
    const { preview } = state.import;
    if (!preview?.guests?.length) return;
    GuestDatabaseService.commitImport(preview.guests);
    state.import = {
      status: "success",
      preview: null,
      result: { imported: preview.imported, skipped: preview.skipped, errors: preview.errors },
    };
    showToast(`${preview.imported} guests imported`);
    renderPage();
  });

  container.querySelector("[data-import-cancel]")?.addEventListener("click", () => {
    state.import = { status: "idle", preview: null, result: null };
    renderPage();
  });

  container.querySelector("[data-import-another]")?.addEventListener("click", () => {
    state.import = { status: "idle", preview: null, result: null };
    renderPage();
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
