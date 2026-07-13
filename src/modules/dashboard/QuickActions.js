const PRIMARY_ACTIONS = [
  { icon: "🗺️", label: "Map",         route: "map" },
  { icon: "📅", label: "Events",      route: "events" },
  { icon: "🎫", label: "My Room",     route: "journey" },
  { icon: "🏆", label: "Leaderboard", route: "leaderboard" },
];

const MORE_ACTIONS = [
  { icon: "🗺️", label: "Treasure Hunt",   route: "hunt" },
  { icon: "🎁", label: "Rewards",          route: "rewards" },
  { icon: "📘", label: "Passport",         route: "passport" },
  { icon: "👥", label: "Guest Directory",  route: "directory" },
  { icon: "👤", label: "Profile",          route: "profile" },
  { icon: "⚙️", label: "Settings",         route: "settings" },
];

function tile(action) {
  return `
    <button class="quick-card" data-route="${action.route}">
      <div class="quick-icon">${action.icon}</div>
      <span>${action.label}</span>
    </button>
  `;
}

export function QuickActions() {
  return `
    <section class="dashboard-section">
      <h3>Quick Actions</h3>
      <div class="quick-actions__grid">
        ${PRIMARY_ACTIONS.map(tile).join("")}
        <div class="quick-actions__more-grid" id="qa-more-grid">
          ${MORE_ACTIONS.map(tile).join("")}
        </div>
        <button class="quick-card quick-action--more" data-qa-toggle>
          More ✈ <span class="qa-toggle-chevron">▾</span>
        </button>
      </div>
    </section>
  `;
}
