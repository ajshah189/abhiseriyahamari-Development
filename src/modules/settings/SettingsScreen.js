import { SettingsPage } from "./SettingsPage.js";
import AuthService from "../../services/authService.js";
import Router from "../../router.js";
import { clearAll as clearNotifications } from "../notifications/NotificationService.js";

let container = null;

function readNotifPrefs() {
  try {
    return { events: true, miles: true, leaderboard: false,
             ...JSON.parse(localStorage.getItem("ar_notif_prefs") || "{}") };
  } catch { return { events: true, miles: true, leaderboard: false }; }
}

function saveNotifPrefs(prefs) {
  localStorage.setItem("ar_notif_prefs", JSON.stringify(prefs));
}

function applyReduceMotion() {
  if (localStorage.getItem("ar_reduce_motion") === "true") {
    document.documentElement.classList.add("reduce-motion");
  } else {
    document.documentElement.classList.remove("reduce-motion");
  }
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  // Display name — save on every keystroke, remove key if blank
  container.querySelector("#settingsDisplayName")?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) localStorage.setItem("ar_display_name", val);
    else localStorage.removeItem("ar_display_name");
  });

  // Avatar colour swatches
  container.querySelectorAll("[data-color]").forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.setItem("ar_avatar_color", btn.dataset.color);
      container.querySelectorAll("[data-color]").forEach(b =>
        b.classList.toggle("settings-color-swatch--selected", b === btn)
      );
    });
  });

  // Notification preference toggles
  container.querySelectorAll("[data-notif-pref]").forEach(input => {
    input.addEventListener("change", () => {
      const prefs = readNotifPrefs();
      prefs[input.dataset.notifPref] = input.checked;
      saveNotifPrefs(prefs);
    });
  });

  // Reduce motion toggle
  container.querySelector("[data-reduce-motion]")?.addEventListener("change", (e) => {
    localStorage.setItem("ar_reduce_motion", e.target.checked ? "true" : "false");
    applyReduceMotion();
  });

  // Clear app cache
  container.querySelector("[data-clear-cache]")?.addEventListener("click", async () => {
    if (!confirm("Clear all cached data and reload? The app will restart.")) return;
    try {
      const regs = await navigator.serviceWorker?.getRegistrations() || [];
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches?.keys() || [];
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch {}
    location.reload();
  });

  // Clear activity data (current guest's ledger entries only)
  container.querySelector("[data-clear-activity]")?.addEventListener("click", () => {
    if (!confirm("Clear your AR Miles transaction history? This cannot be undone.")) return;
    const guestId = AuthService.getCurrentGuest()?.id;
    if (!guestId) return;
    try {
      const raw = localStorage.getItem("miles_ledger");
      const ledger = raw ? JSON.parse(raw) : [];
      localStorage.setItem("miles_ledger", JSON.stringify(ledger.filter(tx => tx.guestId !== guestId)));
    } catch {}
    render();
  });

  // Sign out
  container.querySelector("[data-settings-signout]")?.addEventListener("click", () => {
    if (!confirm("Sign out of AR Airways?")) return;
    clearNotifications();
    AuthService.logout();
    Router.go("onboarding");
  });
}

function render() {
  container.innerHTML = SettingsPage();
  bindEvents();
  applyReduceMotion();
}

function mount() {
  container = document.getElementById("screen-settings");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const SettingsScreen = { mount, show, hide };
