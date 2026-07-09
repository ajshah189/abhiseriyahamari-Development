/**
 * HomePage — the main dashboard surface.
 *
 * Composes the page from live-data-consuming components. Assumes the
 * ledger (MilesStore) has already been initialized by the app's
 * composition root before this ever renders — see src/app.js.
 *
 * PassengerCard receives the full snapshot from PassengerService,
 * which internally derives balance/tier from the transaction ledger.
 * ActivityCard reads directly from the ledger.
 *
 * When miles change (via AppStore "miles:changed" event), the
 * affected sections re-render without a full page reload.
 */

import PassengerService from "../../services/passengerService.js";
import AppStore from "../../store/appStore.js";

import { PassengerCard } from "../../components/cards/PassengerCard.js";
import { ActivityCard } from "../../components/cards/ActivityCard.js";
import { QuickActions } from "./QuickActions.js";
import { TodaysJourney } from "./TodaysJourney.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

export function HomePage() {
  const snapshot = PassengerService.getCurrentSnapshot();

  // Subscribe to miles changes so the dashboard stays live.
  // Uses a small delay to batch rapid earns (e.g. admin awarding).
  let refreshTimer = null;
  AppStore.on("miles:changed", () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      const passengerEl = document.querySelector(".passenger-card");
      const activityEl = document.querySelector(".dashboard-section .activity-feed")?.closest(".dashboard-section");

      if (passengerEl) {
        const fresh = PassengerService.getCurrentSnapshot();
        passengerEl.outerHTML = PassengerCard(fresh);
      }
      if (activityEl) {
        activityEl.outerHTML = ActivityCard();
      }
    }, 80);
  });

  return `
    ${TopBar()}
    <main class="dashboard-page">
      <section class="dashboard-main">
        ${PassengerCard(snapshot)}
        ${TodaysJourney()}
      </section>
      <aside class="dashboard-sidebar">
        ${QuickActions()}
        ${ActivityCard()}
      </aside>
    </main>
    ${BottomNav("home")}
  `;
}
