export function PassengerCard(snapshot = {}) {

    const guest = snapshot.profile?.passengerName || "Abhishek Shah";
    const room = snapshot.profile?.room || "C204";

    const balance = snapshot.balance || 0;

    const today = snapshot.todayMiles || 0;

    const tier = snapshot.tier?.current?.name || "Explorer";

    const progress = Math.round((snapshot.tier?.progress || 0) * 100);

    return `

<section class="passenger-card boarding-card">

<div class="boarding-left">

    <div class="boarding-label">
        BOARDING PASS
    </div>

    <h2>${guest}</h2>

    <div class="boarding-meta">

        <div>

            <span>ROOM</span>

            <strong>${room}</strong>

        </div>

        <div>

            <span>STATUS</span>

            <strong>${tier}</strong>

        </div>

    </div>

</div>

<div class="boarding-divider"></div>

<div class="boarding-right">

    <div class="miles-block">

        <div class="miles-value">
            ${balance.toLocaleString()}
        </div>

        <div class="miles-title">
            AR Miles
        </div>

        <div class="today-miles">
            +${today} today
        </div>

    </div>

    <div class="progress">

        <label>Journey Progress</label>

        <div class="progress-track">

            <div
                class="progress-fill"
                style="width:${progress}%">
            </div>

        </div>

        <small>${progress}% to next tier</small>

    </div>

</div>

</section>

`;

}