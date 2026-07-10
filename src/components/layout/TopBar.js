import PassengerService from "../../services/passengerService.js";
import { initials, colorFromName } from "../../modules/leaderboard/LeaderboardCard.js";
import { getHistory } from "../../modules/notifications/NotificationService.js";

export function TopBar() {
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

  const isViewer = snapshot?.isViewer ?? true;

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
    ${!isViewer ? `<button class="top-icon top-icon--dir" data-dir-btn aria-label="Guest Directory">👥</button>` : ""}
    <button class="top-icon" data-notif-toggle aria-label="Notifications">
      🔔${badge}
    </button>
    <button class="top-icon" data-settings-btn aria-label="Settings">⚙️</button>
  </div>

</header>
`;
}
