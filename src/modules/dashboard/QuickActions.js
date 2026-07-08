export function QuickActions() {

    return `
        <section class="dashboard-section">

            <h3>Quick Actions</h3>

            <div class="quick-actions-grid">

                <button class="action-card" data-route="map">
                    🗺️
                    <span>Map</span>
                </button>

                <button class="action-card" data-route="passport">
                    📘
                    <span>Passport</span>
                </button>

                <button class="action-card" data-route="events">
                    🎉
                    <span>Events</span>
                </button>

                <button class="action-card" data-route="rewards">
                    🎁
                    <span>Rewards</span>
                </button>

                <button class="action-card" data-route="leaderboard">
                    🏆
                    <span>Leaderboard</span>
                </button>

                <button class="action-card" data-route="profile">
                    👤
                    <span>Profile</span>
                </button>

            </div>

        </section>
    `;

}