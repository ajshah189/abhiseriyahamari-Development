import { PassengerCard } from "../../components/cards/PassengerCard.js";
import { ActivityCard } from "../../components/cards/ActivityCard.js";
import { QuickActions } from "./QuickActions.js";
import { TodaysJourney } from "./Today'sJourney.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

export function HomePage() {

    return `

        ${TopBar()}

        <main class="dashboard-page">

            ${PassengerCard()}

            ${TodaysJourney()}

            ${QuickActions()}

            ${ActivityCard()}

        </main>

        ${BottomNav()}

    `;

}