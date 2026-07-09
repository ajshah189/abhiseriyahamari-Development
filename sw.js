/**
 * AR Airways — Service Worker
 *
 * Cache strategy:
 *   App shell (HTML, CSS, JS):  Cache First — served instantly from cache,
 *                               no network round-trip needed for the static files.
 *   Everything else:            Network First with cache fallback.
 *
 * Offline fallback: any navigation request that misses the network returns
 * /index.html so the SPA router can handle it.
 *
 * Push / notification handlers are wired up and ready for Firebase Cloud
 * Messaging when the backend session adds that integration.
 *
 * IMPORTANT: Bump CACHE_NAME whenever the app shell changes so old caches
 * are evicted on next activate. Format: "ar-airways-v{N}".
 */

const CACHE_NAME = "ar-airways-v3";

// Every file listed here must return HTTP 200 — a single 404 will cause
// the install to fail and the SW to stay in "waiting" state.
// Paths are verified against the real src/ directory structure.
const APP_SHELL = [
  // Root
  "/",
  "/index.html",
  "/style.css",
  "/data.js",
  "/script.js",
  "/manifest.json",
  "/icons/icon.svg",

  // Core entry points
  "/src/app.js",
  "/src/router.js",
  "/src/config.js",
  "/src/constants.js",

  // State stores
  "/src/store/appStore.js",
  "/src/store/milesStore.js",

  // Services
  "/src/services/authService.js",
  "/src/services/passengerService.js",
  "/src/services/milesService.js",
  "/src/services/leaderboardService.js",
  "/src/services/rewardService.js",
  "/src/services/dataService.js",

  // Utilities
  "/src/utils/storage.js",
  "/src/utils/dom.js",
  "/src/utils/geometry.js",

  // Static data
  "/src/data/events.js",
  "/src/data/guests.js",
  "/src/data/families.js",
  "/src/data/rooms.js",
  "/src/data/rewards.js",
  "/src/data/passport.js",

  // Models
  "/src/models/Transaction.js",
  "/src/models/Guest.js",
  "/src/models/Achievement.js",
  "/src/models/BoardingPass.js",
  "/src/models/Event.js",
  "/src/models/Passport.js",
  "/src/models/Reward.js",

  // Components — Layout
  "/src/components/layout/TopBar.js",
  "/src/components/layout/BottomNav.js",
  "/src/components/layout/LoadingScreen.js",
  "/src/components/layout/PageContainer.js",
  "/src/components/layout/layout.css",

  // Components — Cards
  "/src/components/cards/PassengerCard.js",
  "/src/components/cards/ActivityCard.js",
  "/src/components/cards/ActionCard.js",
  "/src/components/cards/EventCard.js",
  "/src/components/cards/MilesCard.js",
  "/src/components/cards/ProgressCard.js",
  "/src/components/cards/cards.css",

  // Components — Common
  "/src/components/common/Avatar.js",
  "/src/components/common/Badge.js",
  "/src/components/common/Button.js",
  "/src/components/common/Chip.js",
  "/src/components/common/Modal.js",
  "/src/components/common/ProgressBar.js",
  "/src/components/common/Toast.js",

  // Onboarding
  "/src/modules/onboarding/OnboardingPage.js",
  "/src/modules/onboarding/OnboardingScreen.js",
  "/src/modules/onboarding/onboarding.css",

  // Dashboard
  "/src/modules/dashboard/HomePage.js",
  "/src/modules/dashboard/GuestAppScreen.js",
  "/src/modules/dashboard/TodaysJourney.js",
  "/src/modules/dashboard/QuickActions.js",
  "/src/modules/dashboard/dashboard.css",

  // Events
  "/src/modules/events/EventsPage.js",
  "/src/modules/events/EventsScreen.js",
  "/src/modules/events/EventTimeline.js",
  "/src/modules/events/events.css",

  // Journey / Boarding Pass
  "/src/modules/journey/JourneyPage.js",
  "/src/modules/journey/JourneyScreen.js",
  "/src/modules/journey/journey.css",

  // Rewards
  "/src/modules/rewards/RewardsPage.js",
  "/src/modules/rewards/RewardsScreen.js",
  "/src/modules/rewards/RewardCard.js",
  "/src/modules/rewards/rewards.css",

  // Leaderboard
  "/src/modules/leaderboard/LeaderboardPage.js",
  "/src/modules/leaderboard/LeaderboardCard.js",

  // Passport
  "/src/modules/passport/PassportPage.js",
  "/src/modules/passport/PassportScreen.js",
  "/src/modules/passport/CountryGrid.js",
  "/src/modules/passport/PassportStamps.js",
  "/src/modules/passport/passport.css",

  // Profile
  "/src/modules/profile/ProfilePage.js",
  "/src/modules/profile/ProfileScreen.js",
  "/src/modules/profile/JourneyTimeline.js",
  "/src/modules/profile/profile.css",

  // Admin (Ground Crew)
  "/src/modules/admin/AdminPage.js",
  "/src/modules/admin/AdminScreen.js",
  "/src/modules/admin/AdminPinGate.js",
  "/src/modules/admin/AdminDashboard.js",
  "/src/modules/admin/GuestManager.js",
  "/src/modules/admin/MilesManager.js",
  "/src/modules/admin/admin.css",

  // Map
  "/src/modules/map/MapScreen.js",

  // Shared
  "/src/modules/shared/ComingSoonScreen.js",
  "/src/modules/shared/shared.css",

  // Core map engine (do not modify — stable map module)
  "/src/modules/core/labels.js",
  "/src/modules/core/map.js",
  "/src/modules/core/maps.js",
  "/src/modules/core/navigation.js",
  "/src/modules/core/popup.js",
  "/src/modules/core/search.js",
  "/src/modules/core/utilities.js",
  "/src/modules/core/zones.js",

  // PWA
  "/src/modules/pwa/InstallPrompt.js",
  "/src/modules/pwa/pwa.css",

  // Notifications
  "/src/modules/notifications/NotificationService.js",
  "/src/modules/notifications/notifications.css",
];

// ─── Install ───────────────────────────────────────────────────────────────

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("/index.html");
            }
          });
      })
  );
});

// ─── Push Notifications ────────────────────────────────────────────────────
// Ready for Firebase Cloud Messaging — wired now, activated in a future session.

self.addEventListener("push", event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "AR Airways ✈", options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
