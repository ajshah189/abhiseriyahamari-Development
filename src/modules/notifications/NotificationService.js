/**
 * NotificationService — Local event reminders for AR Airways.
 *
 * Pure browser Notification API + setTimeout. No Firebase, no SW push.
 *
 * Lifecycle:
 *   1. App boots → initBell() wires a single document-level click
 *      handler for [data-notif-toggle] (works across TopBar re-renders).
 *   2. Guest logs in → requestPermission() asks for browser permission
 *      then calls scheduleAll() to set timers for every future event.
 *   3. Each timer fires → fire() creates a browser Notification and
 *      prepends it to the localStorage history (max 10 entries).
 *   4. Guest signs out → clearAll() cancels every pending timer and
 *      wipes the history.
 *
 * Two notifications per event:
 *   • 30 min before start: "{icon} {name} boards in 30 minutes — head to {venue}"
 *   • At start:            "{icon} {name} has begun ✈"
 */

import { EVENTS } from "../../data/events.js";

const HISTORY_KEY = "ar_notification_history";
const MAX_HISTORY = 10;

let _timeouts = [];

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Wire the document-level click handler for the bell toggle.
 * Call once at app start — survives TopBar re-renders via delegation.
 */
export function initBell() {
  document.addEventListener("click", _onDocumentClick);
  _refreshBadge();
}

/**
 * Request browser Notification permission.
 * Call after a successful passport login (OnboardingScreen.submit).
 */
export async function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    _scheduleAll();
    return;
  }
  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    if (result === "granted") _scheduleAll();
  }
}

/**
 * Cancel every pending timer and wipe notification history.
 * Call before AuthService.logout().
 */
export function clearAll() {
  _timeouts.forEach(clearTimeout);
  _timeouts = [];
  localStorage.removeItem(HISTORY_KEY);
  _refreshBadge();
  const panel = document.getElementById("notif-panel");
  if (panel) panel.hidden = true;
}

/**
 * Add a notification from an external source (e.g. Firebase social connection)
 * to the local history and refresh the bell badge.
 */
export function addExternalNotification(title, body) {
  _addHistory({ title, body, tag: `ext_${Date.now()}`, ts: Date.now() });
  _refreshBadge();
  _refreshPanel();
}

/**
 * Return the stored notification history (newest first, max 10).
 */
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

// ─── Scheduling ─────────────────────────────────────────────────────────────

function _scheduleAll() {
  const now = Date.now();

  for (const ev of EVENTS) {
    const startMs = new Date(`${ev.date}T${ev.startTime}:00+05:30`).getTime();
    const warnMs  = startMs - 30 * 60 * 1000;

    if (warnMs > now) {
      _timeouts.push(setTimeout(() => _fire(
        `${ev.icon} ${ev.name} boards in 30 minutes`,
        `Head to ${ev.venueLabel} 🛫`,
        `${ev.id}-warn`
      ), warnMs - now));
    }

    if (startMs > now) {
      _timeouts.push(setTimeout(() => _fire(
        `${ev.icon} ${ev.name} has begun ✈`,
        ev.tagline,
        `${ev.id}-start`
      ), startMs - now));
    }
  }
}

// ─── Firing & history ────────────────────────────────────────────────────────

function _fire(title, body, tag) {
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/icons/icon.svg", tag });
    } catch (_) {
      // Ignore — some browsers block Notification in certain contexts.
    }
  }
  _addHistory({ title, body, tag, ts: Date.now() });
  _refreshBadge();
  _refreshPanel();
}

function _addHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function refreshBadge() {
  _refreshBadge();
}

function _refreshBadge() {
  const count = getHistory().length;
  document.querySelectorAll("[data-notif-toggle]").forEach(btn => {
    let badge = btn.querySelector(".notif-bell-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "notif-bell-badge";
        btn.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  });
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function _onDocumentClick(e) {
  const toggleBtn = e.target.closest("[data-notif-toggle]");
  if (toggleBtn) {
    e.stopPropagation();
    _togglePanel(toggleBtn);
    return;
  }
  // Click outside closes the panel.
  const panel = document.getElementById("notif-panel");
  if (panel && !panel.hidden && !panel.contains(e.target)) {
    panel.hidden = true;
  }
}

function _togglePanel(anchorBtn) {
  let panel = document.getElementById("notif-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "notif-panel";
    panel.className = "notif-panel";
    panel.hidden = true;
    document.body.appendChild(panel);
  }

  if (!panel.hidden) {
    panel.hidden = true;
    return;
  }

  panel.innerHTML = _renderPanel();
  panel.hidden = false;

  // Position below the bell button, flush to the right edge.
  const rect = anchorBtn.getBoundingClientRect();
  panel.style.top  = `${rect.bottom + 8}px`;
  panel.style.right = `${window.innerWidth - rect.right}px`;
  panel.style.left  = "";
}

function _refreshPanel() {
  const panel = document.getElementById("notif-panel");
  if (panel && !panel.hidden) panel.innerHTML = _renderPanel();
}

function _renderPanel() {
  const history = getHistory();
  const items = history.length
    ? history.map(n => `
        <div class="notif-panel__item">
          <div class="notif-panel__title">${_esc(n.title)}</div>
          <div class="notif-panel__body">${_esc(n.body)}</div>
          <div class="notif-panel__time">${_fmt(n.ts)}</div>
        </div>`).join("")
    : `<div class="notif-panel__empty">No notifications yet — reminders appear here 30 minutes before each event and again when it begins.</div>`;

  return `
    <div class="notif-panel__header">
      <span class="notif-panel__heading">✈ Flight Reminders</span>
      <span class="notif-panel__count">${history.length} / ${MAX_HISTORY}</span>
    </div>
    <div class="notif-panel__list">${items}</div>`;
}

function _fmt(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function _esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
