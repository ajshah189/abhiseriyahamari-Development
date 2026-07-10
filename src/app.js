/**
 * App — composition root.
 *
 * The only place that knows about every top-level screen in AR Airways.
 * Initializes the ledger, registers each screen with the Router, and
 * boots into the default screen. Adding a new module means registering
 * it here — nothing else in the app needs to change.
 */

import Router from "./router.js";
import { initMilesStore } from "./store/milesStore.js";
import AuthService from "./services/authService.js";
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
import { DirectoryScreen } from "./modules/directory/DirectoryScreen.js";
import { SettingsScreen } from "./modules/settings/SettingsScreen.js";
import { createComingSoonScreen } from "./modules/shared/ComingSoonScreen.js";
import { initBell } from "./modules/notifications/NotificationService.js";

const UPCOMING_ROUTES = {};

class App {

    start() {

        initMilesStore();

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
        Router.register("directory", DirectoryScreen);

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

        // Auth routing — every screen is registered by this point, so
        // this decides only where we land, not what exists.
        if (!AuthService.isLoggedIn() && !AuthService.isViewer()) {
            // First time: show onboarding.
            Router.go("onboarding");
            return;
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

    }

}

export default new App();
