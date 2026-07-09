export function BottomNav(activeRoute = "home"){

const items = [

{
icon:"🏠",
title:"Home",
route:"home",
group:["home"]
},

{
icon:"🗺️",
title:"Map",
route:"map",
group:["map"]
},

{
icon:"✈️",
title:"Journey",
route:"journey",
group:["journey","events","passport"]
},

{
icon:"🎁",
title:"Rewards",
route:"rewards",
group:["rewards","leaderboard"]
},

{
icon:"👤",
title:"Profile",
route:"profile",
group:["profile","settings"]
}

];

return `

<nav class="bottom-nav">

${items.map(item=>`

<button
class="nav-item ${item.group.includes(activeRoute) ? "active" : ""}"
data-route="${item.route}">

<div class="nav-icon">

${item.icon}

</div>

<div class="nav-title">

${item.title}

</div>

</button>

`).join("")}

</nav>

`;

}