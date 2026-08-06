/**
 * App — composition root.
 *
 * The only place that knows about every top-level screen in AR Airways.
 * Initializes the ledger, registers each screen with the Router, and
 * boots into the default screen. Adding a new module means registering
 * it here — nothing else in the app needs to change.
 */

import Router from "./router.js";
import AppStore from "./store/appStore.js";
import { initMilesStore } from "./store/milesStore.js";
import AuthService from "./services/authService.js";
import FirebaseService from "./services/firebaseService.js";
import { initInstallPrompt } from "./modules/pwa/InstallPrompt.js";
import { OnboardingScreen } from "./modules/onboarding/OnboardingScreen.js";
import { GuestAppScreen } from "./modules/dashboard/GuestAppScreen.js";
import { MapScreen } from "./modules/map/MapScreen.js";
import { EventsScreen } from "./modules/events/EventsScreen.js";
import { JourneyScreen } from "./modules/journey/JourneyScreen.js";
import { RewardsScreen } from "./modules/rewards/RewardsScreen.js";
import { ProfileScreen } from "./modules/profile/ProfileScreen.js";
import { PassportScreen } from "./modules/passport/PassportScreen.js";
import { AdminScreen } from "./modules/admin/AdminScreen.js";
import { HuntScreen } from "./modules/hunt/HuntScreen.js";
import { HuntClaimScreen } from "./modules/hunt/HuntClaimScreen.js";
import { SocialClaimScreen } from "./modules/social/SocialClaimScreen.js";
import { DirectoryScreen } from "./modules/directory/DirectoryScreen.js";
import { SettingsScreen } from "./modules/settings/SettingsScreen.js";
import { createComingSoonScreen } from "./modules/shared/ComingSoonScreen.js";
import { initBell, addExternalNotification } from "./modules/notifications/NotificationService.js";
import { ConciergeScreen } from "./modules/concierge/ConciergeScreen.js";
import { TVLeaderboardScreen } from "./modules/tv/TVLeaderboardScreen.js";
import { RitualsScreen } from "./modules/rituals/RitualsScreen.js";
import { StoryScreen } from "./modules/story/StoryScreen.js";

const UPCOMING_ROUTES = {};

class App {

    start() {

        // Fast path for TV leaderboard — no auth, no shell setup
        if (window.location.pathname === '/leaderboard-tv') {
            Router.register('leaderboard-tv', TVLeaderboardScreen);
            Router.go('leaderboard-tv');
            return;
        }

        initMilesStore();
        initOfflineBanner();

        Router.register("onboarding", OnboardingScreen);
        Router.register("home", GuestAppScreen);
        Router.register("map", MapScreen);
        Router.register("events", EventsScreen);
        Router.register("journey", JourneyScreen);
        Router.register("rewards", RewardsScreen.forView("rewards"));
        Router.register("leaderboard", RewardsScreen.forView("leaderboard"));
        Router.register("profile", ProfileScreen);
        Router.register("settings", SettingsScreen);
        Router.register("passport", PassportScreen);
        // Not in BottomNav, not a ComingSoon fallback — organiser-only,
        // reached via the hidden trigger on the Profile avatar.
        Router.register("admin", AdminScreen);
        Router.register("hunt", HuntScreen);
        Router.register("hunt-claim", HuntClaimScreen);
        Router.register("social-claim", SocialClaimScreen);
        Router.register("directory", DirectoryScreen);
        Router.register("concierge", ConciergeScreen);
        Router.register("rituals", RitualsScreen);
        Router.register("story", StoryScreen);

        for (const [route, meta] of Object.entries(UPCOMING_ROUTES)) {
            Router.register(route, createComingSoonScreen(route, meta));
        }

        // Bell wired after all screens are registered so a failure here
        // cannot prevent routing.
        initBell();

        // TopBar icon delegation — survives re-renders on any screen
        document.addEventListener("click", (e) => {
          if (e.target.closest("[data-dir-btn]"))      Router.go("directory");
          if (e.target.closest("[data-settings-btn]")) Router.go("settings");
        });

        // Weather 5-tap → map access gate (PIN 0001)
        initWeatherMapGate();

        // Parse URL params once — before any routing decision.
        const urlParams = new URLSearchParams(window.location.search);

        // ?hunt= from QR code scan — store the ID and route to claim screen.
        // Works before login: pending hunt survives through onboarding and
        // OnboardingScreen redirects to hunt-claim after a successful login.
        const huntId = urlParams.get("hunt");
        if (huntId) {
            sessionStorage.setItem("ar_pending_hunt", huntId);
            if (!AuthService.isLoggedIn() && !AuthService.isViewer()) {
                Router.go("onboarding");
                return;
            }
            Router.go("hunt-claim");
            initInstallPrompt();
            return;
        }

        // ?social= from guest boarding pass QR — store the scanned passport and
        // route to the social claim screen. Viewers are redirected to onboarding
        // first; the pending passport survives through login.
        const socialPassport = urlParams.get("social");
        if (socialPassport) {
            sessionStorage.setItem("ar_pending_social", socialPassport);
            if (!AuthService.isLoggedIn()) {
                Router.go("onboarding");
                initInstallPrompt();
                return;
            }
            Router.go("social-claim");
            initInstallPrompt();
            return;
        }

        // ?ritual= from announcement banner — route to that ritual's detail view.
        const ritualId = urlParams.get("ritual");
        if (ritualId) {
            if (!AuthService.isLoggedIn() && !AuthService.isViewer()) {
                AuthService.loginAsViewer();
            }
            Router.go("rituals", { ritualId });
            initInstallPrompt();
            return;
        }

        // Auth routing — auto-login as viewer if no auth state exists so guests
        // land on the dashboard immediately with no friction.
        if (!AuthService.isLoggedIn() && !AuthService.isViewer()) {
            AuthService.loginAsViewer();
        }

        // Handle ?route= shortcuts from PWA manifest shortcuts (Events, Map).
        // Only honoured when fully logged in — viewer mode still lands on Home.
        const routeParam = urlParams.get("route");
        if (routeParam && AuthService.isLoggedIn()) {
            Router.go(routeParam);
        } else {
            Router.go("home");
        }

        initInstallPrompt();

        // Inject floating concierge bell (logged-in guests only).
        // Also re-checked on every route:changed so the bell appears
        // after first-time login via onboarding (which hits return above).
        injectConciergeButton();
        AppStore.on("route:changed", injectConciergeButton);
        AppStore.on("route:changed", _syncNotificationListener);

        // Subscribe to Firebase announcements (replaces 60s localStorage polling)
        initAnnouncementListener();

        // Subscribe to Firebase notifications for the logged-in guest and
        // surface them via the notification bell.
        initNotificationListener();

    }

}

// ── Offline banner ────────────────────────────────────────────────────────────

function initOfflineBanner() {
  const banner = document.createElement("div");
  banner.id = "offline-banner";
  banner.textContent = "✈ You're offline — changes will sync when connected";
  banner.style.cssText = [
    "display:none",
    "position:fixed",
    "top:64px",
    "left:0",
    "right:0",
    "background:rgba(245,158,11,0.15)",
    "border-bottom:1px solid rgba(245,158,11,0.3)",
    "color:#f59e0b",
    "font-family:Inter,sans-serif",
    "font-size:12px",
    "text-align:center",
    "padding:6px 16px",
    "z-index:90",
    "letter-spacing:0.02em",
  ].join(";");
  document.body.appendChild(banner);

  function update() {
    const onMap   = !document.getElementById("screen-map")?.hidden;
    const onAdmin = !document.getElementById("screen-admin")?.hidden;
    banner.style.display = (!navigator.onLine && !onMap && !onAdmin) ? "block" : "none";
  }

  window.addEventListener("online",  update);
  window.addEventListener("offline", update);
  // Re-evaluate whenever the route changes so map/admin suppression stays current
  document.addEventListener("click", update, true);
  update();
}

// ── Concierge bell ────────────────────────────────────────────────────────────

function injectConciergeButton() {
  if (!AuthService.isLoggedIn()) {
    document.getElementById("concierge-btn")?.remove();
    return;
  }
  if (document.getElementById("concierge-btn")) return;

  const btn = document.createElement("button");
  btn.id   = "concierge-btn";
  btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  btn.setAttribute("aria-label", "Guest Services");
  btn.addEventListener("click", () => Router.go("concierge"));
  document.body.appendChild(btn);
}

// ── Announcement listener (Firebase) ─────────────────────────────────────────

function initAnnouncementListener() {
  const READ_KEY = "ar_announcements_read";
  FirebaseService.subscribeToAnnouncements((announcements) => {
    let readIds;
    try { readIds = JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch { readIds = []; }

    const unread = announcements.filter(a => !readIds.includes(a.id));
    if (unread.length === 0) return;

    const latest = unread[0];
    const onMap   = !document.getElementById("screen-map")?.hidden;
    const onAdmin = !document.getElementById("screen-admin")?.hidden;

    if (!onMap && !onAdmin) {
      showAnnouncementBanner(latest);
    }

    readIds.push(latest.id);
    try { localStorage.setItem(READ_KEY, JSON.stringify(readIds)); } catch {}
  });
}

// ── Firebase notification listener ───────────────────────────────────────────

let _notifUnsub = null;
let _seenNotifIds = new Set();

function initNotificationListener() {
  const guest = AuthService.getCurrentGuest();
  if (!guest) return;

  _notifUnsub = FirebaseService.subscribeToNotifications(guest.id, (notifs) => {
    for (const n of notifs) {
      if (!_seenNotifIds.has(n.id)) {
        _seenNotifIds.add(n.id);
        addExternalNotification("AR Airways", n.message || "You have a new notification");
      }
    }
  });
}

function _syncNotificationListener() {
  const isLoggedIn = AuthService.isLoggedIn();
  if (isLoggedIn && !_notifUnsub) {
    initNotificationListener();
  } else if (!isLoggedIn && _notifUnsub) {
    _notifUnsub();
    _notifUnsub = null;
    _seenNotifIds.clear();
  }
}

// ── Announcement banner ───────────────────────────────────────────────────────

function showAnnouncementBanner(announcement) {
  // Don't stack banners
  document.querySelector(".announcement-banner")?.remove();

  const urgent = announcement.priority === "urgent";
  const ritualId = announcement.ritualId || null;
  const banner = document.createElement("div");
  banner.className = `announcement-banner${urgent ? " announcement-banner--urgent" : ""}${ritualId ? " announcement-banner--clickable" : ""}`;
  banner.innerHTML = `
    <div class="announcement-banner__icon">${urgent ? "📢" : "ℹ️"}</div>
    <div class="announcement-banner__text">${_esc(announcement.message)}${ritualId ? ` <span class="announcement-banner__link">View ritual →</span>` : ""}</div>
    <button class="announcement-banner__close" aria-label="Close">×</button>
  `;
  banner.querySelector(".announcement-banner__close").addEventListener("click", (e) => {
    e.stopPropagation();
    banner.remove();
  });
  if (ritualId) {
    banner.addEventListener("click", () => {
      banner.remove();
      Router.go("rituals", { ritualId });
    });
  }
  document.body.appendChild(banner);

  if (!urgent) setTimeout(() => banner.remove(), 8000);
}

function _esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Weather map gate ──────────────────────────────────────────────────────────
// 5 taps on the weather widget within 1.5s → PIN prompt → "0001" → admin auth + map

function initWeatherMapGate() {
  let _wTapCount = 0;
  let _wTapTimer = null;

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".topbar-weather")) return;
    _wTapCount++;
    clearTimeout(_wTapTimer);
    _wTapTimer = setTimeout(() => { _wTapCount = 0; }, 1500);

    if (_wTapCount >= 5) {
      _wTapCount = 0;
      const pin = prompt("Map access code:");
      if (pin === "0001") {
        sessionStorage.setItem("ar_admin_auth", "true");
        Router.go("map");
      }
    }
  });
}

export default new App();
