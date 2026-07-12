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
import FirebaseService from "../../services/firebaseService.js";
import Router from "../../router.js";

// Scanner: module-level so video/stream survive renderPage() calls
let _scannerStream   = null;
let _scannerInterval = null;

// Firebase subscriptions — unsubscribed in hide()
let _unsubCheckins  = null;
let _unsubRequests  = null;
let _fbRequests     = null;

const AUTH_KEY = "ar_admin_auth";
const CHECKIN_KEY = "ar_checkins";
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

function readLocalMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function writeLocalMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function createInitialState() {
  return {
    section:       "overview",
    award:         { search: "", selectedGuestId: null, amount: null, customAmount: "", reason: "", mode: "award" },
    guests:        { search: "", tierFilter: "all", expandedGuestId: null },
    scanner:       { passportInput: "", recentCheckins: [], active: false },
    announcements: { message: "", priority: "normal" },
    checkins:      readLocalMap(CHECKIN_KEY),
    fulfilled:     readSessionMap(FULFILLED_KEY),
    import:        { status: "idle", preview: null, result: null },
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

  // Re-attach live camera feed after re-render if scanner is active
  if (state.section === "scanner" && state.scanner.active && _scannerStream) {
    _attachScannerVideo();
  }

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
  bindScannerEvents();
  bindAnnouncementEvents();
  bindRequestEvents();
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

  container.querySelectorAll("[data-award-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.award.mode = btn.dataset.awardMode;
      state.award.amount = null;
      state.award.customAmount = "";
      renderPage();
    });
  });

  container.querySelector("[data-award-submit]")?.addEventListener("click", submitAward);
}

function submitAward() {
  const { selectedGuestId, amount, customAmount, reason, mode } = state.award;
  const isDeduct = mode === "deduct";
  const finalAmount = customAmount ? Number(customAmount) : amount;

  if (!selectedGuestId) { showToast("Select a guest first"); return; }
  if (!finalAmount || finalAmount <= 0) { showToast("Enter a valid amount"); return; }
  if (!reason.trim()) { showToast(`Add a reason for the ${isDeduct ? "deduction" : "award"}`); return; }

  const guest = PassengerService.getPassengerById(selectedGuestId);

  if (isDeduct) {
    const currentBalance = MilesService.getBalance(selectedGuestId);
    if (finalAmount > currentBalance) {
      showToast(`⚠ Cannot deduct ${finalAmount} — only ${currentBalance} miles available`);
      return;
    }
    try {
      MilesService.spend(selectedGuestId, finalAmount, reason.trim(), "DEDUCT_MANUAL");
    } catch (e) {
      showToast(`⚠ ${e.message}`);
      return;
    }
    showToast(`⚠ ${finalAmount} AR Miles deducted from ${guest?.displayName || "guest"}`);
  } else {
    MilesService.earn(selectedGuestId, finalAmount, reason.trim(), "AWARD_MANUAL");
    showToast(`✅ ${finalAmount} AR Miles awarded to ${guest?.displayName || "guest"}`);
  }

  state.award = { search: "", selectedGuestId: null, amount: null, customAmount: "", reason: "", mode: "award" };
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
      const wasCheckedIn = !!effectiveCheckIn(guest);
      state.checkins[id] = wasCheckedIn ? false : new Date().toISOString();
      writeLocalMap(CHECKIN_KEY, state.checkins);
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

  container.querySelectorAll("[data-reverse-last]").forEach((btn) => {
    btn.addEventListener("click", () => reverseLastTransaction(btn.dataset.reverseLast));
  });
}

function reverseLastTransaction(guestId) {
  const transactions = MilesService.getLedger(guestId);
  if (!transactions.length) { showToast("No transactions to reverse"); return; }

  const lastTx = transactions.find(
    tx => tx.kind !== "DEDUCT_MANUAL" && tx.kind !== "OPENING_BALANCE"
  );

  if (!lastTx) { showToast("No reversible transactions found"); return; }

  const guest = PassengerService.getPassengerById(guestId);
  const sign = lastTx.amount > 0 ? "+" : "";
  const confirmed = confirm(
    `Reverse ${sign}${lastTx.amount} AR Miles?\n"${lastTx.reason}"\nAwarded to ${guest?.displayName || guestId}`
  );
  if (!confirmed) return;

  const reversalAmount = Math.abs(lastTx.amount);
  const currentBalance = MilesService.getBalance(guestId);
  if (reversalAmount > currentBalance) {
    showToast(`⚠ Cannot reverse — only ${currentBalance} miles available`);
    return;
  }

  try {
    MilesService.spend(guestId, reversalAmount, `Reversal: ${lastTx.reason}`, "DEDUCT_MANUAL");
    showToast(`↩ Reversed ${reversalAmount} miles for ${guest?.displayName || guestId}`);
    renderPage();
  } catch (e) {
    showToast(`⚠ ${e.message}`);
  }
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
    GuestDatabaseService.commitImport(preview.guests, preview.families);
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

// ---------- Scanner ----------

function _attachScannerVideo() {
  const wrap = container.querySelector("#scanner-viewfinder-wrap");
  if (!wrap || !_scannerStream) return;
  wrap.style.display = "";
  // Remove placeholder text
  const ph = wrap.querySelector("#scanner-placeholder");
  if (ph) ph.remove();
  // Only inject video if not already there
  if (!wrap.querySelector("video")) {
    const video = document.createElement("video");
    video.srcObject = _scannerStream;
    video.className = "scanner-video";
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
    wrap.appendChild(video);
  }
}

async function startScanner() {
  if (!("BarcodeDetector" in window)) {
    showToast("Camera scanning not supported — use manual entry");
    return;
  }
  try {
    _scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
  } catch {
    showToast("Camera access denied — use manual entry");
    return;
  }

  const detector = new BarcodeDetector({ formats: ["qr_code"] });

  // Temporary video for detection (not in DOM)
  const video = document.createElement("video");
  video.srcObject = _scannerStream;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(() => {});

  state.scanner.active = true;
  renderPage();
  _attachScannerVideo();

  _scannerInterval = setInterval(async () => {
    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        stopScanner();
        checkInGuest(barcodes[0].rawValue);
      }
    } catch {}
  }, 500);
}

function stopScanner() {
  if (_scannerInterval) { clearInterval(_scannerInterval); _scannerInterval = null; }
  if (_scannerStream)   { _scannerStream.getTracks().forEach(t => t.stop()); _scannerStream = null; }
  state.scanner.active = false;
  renderPage();
}

function checkInGuest(passportNumber) {
  if (!passportNumber) { showToast("Enter a passport number"); return; }
  const pn    = passportNumber.trim().toUpperCase();
  const guest = GuestDatabaseService.getByPassport(pn);

  if (!guest) {
    showToast(`❌ Passport not found: ${pn}`);
    return;
  }

  // Duplicate guard — warn if already checked in
  const checkins = readLocalMap(CHECKIN_KEY);
  if (checkins[guest.id]) {
    const time = new Date(checkins[guest.id]).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    showToast(`⚠️ ${guest.displayName || guest.id} already checked in at ${time}`);
    return;
  }

  // Mark checked in with timestamp
  checkins[guest.id] = new Date().toISOString();
  writeLocalMap(CHECKIN_KEY, checkins);
  state.checkins = checkins;

  // Push to Firebase (fire-and-forget)
  FirebaseService.checkIn(guest.id).catch(() => {});

  // Award check-in miles once per session
  const milesKey = `ar_checkin_miles_${guest.id}`;
  if (!sessionStorage.getItem(milesKey)) {
    MilesService.earn(guest.id, 100, "Welcome aboard · Check-in bonus", "CHECK_IN");
    sessionStorage.setItem(milesKey, "1");
  }

  const name  = guest.displayName || guest.id;
  const now   = new Date();
  const time  = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  showToast(`✅ ${name} checked in · +100 ✈`);

  state.scanner.recentCheckins.unshift({ name, time });
  if (state.scanner.recentCheckins.length > 10) state.scanner.recentCheckins.length = 10;
  state.scanner.passportInput = "";
  renderPage();
}

function bindScannerEvents() {
  container.querySelector("[data-scanner-start]")?.addEventListener("click", startScanner);
  container.querySelector("[data-scanner-stop]")?.addEventListener("click",  stopScanner);

  const input = container.querySelector("[data-scanner-input]");
  input?.addEventListener("input", e => { state.scanner.passportInput = e.target.value; });
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") checkInGuest(state.scanner.passportInput);
  });

  container.querySelector("[data-scanner-checkin]")?.addEventListener("click", () => {
    checkInGuest(state.scanner.passportInput);
  });
}

// ---------- Announcements ----------

function bindAnnouncementEvents() {
  container.querySelectorAll("[data-ann-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.announcements.message = btn.dataset.annTemplate;
      renderPage({ selector: "[data-ann-message]" });
    });
  });

  const msgEl = container.querySelector("[data-ann-message]");
  msgEl?.addEventListener("input", e => { state.announcements.message = e.target.value; });

  container.querySelectorAll("[data-ann-priority]").forEach(el => {
    el.addEventListener("change", () => { state.announcements.priority = el.value; });
  });

  container.querySelector("[data-ann-send]")?.addEventListener("click", broadcastAnnouncement);

  container.querySelectorAll("[data-ann-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.annDelete);
      try {
        const all = JSON.parse(localStorage.getItem("ar_announcements") || "[]");
        localStorage.setItem("ar_announcements", JSON.stringify(all.filter(a => a.id !== id)));
      } catch {}
      renderPage();
    });
  });
}

function broadcastAnnouncement() {
  const { message, priority } = state.announcements;
  if (!message.trim()) { showToast("Write a message first"); return; }

  const announcement = {
    id:        Date.now(),
    message:   message.trim(),
    priority,
    timestamp: new Date().toISOString(),
    sentBy:    "Ground Crew",
    read:      false,
  };

  try {
    const all = JSON.parse(localStorage.getItem("ar_announcements") || "[]");
    all.unshift(announcement);
    localStorage.setItem("ar_announcements", JSON.stringify(all.slice(0, 20)));
  } catch {}

  // Push to Firebase (fire-and-forget) so all guest devices receive it
  FirebaseService.postAnnouncement(message.trim(), priority).catch(() => {});

  showToast(`📢 Broadcast sent · ${priority === "urgent" ? "URGENT" : "Normal"}`);
  state.announcements.message = "";
  state.announcements.priority = "normal";
  renderPage();
}

// ---------- Requests ----------

function _getRequests() {
  if (_fbRequests !== null) return _fbRequests;
  try { return JSON.parse(localStorage.getItem("ar_requests") || "[]"); } catch { return []; }
}

function updateRequestStatus(requestId, newStatus) {
  const raw = localStorage.getItem(`ar_request_status_${requestId}`) || "";
  let existing = {};
  try { existing = JSON.parse(raw); } catch {}
  const updated = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
    completedAt: newStatus === "done"
      ? (existing.completedAt || new Date().toISOString())
      : (existing.completedAt || ""),
  };
  localStorage.setItem(`ar_request_status_${requestId}`, JSON.stringify(updated));
  // Push status to Firebase (fire-and-forget)
  FirebaseService.updateRequestStatus(requestId, newStatus).catch(() => {});
  showToast("Status updated");
}

function exportRequestsCSV() {
  const requests = _getRequests();
  const header = ["Request ID", "Guest Name", "Room", "Request Type", "Note", "Sent At", "Status", "Completed At"];
  const dataRows = requests.map(r => {
    const raw = localStorage.getItem(`ar_request_status_${r.id}`) || "";
    let status = "pending";
    let completedAt = "";
    try {
      const parsed = JSON.parse(raw);
      status      = parsed?.status      || r.status || "pending";
      completedAt = parsed?.completedAt || "";
    } catch {
      status = raw || r.status || "pending";
    }
    return [r.id, r.guestName || "", r.room || "", r.label || "", r.note || "", r.timestamp || "", status, completedAt];
  });

  const csv = "﻿" + [header, ...dataRows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `ar-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
  showToast(`Exported ${requests.length} request${requests.length !== 1 ? "s" : ""}`);
}

function bindRequestEvents() {
  const contactInput = container.querySelector("[data-events-contact]");
  container.querySelector("[data-events-contact-save]")?.addEventListener("click", () => {
    const val = (contactInput?.value || "").trim();
    localStorage.setItem("ar_events_contact", val);
    showToast("Events contact saved");
  });

  container.querySelector("[data-req-export]")?.addEventListener("click", exportRequestsCSV);

  container.querySelectorAll("[data-req-status]").forEach(sel => {
    sel.addEventListener("change", () => {
      updateRequestStatus(sel.dataset.reqStatus, sel.value);
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

function _startFirebaseSubscriptions() {
  // Sync Firebase check-ins into local state (silent unless on guests/scanner section)
  _unsubCheckins = FirebaseService.subscribeToCheckins((firebaseCheckins) => {
    let changed = false;
    for (const [guestId, data] of Object.entries(firebaseCheckins)) {
      if (data.checkedIn && !state.checkins[guestId]) {
        state.checkins[guestId] = data.date || new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      writeLocalMap(CHECKIN_KEY, state.checkins);
      if (state.section === "guests" || state.section === "scanner") renderPage();
    }
  });

  // Cache Firebase requests — re-render if admin is on requests section
  _unsubRequests = FirebaseService.subscribeToRequests((fbReqs) => {
    _fbRequests = fbReqs;
    if (state.section === "requests") renderPage();
  });
}

function show() {
  container.hidden = false;
  renderGate();
  _startFirebaseSubscriptions();
}

function hide() {
  container.hidden = true;
  // Always clean up camera on exit
  if (_scannerInterval) { clearInterval(_scannerInterval); _scannerInterval = null; }
  if (_scannerStream)   { _scannerStream.getTracks().forEach(t => t.stop()); _scannerStream = null; }
  if (state) state.scanner.active = false;
  if (_unsubCheckins) { _unsubCheckins(); _unsubCheckins = null; }
  if (_unsubRequests) { _unsubRequests(); _unsubRequests = null; }
  _fbRequests = null;
}

export const AdminScreen = { mount, show, hide };
