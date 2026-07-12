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
import GuestDatabaseService from "../../services/guestDatabaseService.js";
import { EVENTS } from "../../data/events.js";
import { families } from "../../data/families.js";
import { LeaderboardRow } from "../leaderboard/LeaderboardCard.js";
import { HUNT_LOCATIONS, getFoundLocations } from "../../data/treasureHunt.js";

const NAV_ITEMS = [
  { id: "overview",      label: "📊 Overview" },
  { id: "award",         label: "✈ Award Miles" },
  { id: "scanner",       label: "✅ Check-in" },
  { id: "guests",        label: "👥 Guests" },
  { id: "redemptions",   label: "🎁 Redemptions" },
  { id: "qrcodes",       label: "📱 QR Codes" },
  { id: "import",        label: "📥 Import Guests" },
  { id: "analytics",     label: "📈 Analytics" },
  { id: "announcements", label: "📢 Announce" },
  { id: "requests",      label: "🛎 Requests" },
];

const ANNOUNCEMENT_TEMPLATES = [
  "🚌 Buses leaving in 10 minutes — please make your way to the main gate",
  "🍽 Dinner is now being served at the Palace",
  "💃 Garba is starting now — head to The Palace",
  "🎶 Sangeet begins in 15 minutes — get ready!",
  "📸 Group photo in 5 minutes at the main lawn",
  "🛏 Rooms are ready for check-in",
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
  const isDeduct = (award.mode || "award") === "deduct";

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
      ${selected ? `<p class="admin-award-selected">${isDeduct ? "Deducting from" : "Awarding to"} <strong>${selected.displayName}</strong></p>` : ""}

      <label class="admin-field-label">Type</label>
      <div class="admin-award-mode-toggle">
        <button class="admin-mode-btn ${!isDeduct ? "admin-mode-btn--active" : ""}" data-award-mode="award">✈ Award</button>
        <button class="admin-mode-btn admin-mode-btn--deduct ${isDeduct ? "admin-mode-btn--active-deduct" : ""}" data-award-mode="deduct">⚠ Deduct</button>
      </div>

      <label class="admin-field-label">Amount</label>
      <div class="admin-amount-presets">
        ${AMOUNT_PRESETS.map(a => `
          <button
            class="admin-amount-chip ${award.amount === a ? (isDeduct ? "admin-amount-chip--selected-deduct" : "admin-amount-chip--selected") : ""}"
            data-award-amount="${a}">
            ${isDeduct ? "-" : "+"}${a}
          </button>
        `).join("")}
      </div>
      <input class="admin-input" type="number" min="1" placeholder="Custom amount" value="${award.customAmount}" data-award-custom />

      <label class="admin-field-label">Reason</label>
      <input class="admin-input" type="text" placeholder="${isDeduct ? "e.g. Correction, penalty" : "e.g. Won Garba competition"}" value="${award.reason}" data-award-reason />

      <button class="admin-submit-btn ${isDeduct ? "admin-submit-btn--deduct" : ""}" data-award-submit>
        ${isDeduct ? "Deduct Miles ⚠" : "Award Miles ✈"}
      </button>
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
        <span class="guest-row__room">${room ? `Room ${room.cottage} · ${room.zone} Zone` : "—"}</span>
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
          <div class="guest-row__actions">
            <button class="admin-shortcut-btn" data-award-shortcut="${guest.id}">+ Miles</button>
            <button class="admin-reverse-btn" data-reverse-last="${guest.id}">↩ Reverse Last</button>
          </div>
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
          : `<div class="admin-empty-state">
              <div class="admin-empty-state__icon">🎁</div>
              <div class="admin-empty-state__title">No redemptions yet</div>
              <div class="admin-empty-state__hint">When guests redeem rewards, they'll appear here for fulfillment.</div>
            </div>`}
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

// ---------- Import Guests ----------

function formatImportDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function importSection(state) {
  const imp = state.import;
  const hasLive = GuestDatabaseService.hasImportedData();
  const meta = GuestDatabaseService.getImportMeta();
  const guestCount = GuestDatabaseService.getAll().length;

  const dropzoneHTML = `
    <div class="import-dropzone" data-import-dropzone>
      <input type="file" id="importFileInput" accept=".csv" hidden />
      <div class="import-dropzone__icon">📋</div>
      <div class="import-dropzone__label">Drop CSV here or <button class="import-browse-btn" data-import-browse>browse files</button></div>
      <div class="import-dropzone__hint">Required headers: name, family, room, zone · Optional: phone, diet, passportNumber</div>
    </div>`;

  const previewHTML = imp.preview ? `
    <div class="import-preview">
      <div class="import-preview__summary">
        <div class="import-preview__stat">
          <div class="import-preview__stat-value import-preview__stat-value--good">${imp.preview.imported}</div>
          <div class="import-preview__stat-label">guests to import</div>
        </div>
        ${imp.preview.skipped > 0 ? `
        <div class="import-preview__stat">
          <div class="import-preview__stat-value import-preview__stat-value--warn">${imp.preview.skipped}</div>
          <div class="import-preview__stat-label">rows skipped</div>
        </div>` : ""}
        ${imp.preview.errors.length > 0 ? `
        <div class="import-preview__stat">
          <div class="import-preview__stat-value import-preview__stat-value--bad">${imp.preview.errors.length}</div>
          <div class="import-preview__stat-label">errors</div>
        </div>` : ""}
      </div>

      ${imp.preview.errors.length > 0 ? `
      <div class="import-preview__errors">
        <div class="import-preview__error-title">Errors</div>
        <ul class="import-preview__error-list">
          ${imp.preview.errors.slice(0, 5).map(e => `<li class="import-preview__error-item">${e}</li>`).join("")}
          ${imp.preview.errors.length > 5 ? `<li class="import-preview__error-item">…and ${imp.preview.errors.length - 5} more</li>` : ""}
        </ul>
      </div>` : ""}

      ${imp.preview.previewRows.length > 0 ? `
      <div class="import-preview-table">
        <table>
          <thead><tr><th>Name</th><th>Family</th><th>Room</th><th>Diet</th><th>Passport #</th></tr></thead>
          <tbody>
            ${imp.preview.previewRows.map(r => `
              <tr>
                <td>${r.displayName}</td>
                <td>${r.familyName}</td>
                <td>${r.roomName}</td>
                <td>${r.diet}</td>
                <td>${r.passportNumber}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        ${imp.preview.imported > 5 ? `<p class="muted" style="margin-top:var(--s-2);font-size:12px">Showing first 5 of ${imp.preview.imported} guests</p>` : ""}
      </div>` : ""}

      <div class="import-preview__actions">
        ${imp.preview.imported > 0
          ? `<button class="import-confirm-btn" data-import-confirm>Confirm Import · ${imp.preview.imported} Guests</button>`
          : ""}
        <button class="import-cancel-btn" data-import-cancel>Cancel</button>
      </div>
    </div>` : "";

  const successHTML = imp.result ? `
    <div class="import-success">
      <div class="import-success__icon">✅</div>
      <div class="import-success__title">Import Successful</div>
      <div class="import-success__subtitle">${imp.result.imported} guests imported · ${imp.result.skipped} skipped · ${imp.result.errors.length} errors</div>
      <button class="import-another-btn" data-import-another>Import Another File</button>
    </div>` : "";

  return `
    <section class="dashboard-section">
      <h3>Import Guests</h3>
      <p class="muted" style="margin-bottom:var(--s-4)">Upload a CSV to replace mock data with real guest records. Mock data is never deleted — clearing always reverts to it.</p>

      <div class="import-status-card ${hasLive ? "import-status-card--live" : ""}">
        <div class="import-status-card__mode">${hasLive ? "🟢 LIVE DATA" : "⚪ MOCK DATA"}</div>
        <div class="import-status-card__count">${guestCount} guests active</div>
        ${hasLive && meta ? `<div class="import-status-card__updated">Imported ${formatImportDate(meta.importedAt)}</div>` : ""}
        ${hasLive ? `
        <div class="import-status-card__actions">
          <button class="admin-danger-btn" data-import-clear>Clear → Revert to Mock</button>
          <button class="import-export-btn" data-import-export>⬇ Export as guests.js</button>
        </div>` : ""}
      </div>

      <button class="admin-ghost-btn" data-import-template>⬇ Download CSV Template</button>

      ${imp.status === "idle" ? dropzoneHTML : ""}
      ${imp.status === "previewing" ? previewHTML : ""}
      ${imp.status === "success" ? successHTML : ""}
    </section>
  `;
}

// ---------- Analytics ----------

function bar(value, max, label, sublabel) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `
    <div class="analytics-bar-item">
      <div class="analytics-bar-label-row">
        <span class="analytics-bar-name">${label}</span>
        <span class="analytics-bar-value">${sublabel}</span>
      </div>
      <div class="analytics-bar-track">
        <div class="analytics-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function analyticsSection() {
  const guests = GuestDatabaseService.getAll();
  const ledger = MilesService.getFullLedger();
  const balances = MilesService.getAllBalances();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayTxs = ledger.filter(tx => tx.createdAt >= todayStart && tx.amount > 0);

  // ── Engagement Overview ──────────────────────────────────────────────────
  const totalToday = todayTxs.length;
  const hourCounts = Array(24).fill(0);
  todayTxs.forEach(tx => { hourCounts[new Date(tx.createdAt).getHours()]++; });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourLabel = totalToday > 0
    ? `${peakHour}:00 – ${peakHour + 1}:00` : "—";
  const totalMiles = Object.values(balances).reduce((s, b) => s + Math.max(0, b), 0);
  const avgMiles = guests.length > 0 ? Math.round(totalMiles / guests.length) : 0;
  const zeroGuests = guests.filter(g => !balances[g.id] || balances[g.id] <= 0).length;

  // ── Top 5 Performers ─────────────────────────────────────────────────────
  const top5 = LeaderboardService.getOverall().slice(0, 5);
  const maxBalance = top5[0]?.balance || 1;

  // ── Treasure Hunt Stats ──────────────────────────────────────────────────
  const huntCounts = {};
  HUNT_LOCATIONS.forEach(loc => { huntCounts[loc.id] = 0; });
  guests.forEach(g => {
    getFoundLocations(g.id).forEach(huntId => {
      if (huntCounts[huntId] !== undefined) huntCounts[huntId]++;
    });
  });
  const totalScans = Object.values(huntCounts).reduce((s, n) => s + n, 0);
  const huntScans = todayTxs.filter(tx => tx.kind === "HUNT_DISCOVERY").length;
  const sortedHunts = HUNT_LOCATIONS
    .map(loc => ({ ...loc, count: huntCounts[loc.id] }))
    .sort((a, b) => b.count - a.count);
  const mostFound = sortedHunts[0];
  const leastFound = sortedHunts[sortedHunts.length - 1];
  const completionCount = guests.filter(g => getFoundLocations(g.id).length >= 5).length;

  // ── Family Engagement ────────────────────────────────────────────────────
  const familyTotals = {};
  families.forEach(f => { familyTotals[f.id] = 0; });
  guests.forEach(g => {
    if (g.familyId && familyTotals[g.familyId] !== undefined) {
      familyTotals[g.familyId] += Math.max(0, balances[g.id] || 0);
    }
  });
  const sortedFamilies = families
    .map(f => ({ ...f, total: familyTotals[f.id] || 0 }))
    .sort((a, b) => b.total - a.total);
  const maxFamilyTotal = sortedFamilies[0]?.total || 1;

  // ── Activity Timeline (hourly, today) ────────────────────────────────────
  const maxHourly = Math.max(...hourCounts, 1);

  return `
    <section class="dashboard-section">
      <h3>Analytics</h3>

      <div class="analytics-group-title">Engagement Overview</div>
      <div class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${totalToday}</div>
          <div class="admin-stat-card__label">Transactions Today</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value" style="font-size:16px">${peakHourLabel}</div>
          <div class="admin-stat-card__label">Most Active Hour</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${MilesService.format(avgMiles)}</div>
          <div class="admin-stat-card__label">Avg Miles / Guest</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${zeroGuests}</div>
          <div class="admin-stat-card__label">Guests at 0 Miles</div>
        </div>
      </div>

      <div class="analytics-group-title">Top Performers</div>
      <div class="analytics-bars">
        ${top5.length
          ? top5.map(e => bar(e.balance, maxBalance, e.name.split(" ")[0], `${MilesService.format(e.balance)} ✈`)).join("")
          : `<p class="muted">No miles awarded yet.</p>`}
      </div>

      <div class="analytics-group-title">Treasure Hunt</div>
      <div class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${huntScans}</div>
          <div class="admin-stat-card__label">Scans Today</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${totalScans}</div>
          <div class="admin-stat-card__label">Total Discoveries</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${completionCount}</div>
          <div class="admin-stat-card__label">Found 5+ Locations</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__value">${HUNT_LOCATIONS.length}</div>
          <div class="admin-stat-card__label">Total Locations</div>
        </div>
      </div>
      <div class="analytics-bars" style="margin-top:var(--s-4)">
        ${mostFound ? `
          <div class="analytics-hunt-row analytics-hunt-row--top">
            <span class="analytics-hunt-icon">${mostFound.icon}</span>
            <div class="analytics-hunt-body">
              <div class="analytics-hunt-name">Most found: <strong>${mostFound.name}</strong></div>
              <div class="analytics-hunt-sub">${mostFound.count} discoveries · ${mostFound.location}</div>
            </div>
          </div>
        ` : ""}
        ${leastFound && leastFound.id !== mostFound?.id ? `
          <div class="analytics-hunt-row">
            <span class="analytics-hunt-icon">${leastFound.icon}</span>
            <div class="analytics-hunt-body">
              <div class="analytics-hunt-name">Least found: <strong>${leastFound.name}</strong></div>
              <div class="analytics-hunt-sub">${leastFound.count} discoveries · ${leastFound.location}</div>
            </div>
          </div>
        ` : ""}
      </div>

      <div class="analytics-group-title">Family Engagement</div>
      <div class="analytics-bars">
        ${sortedFamilies.map(f =>
          bar(f.total, maxFamilyTotal, f.name, `${MilesService.format(f.total)} ✈`)
        ).join("")}
      </div>

      <div class="analytics-group-title">Activity Timeline — Today</div>
      <div class="analytics-timeline">
        ${hourCounts.map((count, h) => `
          <div class="analytics-timeline-col">
            <div class="analytics-timeline-bar" style="height:${maxHourly > 0 ? Math.max(2, Math.round((count / maxHourly) * 90)) : 2}px"
                 title="${h}:00 — ${count} tx"></div>
            <div class="analytics-timeline-label">${h % 6 === 0 ? h + "h" : ""}</div>
          </div>
        `).join("")}
      </div>
      <p class="muted" style="margin-top:var(--s-3);font-size:12px">Showing positive transactions only. Times in local time.</p>
    </section>
  `;
}

// ---------- Check-in Scanner ----------

function scannerSection(state) {
  const sc = state.scanner;
  const recent = sc.recentCheckins || [];

  return `
    <section class="dashboard-section">
      <h3>Check-in Scanner</h3>
      <p class="muted" style="margin-bottom:var(--s-4)">Scan a guest's boarding pass QR to check them in and award +100 AR Miles.</p>

      <div class="scanner-viewfinder-wrap" id="scanner-viewfinder-wrap" ${sc.active ? "" : "style=\"display:none\""}>
        <div class="scanner-viewfinder-placeholder" id="scanner-placeholder">
          <div class="scanner-viewfinder-placeholder__icon">📷</div>
          <div class="scanner-viewfinder-placeholder__text">Camera initializing…</div>
        </div>
      </div>

      ${sc.active
        ? `<button class="admin-ghost-btn" style="margin-bottom:var(--s-4)" data-scanner-stop>✕ Stop Scanner</button>`
        : `<button class="admin-submit-btn" style="margin-bottom:var(--s-4)" data-scanner-start>📷 Start Scanner</button>`}

      <div class="scanner-divider">— OR —</div>

      <label class="admin-field-label">Manual Entry</label>
      <div class="scanner-manual-row">
        <input
          class="admin-input scanner-manual-input"
          type="text"
          placeholder="e.g. AR-501-S"
          value="${sc.passportInput}"
          data-scanner-input />
        <button class="admin-submit-btn scanner-manual-btn" data-scanner-checkin>Check In</button>
      </div>

      ${recent.length > 0 ? `
        <label class="admin-field-label" style="margin-top:var(--s-5)">Recent Check-ins</label>
        <div class="scanner-recent">
          ${recent.map(c => `
            <div class="scanner-recent-item">
              <span class="scanner-recent-icon">✅</span>
              <span class="scanner-recent-name">${c.name}</span>
              <span class="scanner-recent-time">${c.time}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

// ---------- Announcements ----------

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAnnTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getAnnouncements() {
  try { return JSON.parse(localStorage.getItem("ar_announcements") || "[]"); } catch { return []; }
}

function announcementsSection(state) {
  const ann = state.announcements;
  const history = getAnnouncements();

  return `
    <section class="dashboard-section">
      <h3>Broadcast Announcement</h3>

      <label class="admin-field-label">Quick Templates</label>
      <div class="announcement-templates">
        ${ANNOUNCEMENT_TEMPLATES.map(msg => `
          <button
            class="announcement-template-btn ${ann.message === msg ? "announcement-template-btn--selected" : ""}"
            data-ann-template="${esc(msg)}">
            ${esc(msg)}
          </button>
        `).join("")}
      </div>

      <label class="admin-field-label">Message</label>
      <textarea
        class="admin-input"
        rows="3"
        placeholder="Type your announcement…"
        data-ann-message>${esc(ann.message)}</textarea>

      <div class="announcement-priority-row">
        <span style="font-size:13px;color:var(--cream-dim)">Priority:</span>
        <label class="announcement-priority-label">
          <input type="radio" name="ann-priority" value="normal"
            ${ann.priority === "normal" ? "checked" : ""} data-ann-priority />
          Normal
        </label>
        <label class="announcement-priority-label">
          <input type="radio" name="ann-priority" value="urgent"
            ${ann.priority === "urgent" ? "checked" : ""} data-ann-priority />
          🔴 Urgent
        </label>
      </div>

      <button class="admin-submit-btn" data-ann-send>📢 Broadcast to All Guests</button>

      ${history.length > 0 ? `
        <label class="admin-field-label" style="margin-top:var(--s-6)">Past Announcements</label>
        <div class="announcement-history">
          ${history.map(a => `
            <div class="announcement-history-item ${a.priority === "urgent" ? "announcement-history-item--urgent" : ""}">
              <span class="announcement-history-time">${formatAnnTime(a.timestamp)}</span>
              <span class="announcement-history-text">${esc(a.message)}</span>
              <button class="announcement-history-delete" data-ann-delete="${a.id}">Delete</button>
            </div>
          `).join("")}
        </div>
      ` : `<p class="muted" style="margin-top:var(--s-4)">No announcements sent yet.</p>`}
    </section>
  `;
}

// ---------- Guest Requests ----------

function formatReqTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getRequests() {
  try { return JSON.parse(localStorage.getItem("ar_requests") || "[]"); } catch { return []; }
}

function requestsSection() {
  const requests = getRequests();
  const eventsContact = localStorage.getItem("ar_events_contact") || "";

  return `
    <section class="dashboard-section">
      <h3>Guest Requests</h3>

      <label class="admin-field-label">Events Management WhatsApp</label>
      <div class="admin-events-contact-row">
        <input
          class="admin-input"
          type="tel"
          placeholder="+91__________"
          value="${esc(eventsContact)}"
          data-events-contact />
        <button class="admin-events-contact-save" data-events-contact-save>Save</button>
      </div>

      ${requests.length
        ? `<button class="admin-ghost-btn" style="margin-bottom:var(--s-4)" data-req-export>📥 Export as CSV</button>`
        : ""}

      <div style="margin-top:var(--s-2)">
        ${requests.length ? requests.map(r => {
          const raw = localStorage.getItem(`ar_request_status_${r.id}`) || "";
          let status = "pending";
          try {
            const parsed = JSON.parse(raw);
            status = parsed?.status || r.status || "pending";
          } catch {
            status = raw || r.status || "pending";
          }
          return `
            <div class="admin-request-row">
              <div class="admin-request-row__info">
                <div class="admin-request-row__guest">${esc(r.guestName)} · Room ${esc(String(r.room))}</div>
                <div class="admin-request-row__type">${esc(r.label)} · ${formatReqTime(r.timestamp)}</div>
                ${r.note ? `<div class="admin-request-row__note">${esc(r.note)}</div>` : ""}
              </div>
              <select class="admin-request-status" data-req-status="${r.id}">
                <option value="pending"     ${status === "pending"     ? "selected" : ""}>● Pending</option>
                <option value="in-progress" ${status === "in-progress" ? "selected" : ""}>● In Progress</option>
                <option value="done"        ${status === "done"        ? "selected" : ""}>✅ Done</option>
              </select>
            </div>
          `;
        }).join("") : `<p class="muted">No guest requests yet.</p>`}
      </div>
    </section>
  `;
}

// ---------- Shell ----------

const SECTION_RENDERERS = {
  overview:      overviewSection,
  award:         awardSection,
  scanner:       scannerSection,
  guests:        guestsSection,
  redemptions:   redemptionsSection,
  qrcodes:       qrCodesSection,
  import:        importSection,
  analytics:     analyticsSection,
  announcements: announcementsSection,
  requests:      requestsSection,
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
