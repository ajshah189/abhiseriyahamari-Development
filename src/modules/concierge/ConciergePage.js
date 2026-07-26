/**
 * ConciergePage — Guest Services request portal.
 *
 * Pure render function. Request type selection, optional note, and
 * "My Requests" history pulled from localStorage. WhatsApp send logic
 * lives in ConciergeScreen.
 */

import PassengerService from "../../services/passengerService.js";

export const REQUEST_TYPES = [
  { id: "clean-room",  icon: "🛏", label: "Clean My Room",  message: "Please clean my room" },
  { id: "towels",      icon: "🛁", label: "Fresh Towels",   message: "Please send fresh towels" },
  { id: "snacks",      icon: "🍽", label: "Room Service",   message: "Please send snacks/water" },
  { id: "maintenance", icon: "🔧", label: "Maintenance",    message: "Something needs fixing" },
  { id: "help",        icon: "❓", label: "Need Help",      message: "I need assistance" },
  { id: "other",       icon: "💬", label: "Other",          message: "" },
];

function formatReqTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const t = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return isToday ? `Today ${t}` : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " + t;
}

function statusBadge(status) {
  if (status === "done")        return `<span class="request-status request-status--done">✅ Done</span>`;
  if (status === "in-progress") return `<span class="request-status request-status--in-progress">● In Progress</span>`;
  return `<span class="request-status request-status--pending">● Pending</span>`;
}

function getMyRequests(guestId) {
  if (!guestId) return [];
  try {
    const all = JSON.parse(localStorage.getItem("ar_requests") || "[]");
    return all.filter(r => r.guestId === guestId);
  } catch { return []; }
}

export function ConciergePage(state, liveRequests = null) {
  const snapshot  = PassengerService.getCurrentSnapshot();
  const guestId   = snapshot?.profile?.id;
  const profile   = snapshot?.profile;
  const cottage   = profile?.roomCottage || profile?.room || "";
  const zone      = profile?.roomZone    || "";
  const roomLabel = cottage ? `Room ${cottage}${zone ? ` · ${zone} Zone` : ""}` : "—";
  const myRequests = liveRequests !== null ? liveRequests : getMyRequests(guestId);
  const selectedType = REQUEST_TYPES.find(t => t.id === state.selectedTypeId);

  return `
    <header class="concierge-topbar">
      <button class="concierge-back-btn" data-route="home">← Back</button>
      <span class="concierge-topbar__title">Guest Services</span>
    </header>

    <main class="concierge-page">
      <div class="concierge-room-card">
        <span class="concierge-room-card__icon">🛎</span>
        <div>
          <div class="concierge-room-card__label">Your Room</div>
          <div class="concierge-room-card__room">${roomLabel}</div>
        </div>
      </div>

      <section class="concierge-section">
        <div class="concierge-section-title">What do you need?</div>
        <div class="request-type-grid">
          ${REQUEST_TYPES.map(t => `
            <button
              class="request-type-card ${state.selectedTypeId === t.id ? "request-type-card--selected" : ""}"
              data-req-type="${t.id}">
              <div class="request-type-card__icon">${t.icon}</div>
              <div class="request-type-card__label">${t.label}</div>
            </button>
          `).join("")}
        </div>
      </section>

      ${selectedType ? `
        <section class="concierge-section">
          <label class="concierge-label">Add details (optional)</label>
          <textarea
            class="concierge-textarea"
            placeholder="Any specific details…"
            data-concierge-note>${state.note}</textarea>
        </section>

        <button class="concierge-send-btn" data-concierge-send>
          🛎 Send Request
        </button>
      ` : ""}

      ${myRequests.length > 0 ? `
        <section class="concierge-section" style="margin-top:var(--s-6)">
          <div class="concierge-section-title">My Requests</div>
          <div class="concierge-request-list">
            ${myRequests.map(r => {
              const type   = REQUEST_TYPES.find(t => t.id === r.type);
              // Live Firebase requests carry status directly; localStorage requests use the status key
              const status = liveRequests !== null
                ? (r.status || "pending")
                : (localStorage.getItem(`ar_request_status_${r.id}`) || r.status || "pending");
              return `
                <div class="concierge-request-item">
                  <div class="concierge-request-item__icon">${type?.icon || "🛎"}</div>
                  <div class="concierge-request-item__body">
                    <div class="concierge-request-item__label">${r.label}</div>
                    <div class="concierge-request-item__meta">${roomLabel} · ${formatReqTime(r.timestamp)}</div>
                    ${r.note ? `<div class="concierge-request-item__note">${r.note}</div>` : ""}
                  </div>
                  <div>${statusBadge(status)}</div>
                </div>
              `;
            }).join("")}
          </div>
        </section>
      ` : ""}
    </main>
  `;
}
