export function TopBar() {

const now = new Date();

const greeting =
now.getHours() < 12
? "Good Morning"
: now.getHours() < 17
? "Good Afternoon"
: "Good Evening";

return `

<header class="top-bar">

<div class="top-left">

<div class="avatar">

A

</div>

<div>

<div class="greeting">

${greeting}

</div>

<h2>

Abhishek Shah

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