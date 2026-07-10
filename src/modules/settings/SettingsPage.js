import PassengerService from "../../services/passengerService.js";
import AuthService from "../../services/authService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

const PRESET_COLORS = [
  { name: "Gold",      value: "#d4af6a" },
  { name: "Coral",     value: "#e07b5d" },
  { name: "Emerald",   value: "#2d9a6e" },
  { name: "Sapphire",  value: "#3a7bd5" },
  { name: "Amethyst",  value: "#8e44ad" },
  { name: "Rose",      value: "#c0396b" },
];

function getNotifPrefs() {
  try {
    return { events: true, miles: true, leaderboard: false,
             ...JSON.parse(localStorage.getItem("ar_notif_prefs") || "{}") };
  } catch { return { events: true, miles: true, leaderboard: false }; }
}

function toggle(id, checked, dataAttr) {
  return `
    <label class="settings-toggle" for="${id}">
      <input type="checkbox" class="settings-toggle__input" id="${id}" ${dataAttr} ${checked ? "checked" : ""}>
      <span class="settings-toggle__track"></span>
    </label>`;
}

export function SettingsPage() {
  const passenger = PassengerService.getCurrentPassenger();
  const isLoggedIn = AuthService.isLoggedIn();

  const displayName = localStorage.getItem("ar_display_name") || passenger?.displayName || "";
  const avatarColor = localStorage.getItem("ar_avatar_color") || "";
  const reduceMotion = localStorage.getItem("ar_reduce_motion") === "true";
  const notifPrefs = getNotifPrefs();
  const notifGranted = typeof Notification !== "undefined" && Notification.permission === "granted";

  return `
    ${TopBar()}
    <div class="settings-page">

      <section class="settings-section">
        <div class="settings-section__title">Profile Settings</div>

        <div class="settings-row settings-row--no-border" style="flex-direction:column;align-items:flex-start;gap:var(--s-2)">
          <div class="settings-row__name">Display Name</div>
          <div class="settings-row__hint">Shown on the leaderboard and TopBar</div>
          <input class="settings-input" type="text" id="settingsDisplayName"
                 placeholder="Your name" value="${displayName.replace(/"/g, "&quot;")}" autocomplete="off" />
        </div>

        <div class="settings-row settings-row--no-border"
             style="flex-direction:column;align-items:flex-start;gap:var(--s-3);border-top:1px solid var(--line);padding-top:var(--s-4);margin-top:var(--s-2)">
          <div class="settings-row__name">Avatar Colour</div>
          <div class="settings-color-picker" id="settingsColorPicker">
            ${PRESET_COLORS.map(c => `
              <button class="settings-color-swatch ${avatarColor === c.value ? "settings-color-swatch--selected" : ""}"
                      data-color="${c.value}" title="${c.name}"
                      style="background:${c.value}"></button>
            `).join("")}
          </div>
        </div>

        ${isLoggedIn && passenger?.passportNumber ? `
        <div class="settings-row settings-row--no-border"
             style="border-top:1px solid var(--line);margin-top:var(--s-2);padding-top:var(--s-4)">
          <div class="settings-row__label">
            <div class="settings-row__name">Passport Number</div>
            <div class="settings-row__hint">Read-only · used to log in</div>
          </div>
          <div class="settings-row__value settings-row__value--mono">${passenger.passportNumber}</div>
        </div>
        ` : ""}
      </section>

      <section class="settings-section">
        <div class="settings-section__title">Notifications</div>

        ${!notifGranted ? `
          <div class="settings-notif-warning">
            🔔 Enable notifications in your browser settings to receive event reminders
          </div>
        ` : ""}

        <div class="settings-row">
          <div class="settings-row__label">
            <div class="settings-row__name">Event Reminders</div>
            <div class="settings-row__hint">30 min before each event</div>
          </div>
          ${toggle("notifEvents", notifPrefs.events, 'data-notif-pref="events"')}
        </div>

        <div class="settings-row">
          <div class="settings-row__label">
            <div class="settings-row__name">Miles Earned Alerts</div>
          </div>
          ${toggle("notifMiles", notifPrefs.miles, 'data-notif-pref="miles"')}
        </div>

        <div class="settings-row settings-row--no-border">
          <div class="settings-row__label">
            <div class="settings-row__name">Leaderboard Changes</div>
          </div>
          ${toggle("notifLeaderboard", notifPrefs.leaderboard, 'data-notif-pref="leaderboard"')}
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section__title">App</div>

        <div class="settings-row">
          <div class="settings-row__label">
            <div class="settings-row__name">Reduce Animations</div>
            <div class="settings-row__hint">Fewer motion effects throughout the app</div>
          </div>
          ${toggle("reduceMotion", reduceMotion, "data-reduce-motion")}
        </div>

        <div class="settings-row settings-row--no-border" style="justify-content:center">
          <div class="settings-app-info">
            <div class="settings-app-version">AR Airways v1.0</div>
            <div>Built with ♥ for Riya &amp; Abhishek</div>
            <div style="margin-top:var(--s-2);color:var(--cream-faint)">22–24 January 2027 · Aayush Resort</div>
          </div>
        </div>
      </section>

      <section class="settings-section settings-section--danger">
        <div class="settings-section__title">Data &amp; Privacy</div>

        <div class="settings-row">
          <div class="settings-row__label">
            <div class="settings-row__name">Clear App Cache</div>
            <div class="settings-row__hint">Unregisters service worker, clears caches, reloads</div>
          </div>
          <button class="settings-danger-btn" data-clear-cache>Clear</button>
        </div>

        ${isLoggedIn ? `
        <div class="settings-row">
          <div class="settings-row__label">
            <div class="settings-row__name">Clear My Activity Data</div>
            <div class="settings-row__hint">Removes your AR Miles transaction history</div>
          </div>
          <button class="settings-danger-btn" data-clear-activity>Clear</button>
        </div>
        ` : ""}

        <div class="settings-row settings-row--no-border" style="padding-top:var(--s-4)">
          <button class="settings-signout-btn" data-settings-signout>Sign Out of AR Airways</button>
        </div>
      </section>

    </div>
    ${BottomNav("profile")}
  `;
}
