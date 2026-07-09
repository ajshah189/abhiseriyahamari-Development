import PassengerService from "../../services/passengerService.js";
import { initials, colorFromName } from "../../modules/leaderboard/LeaderboardCard.js";

export function TopBar() {

const now = new Date();

const greeting =
now.getHours() < 12
? "Good Morning"
: now.getHours() < 17
? "Good Afternoon"
: "Good Evening";

const snapshot = PassengerService.getCurrentSnapshot();
const name = snapshot?.profile?.passengerName || "Guest Viewer";
const avatarLetter = snapshot?.isViewer ? "✈" : initials(name);
const avatarColor = snapshot?.isViewer ? "var(--gold)" : colorFromName(name);

return `

<header class="top-bar">

<div class="top-left">

<div class="avatar" style="background:${avatarColor}">

${avatarLetter}

</div>

<div>

<div class="greeting">

${greeting}

</div>

<h2>

${name}

</h2>

</div>

</div>

<div class="top-center">

<div class="weather">

☀️ 29°C

</div>

<div class="countdown">

🎉 Wedding in 198 Days

</div>

</div>

<div class="top-right">

<button class="top-icon">

🔔

</button>

<button class="top-icon">

⚙️

</button>

</div>

</header>

`;

}
