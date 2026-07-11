/**
 * ConciergeScreen — Router adapter for Guest Services.
 *
 * Handles request submission: saves to ar_requests in localStorage and
 * opens WhatsApp with a pre-filled message to the events contact number.
 * Status sync is pull-based (localStorage) until Firebase in August.
 */

import { ConciergePage, REQUEST_TYPES } from "./ConciergePage.js";
import PassengerService from "../../services/passengerService.js";
import AuthService from "../../services/authService.js";
import Router from "../../router.js";

let container = null;
let state = { selectedTypeId: null, note: "" };

function renderPage() {
  container.innerHTML = ConciergePage(state);
  bindEvents();
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach(el => {
    el.addEventListener("click", () => Router.go(el.dataset.route));
  });

  container.querySelectorAll("[data-req-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.selectedTypeId = btn.dataset.reqType;
      state.note = "";
      renderPage();
    });
  });

  const noteEl = container.querySelector("[data-concierge-note]");
  noteEl?.addEventListener("input", e => { state.note = e.target.value; });

  container.querySelector("[data-concierge-send]")?.addEventListener("click", sendRequest);
}

function sendRequest() {
  const snapshot = PassengerService.getCurrentSnapshot();
  if (!snapshot || snapshot.isViewer) return;

  const selectedType = REQUEST_TYPES.find(t => t.id === state.selectedTypeId);
  if (!selectedType) return;

  const profile   = snapshot.profile;
  const guestId   = snapshot.guestId;
  const guestName = profile?.passengerName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Guest";
  const cottage   = profile?.roomCottage || profile?.room || "";
  const zone      = profile?.roomZone    || "";
  const roomLabel = cottage ? `${cottage}${zone ? ` · ${zone} Zone` : ""}` : "—";
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr   = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const noteText  = state.note.trim();

  const msg = [
    "🛎 *Guest Services Request*",
    `Guest: ${guestName}`,
    `Room: ${roomLabel}`,
    `Request: ${selectedType.label}`,
    noteText ? `Note: ${noteText}` : null,
    `Time: ${timeStr}, ${dateStr}`,
    "",
    "Sent via AR Airways ✈",
  ].filter(l => l !== null).join("\n");

  // Save locally
  const request = {
    id:        Date.now(),
    guestId,
    guestName,
    room:      cottage || "—",
    type:      selectedType.id,
    label:     selectedType.label,
    note:      noteText,
    timestamp: now.toISOString(),
    status:    "pending",
  };
  try {
    const all = JSON.parse(localStorage.getItem("ar_requests") || "[]");
    all.unshift(request);
    localStorage.setItem("ar_requests", JSON.stringify(all));
  } catch {}

  // Open WhatsApp
  const waNumber = (localStorage.getItem("ar_events_contact") || "").replace(/\D/g, "");
  if (waNumber) {
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // Reset and re-render (shows updated My Requests)
  state.selectedTypeId = null;
  state.note = "";
  renderPage();
}

function mount() {
  container = document.getElementById("screen-concierge");
  state = { selectedTypeId: null, note: "" };
  if (!AuthService.isLoggedIn()) { Router.go("home"); return; }
  renderPage();
}

function show() {
  container.hidden = false;
  if (!AuthService.isLoggedIn()) { Router.go("home"); return; }
  state = { selectedTypeId: null, note: "" };
  renderPage();
}

function hide() {
  container.hidden = true;
}

export const ConciergeScreen = { mount, show, hide };
