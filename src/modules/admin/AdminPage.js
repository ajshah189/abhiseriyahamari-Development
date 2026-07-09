/**
 * AdminPage — the Ground Crew tool. Pure render function of (state).
 *
 * All interactivity (section switching, search, form input, toggles)
 * is owned by AdminScreen, which mutates `state` and re-invokes this on
 * every change — same Page/Screen split as every other module. Every
 * figure comes from the same services the guest app uses (MilesService,
 * PassengerService, LeaderboardService, RewardService); nothing here
 * queries a store directly or duplicates their logic.
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import LeaderboardService from "../../services/leaderboardService.js";
import RewardService from "../../services/rewardService.js";
import { EVENTS } from "../../data/events.js";
import { LeaderboardRow } from "../leaderboard/LeaderboardCard.js";
import { HUNT_LOCATIONS } from "../../data/treasureHunt.js";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "award", label: "Award Miles" },
  { id: "guests", label: "Guests" },
  { id: "redemptions", label: "Redemptions" },
  { id: "qrcodes", label: "QR Codes" },
];

const AMOUNT_PRESETS = [50, 100, 200, 500, 1000];

const TIER_FILTERS = ["all", "Explorer", "Silver Traveller", "Gold Traveller", "Platinum Voyager", "Global Ambassador"];

function getEventsTodayCount() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return EVENTS.filter(e => e.date === todayStr).length;
}

function effectiveCheckIn(state, guest) {
  const override = state.checkins[guest.id];
  return override === undefined ? guest.checkedIn : override;
}

// ---------- Overview ----------

function overviewSection(state) {
  const totalAwarded = MilesService.getTotalAwarded();
  const activeGuests = PassengerService.getAllPassengers().length;
  const eventsToday = getEventsTodayCount();
  const rewardsRedeemed = RewardService.getAllRedemptions().length;
  const topTen = LeaderboardService.getOverall().slice(0, 10);

  return `
    <div class="admin-stat-grid">
      <div class="admin-stat-card">
        <div class="admin-stat-card__value">${MilesService.format(totalAwarded)} ✈</div>
        <div class="admin-stat-card__label">Total Miles Awarded</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-card__value">${activeGuests}</div>
        <div class="admin-stat-card__label">Active Guests</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-card__value">${eventsToday}</div>
        <div class="admin-stat-card__label">Events Today</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-card__value">${rewardsRedeemed}</div>
        <div class="admin-stat-card__label">Rewards Redeemed</div>
      </div>
    </div>

    <section class="dashboard-section">
      <h3>Live Leaderboard</h3>
      <div class="leaderboard-list">
        ${topTen.map(LeaderboardRow).join("")}
      </div>
    </section>
  `;
}

// ---------- Award Miles ----------

function awardSection(state) {
  const award = state.award;

  const passengers = PassengerService.getAllPassengers().map(p => ({
    ...p,
    family: PassengerService.getPassengerFamily(p.id)?.name || "",
  }));

  const query = award.search.trim().toLowerCase();
  const filtered = query
    ? passengers.filter(p =>
        p.displayName.toLowerCase().includes(query) ||
        p.family.toLowerCase().includes(query))
    : passengers;

  const selected = award.selectedGuestId ? PassengerService.getPassengerById(award.selectedGuestId) : null;

  return `
    <section class="dashboard-section admin-award-form">
      <h3>Award Miles</h3>

      <label class="admin-field-label">Guest</label>
      <input class="admin-input" type="text" placeholder="Search by name or family…" value="${award.search}" data-award-search />
      <div class="admin-guest-picker">
        ${filtered.length
          ? filtered.map(p => `
              <button
                class="admin-guest-option ${p.id === award.selectedGuestId ? "admin-guest-option--selected" : ""}"
                data-award-guest="${p.id}">
                ${p.displayName} <span>· ${p.family}</span>
              </button>
            `).join("")
          : `<p class="muted">No guests match.</p>`}
      </div>
      ${selected ? `<p class="admin-award-selected">Awarding to <strong>${selected.displayName}</strong></p>` : ""}

      <label class="admin-field-label">Amount</label>
      <div class="admin-amount-presets">
        ${AMOUNT_PRESETS.map(a => `
          <button
            class="admin-amount-chip ${award.amount === a ? "admin-amount-chip--selected" : ""}"
            data-award-amount="${a}">
            +${a}
          </button>
        `).join("")}
      </div>
      <input class="admin-input" type="number" min="1" placeholder="Custom amount" value="${award.customAmount}" data-award-custom />

      <label class="admin-field-label">Reason</label>
      <input class="admin-input" type="text" placeholder="e.g. Won Garba competition" value="${award.reason}" data-award-reason />

      <button class="admin-submit-btn" data-award-submit>Award Miles</button>
    </section>
  `;
}

// ---------- Guests ----------

function guestRow(state, entry) {
  const { guest, family, room, balance, tier } = entry;
  const expanded = state.guests.expandedGuestId === guest.id;
  const checkedIn = effectiveCheckIn(state, guest);

  return `
    <div class="guest-row ${expanded ? "guest-row--expanded" : ""}">
      <button class="guest-row__summary" data-guest-row="${guest.id}">
        <span class="guest-row__name">${guest.displayName}</span>
        <span class="guest-row__family">${family?.name || "—"}</span>
        <span class="guest-row__room">${room?.name || "—"}</span>
        <span class="guest-row__balance">${MilesService.format(balance)} ✈</span>
        <span class="tier-badge">${tier}</span>
      </button>

      <span
        class="checkin-toggle ${checkedIn ? "checkin-toggle--on" : ""}"
        data-checkin-toggle="${guest.id}">
        ${checkedIn ? "✓ Checked In" : "Not Checked In"}
      </span>

      ${expanded ? `
        <div class="guest-row__detail">
          <div class="guest-row__transactions">
            ${MilesService.getLedger(guest.id).slice(0, 5).map(tx => `
              <div class="transaction-row ${tx.amount >= 0 ? "transaction-row--earn" : "transaction-row--redeem"}">
                <div class="transaction-row__date">${MilesService.formatTime(tx.createdAt)}</div>
                <div class="transaction-row__desc">${tx.reason}</div>
                <div class="transaction-row__amount">${tx.amount >= 0 ? "+" : ""}${MilesService.format(tx.amount)}</div>
              </div>
            `).join("") || `<p class="muted">No transactions yet.</p>`}
          </div>
          <button class="admin-shortcut-btn" data-award-shortcut="${guest.id}">+ Miles</button>
        </div>
      ` : ""}
    </div>
  `;
}

function guestsSection(state) {
  const gs = state.guests;
  const query = gs.search.trim().toLowerCase();

  let rows = PassengerService.getAllPassengers().map(guest => ({
    guest,
    family: PassengerService.getPassengerFamily(guest.id),
    room: PassengerService.getPassengerRoom(guest.id),
    balance: MilesService.getBalance(guest.id),
    tier: MilesService.getTier(guest.id).current.name,
  }));

  if (query) {
    rows = rows.filter(r =>
      r.guest.displayName.toLowerCase().includes(query) ||
      (r.family?.name || "").toLowerCase().includes(query));
  }

  if (gs.tierFilter !== "all") {
    rows = rows.filter(r => r.tier === gs.tierFilter);
  }

  return `
    <section class="dashboard-section">
      <h3>Guests</h3>
      <input class="admin-input" type="text" placeholder="Search by name or family…" value="${gs.search}" data-guest-search />

      <div class="admin-tier-filters">
        ${TIER_FILTERS.map(t => `
          <button
            class="admin-tier-chip ${gs.tierFilter === t ? "admin-tier-chip--active" : ""}"
            data-guest-tier-filter="${t}">
            ${t === "all" ? "All Tiers" : t}
          </button>
        `).join("")}
      </div>

      <div class="guest-table">
        ${rows.length ? rows.map(entry => guestRow(state, entry)).join("") : `<p class="muted">No guests match.</p>`}
      </div>
    </section>
  `;
}

// ---------- Redemptions ----------

function redemptionRow(state, redemption) {
  const guest = PassengerService.getPassengerById(redemption.guestId);
  const key = `${redemption.guestId}_${redemption.rewardId}_${redemption.redeemedAt}`;
  const fulfilled = state.fulfilled[key] === true;

  return `
    <div class="redemption-row">
      <span class="redemption-row__guest">${guest?.displayName || redemption.guestId}</span>
      <span class="redemption-row__reward">${redemption.name}</span>
      <span class="redemption-row__cost">${MilesService.format(redemption.cost)} ✈</span>
      <span class="redemption-row__time">${MilesService.formatTime(redemption.redeemedAt)}</span>
      <button
        class="fulfilled-toggle ${fulfilled ? "fulfilled-toggle--on" : ""}"
        data-fulfilled-toggle="${key}">
        ${fulfilled ? "✓ Fulfilled" : "Mark Fulfilled"}
      </button>
    </div>
  `;
}

function redemptionsSection(state) {
  const all = RewardService.getAllRedemptions();

  return `
    <section class="dashboard-section">
      <h3>Redemptions</h3>
      <div class="redemption-list">
        ${all.length
          ? all.map(r => redemptionRow(state, r)).join("")
          : `<p class="muted">No rewards redeemed yet.</p>`}
      </div>
    </section>
  `;
}

// ---------- QR Codes ----------

const BASE_URL = "https://abhiseriyahamari.in";

function qrCodesSection() {
  return `
    <section class="dashboard-section">
      <h3>QR Codes</h3>
      <p class="muted" style="margin-bottom:var(--s-5)">Print and hide these at each location. Guests scan to earn AR Miles.</p>
      <div class="admin-qr-grid">
        ${HUNT_LOCATIONS.map(loc => {
          const url = `${BASE_URL}/?hunt=${loc.id}`;
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
          return `
            <div class="admin-qr-card">
              <img class="admin-qr-img" src="${qrSrc}" alt="QR for ${loc.name}" loading="lazy" />
              <div class="admin-qr-info">
                <div class="admin-qr-name">${loc.icon} ${loc.name}</div>
                <div class="admin-qr-location">${loc.location}</div>
                <div class="admin-qr-reward">+${loc.milesReward} ✈ · Day ${loc.day}</div>
                <button
                  class="admin-qr-print"
                  data-qr-print
                  data-qr-id="${loc.id}"
                  data-qr-name="${loc.name.replace(/"/g, "&quot;")}"
                  data-qr-url="${url}"
                  data-qr-icon="${loc.icon}"
                  data-qr-reward="${loc.milesReward}">
                  Print
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

// ---------- Shell ----------

const SECTION_RENDERERS = {
  overview: overviewSection,
  award: awardSection,
  guests: guestsSection,
  redemptions: redemptionsSection,
  qrcodes: qrCodesSection,
};

export function AdminPage(state) {
  const renderSection = SECTION_RENDERERS[state.section] || overviewSection;

  return `
    <header class="admin-topbar">
      <div class="admin-topbar__title">AR Airways — Ground Crew</div>
      <button class="admin-exit-btn" data-route="profile">Exit Admin</button>
    </header>

    <nav class="admin-nav">
      ${NAV_ITEMS.map(item => `
        <button
          class="admin-nav__item ${state.section === item.id ? "admin-nav__item--active" : ""}"
          data-admin-section="${item.id}">
          ${item.label}
        </button>
      `).join("")}
    </nav>

    <main class="admin-content">
      ${renderSection(state)}
    </main>
  `;
}
