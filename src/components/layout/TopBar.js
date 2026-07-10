import PassengerService from "../../services/passengerService.js";
import { initials, colorFromName } from "../../modules/leaderboard/LeaderboardCard.js";
import { getHistory } from "../../modules/notifications/NotificationService.js";

export function TopBar({ map = false } = {}) {
  if (map) {
    return `
<header class="top-bar">
  <div class="top-left">
    <button class="top-bar__back" id="mapBackBtn" aria-label="Back to home">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
    </button>
    <div>
      <div class="greeting">Journey Map</div>
      <h2>Aayush Resort</h2>
    </div>
  </div>
  <div class="top-right">
    <button class="top-icon" id="mapSearchToggle" aria-label="Search map">
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    </button>
    <button class="top-icon" id="editorToggle" aria-label="Organiser tools" style="display:none">
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>
</header>`;
  }

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good Morning" :
    now.getHours() < 17 ? "Good Afternoon" :
    "Good Evening";

  const snapshot = PassengerService.getCurrentSnapshot();
  const name = snapshot?.profile?.passengerName || "Guest Viewer";
  const avatarLetter = snapshot?.isViewer ? "✈" : initials(name);
  const avatarColor  = snapshot?.isViewer ? "var(--gold)" : colorFromName(name);

  const notifCount = getHistory().length;
  const badge = notifCount > 0
    ? `<span class="notif-bell-badge">${notifCount}</span>`
    : "";

  return `
<header class="top-bar">

  <div class="top-left">
    <div class="avatar" style="background:${avatarColor}" data-admin-trigger>
      ${avatarLetter}
    </div>
    <div>
      <div class="greeting">${greeting}</div>
      <h2>${name}</h2>
    </div>
  </div>

  <div class="top-center">
    <div class="weather">☀️ 29°C</div>
    <div class="countdown">🎉 Wedding in 198 Days</div>
  </div>

  <div class="top-right">
    <button class="top-icon" data-notif-toggle aria-label="Notifications">
      🔔${badge}
    </button>
    <button class="top-icon">⚙️</button>
  </div>

</header>
`;
}
