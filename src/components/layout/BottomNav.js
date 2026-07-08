export function BottomNav() {

    return `
        <nav class="bottom-nav">

            <button data-route="dashboard">🏠<span>Home</span></button>

            <button data-route="map">🗺️<span>Map</span></button>

            <button data-route="passport">📘<span>Passport</span></button>

            <button data-route="events">🎉<span>Events</span></button>

            <button data-route="profile">👤<span>Profile</span></button>

        </nav>
    `;

}