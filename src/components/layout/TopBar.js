import PassengerService from "../../services/passengerService.js";
import { initials, colorFromName } from "../../modules/leaderboard/LeaderboardCard.js";
import { getHistory } from "../../modules/notifications/NotificationService.js";

// ── Weather ──────────────────────────────────────────────────────────────────
// Fetched once on first TopBar render, refreshed every 30 minutes.
// Cached module-level so subsequent TopBar re-renders use the latest value
// synchronously without a layout jump.

let _weatherText = "🌤️ --°C";
let _weatherTimer = null;

function getWeatherEmoji(code) {
  if (code === 0)  return "☀️";
  if (code <= 3)   return "⛅";
  if (code <= 48)  return "🌫️";
  if (code <= 67)  return "🌧️";
  if (code <= 77)  return "❄️";
  if (code <= 82)  return "🌦️";
  if (code <= 99)  return "⛈️";
  return "🌤️";
}

async function fetchWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=18.9667&longitude=73.1167&current=temperature_2m,weather_code"
    );
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    return `${getWeatherEmoji(code)} ${temp}°C`;
  } catch {
    return "🌤️ --°C";
  }
}

function _updateWeatherEl(text) {
  _weatherText = text;
  document.querySelectorAll(".topbar-weather").forEach(el => { el.textContent = text; });
}

function initWeatherUpdater() {
  if (_weatherTimer !== null) return;
  fetchWeather().then(_updateWeatherEl);
  _weatherTimer = setInterval(() => fetchWeather().then(_updateWeatherEl), 30 * 60 * 1000);
}

// ── Wedding pill ──────────────────────────────────────────────────────────────

function getWeddingPill() {
  const now   = new Date();
  const day1  = new Date("2027-01-22T00:00:00+05:30");
  const day2  = new Date("2027-01-23T00:00:00+05:30");
  const day3  = new Date("2027-01-24T00:00:00+05:30");
  const after = new Date("2027-01-25T00:00:00+05:30");

  if (now >= after) return "Thank you for flying ✈";
  if (now >= day3)  return "Day 3 of 3 ✈";
  if (now >= day2)  return "Day 2 of 3 ✈";
  if (now >= day1)  return "Day 1 of 3 ✈";

  const days = Math.ceil((day1 - now) / (1000 * 60 * 60 * 24));
  return `🎉 Wedding in ${days} day${days !== 1 ? "s" : ""}`;
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export function TopBar() {
  initWeatherUpdater();

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
    <div class="weather topbar-weather">${_weatherText}</div>
    <div class="countdown">${getWeddingPill()}</div>
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
