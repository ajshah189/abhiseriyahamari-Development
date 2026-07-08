export function PassengerCard(snapshot = {}) {

    const guest = snapshot.profile?.passengerName  || "Guest";
    const balance = snapshot.balance || 0;
    const tier = snapshot.tier?.current?.name || "Explorer";
    const today = snapshot.todayMiles || 0;
    const progress = Math.round((snapshot.tier?.progress || 0) * 100);

    return `
        <section class="passenger-card">

            <div class="passenger-header">
                <div>
                    <small>Welcome aboard</small>
                    <h2>${guest}</h2>
                    <span>${tier}</span>
                </div>

                <div class="miles">
                    <h1>${balance.toLocaleString()}</h1>
                    <small>AR Miles</small>
                    <small>+${today.toLocaleString()} today</small>
                </div>
            </div>

            <div class="progress">
                <label>Progress to next tier</label>

                <progress value="${progress}" max="100"></progress>

                <small>${progress}% Complete</small>
            </div>

        </section>
    `;

}