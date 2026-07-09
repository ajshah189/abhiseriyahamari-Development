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
import { OnboardingScreen } from "./modules/onboarding/OnboardingScreen.js";
import { GuestAppScreen } from "./modules/dashboard/GuestAppScreen.js";
import { MapScreen } from "./modules/map/MapScreen.js";
import { EventsScreen } from "./modules/events/EventsScreen.js";
import { JourneyScreen } from "./modules/journey/JourneyScreen.js";
import { RewardsScreen } from "./modules/rewards/RewardsScreen.js";
import { ProfileScreen } from "./modules/profile/ProfileScreen.js";
import { PassportScreen } from "./modules/passport/PassportScreen.js";
import { AdminScreen } from "./modules/admin/AdminScreen.js";
import { createComingSoonScreen } from "./modules/shared/ComingSoonScreen.js";

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
        // Settings has no dedicated screen yet — it's slated to live as a
        // section within Profile, so route it there rather than 404.
        Router.register("settings", ProfileScreen);
        Router.register("passport", PassportScreen);
        // Not in BottomNav, not a ComingSoon fallback — organiser-only,
        // reached via the hidden trigger on the Profile avatar.
        Router.register("admin", AdminScreen);

        for (const [route, meta] of Object.entries(UPCOMING_ROUTES)) {
            Router.register(route, createComingSoonScreen(route, meta));
        }

        // Auth routing — every screen is registered by this point, so
        // this decides only where we land, not what exists.
        if (!AuthService.isLoggedIn() && !AuthService.isViewer()) {
            // First time: show onboarding.
            Router.go("onboarding");
            return;
        }

        Router.go("home");

    }

}

export default new App();
