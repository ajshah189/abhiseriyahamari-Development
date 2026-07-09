export function QuickActions() {

    const actions = [

        {
            icon: "🗺️",
            title: "Map",
            route: "map"
        },

        {
            icon: "🛂",
            title: "Boarding Pass",
            route: "journey"
        },

        {
            icon: "🌍",
            title: "Passport",
            route: "passport"
        },

        {
            icon: "🎉",
            title: "Events",
            route: "events"
        },

        {
            icon: "🎁",
            title: "Rewards",
            route: "rewards"
        },

        {
            icon: "🏆",
            title: "Leaderboard",
            route: "leaderboard"
        },

        {
            icon: "👤",
            title: "Profile",
            route: "profile"
        },

        {
            icon: "⚙️",
            title: "Settings",
            route: "settings"
        }

    ];

    return `

<section class="dashboard-section">

    <h3>Quick Actions</h3>

    <div class="quick-grid">

        ${actions.map(action => `

        <button class="quick-card" data-route="${action.route}">

            <div class="quick-icon">

                ${action.icon}

            </div>

            <span>

                ${action.title}

            </span>

        </button>

        `).join("")}

    </div>

</section>

`;

}