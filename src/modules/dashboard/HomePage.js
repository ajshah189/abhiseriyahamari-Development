/**
 * HomePage — the main dashboard surface.
 *
 * Pure render, composed from live-data-consuming components. Assumes
 * the ledger (MilesStore) has already been initialized by the app's
 * composition root before this ever renders — see src/app.js.
 *
 * Live updates (miles changing, or a different guest logging in) are
 * GuestAppScreen's job, not this file's — it re-renders this whole
 * function fresh, the same way every other screen in the app handles
 * "go live" via re-render-on-show rather than a component owning its
 * own subscription.
 */

import PassengerService from "../../services/passengerService.js";

import { PassengerCard } from "../../components/cards/PassengerCard.js";
import { ActivityCard } from "../../components/cards/ActivityCard.js";
import { QuickActions } from "./QuickActions.js";
import { TodaysJourney } from "./TodaysJourney.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

export function HomePage() {
  const snapshot = PassengerService.getCurrentSnapshot();

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
