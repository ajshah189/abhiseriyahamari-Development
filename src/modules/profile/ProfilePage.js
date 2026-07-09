/**
 * ProfilePage — the guest's personal page.
 *
 * A single scrollable page, not a hub. Every figure comes from the
 * ledger/services: PassengerService for identity, MilesService for
 * balance and transactions, RewardService for redemptions, and
 * data/events.js for the two journey-stat counts (events attended /
 * countries visited are wedding-wide "landed" counts — every guest
 * shares the same schedule, so there's no per-guest attendance to
 * track separately).
 */

import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import RewardService from "../../services/rewardService.js";
import AuthService from "../../services/authService.js";
import { EVENTS, getEventStatus } from "../../data/events.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { initials, colorFromName } from "../leaderboard/LeaderboardCard.js";

function getJourneyStats(balance) {
  const landedEvents = EVENTS.filter(e => getEventStatus(e) === "landed");
  const countries = new Set(landedEvents.map(e => e.country));

  return {
    miles: balance,
    eventsAttended: landedEvents.length,
    countriesVisited: countries.size,
  };
}

function profileHeader(snapshot) {
  const name = snapshot?.profile?.passengerName || "Guest";
  const tier = snapshot?.tier?.current?.name || "Explorer";
  const family = snapshot?.profile?.family;
  const cottage = snapshot?.profile?.roomCottage || snapshot?.profile?.room || "TBD";
  const zone = snapshot?.profile?.roomZone;

  return `
    <section class="profile-header">
      <div class="profile-avatar" data-admin-trigger style="background:${colorFromName(name)}">${initials(name)}</div>
      <h1 class="profile-name">${name}</h1>
      <div class="tier-badge">${tier}</div>
      ${family ? `<p class="profile-family">${family}</p>` : ""}
      <p class="profile-room">Room ${cottage}${zone ? ` — ${zone} Zone` : ""}</p>
    </section>
  `;
}

function journeyStats(stats) {
  return `
    <section class="profile-stats">
      <div class="stat-card">
        <div class="stat-card__value">${MilesService.format(stats.miles)} ✈</div>
        <div class="stat-card__label">AR Miles</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${stats.eventsAttended}</div>
        <div class="stat-card__label">Events Attended</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${stats.countriesVisited}</div>
        <div class="stat-card__label">Countries Visited</div>
      </div>
    </section>
  `;
}

function transactionRow(tx) {
  const isEarn = tx.amount >= 0;
  const sign = isEarn ? "+" : "";

  return `
    <div class="transaction-row ${isEarn ? "transaction-row--earn" : "transaction-row--redeem"}">
      <div class="transaction-row__date">${MilesService.formatTime(tx.createdAt)}</div>
      <div class="transaction-row__desc">${tx.reason}</div>
      <div class="transaction-row__amount">${sign}${MilesService.format(tx.amount)}</div>
    </div>
  `;
}

function transactionHistory(guestId) {
  const transactions = MilesService.getLedger(guestId).slice(0, 20);

  return `
    <section class="dashboard-section">
      <h3>Transaction History</h3>
      ${transactions.length
        ? `<div class="transaction-list">${transactions.map(transactionRow).join("")}</div>`
        : `<p class="muted">No miles earned yet</p>`}
    </section>
  `;
}

function myRewards(guestId) {
  const redemptions = RewardService.getRedemptions(guestId);

  return `
    <section class="dashboard-section">
      <h3>Redeemed Rewards</h3>
      ${redemptions.length
        ? `<div class="redeemed-list">${redemptions.map(r => `
            <div class="redeemed-row">
              <span>${r.name}</span>
              <span class="redeemed-row__cost">${MilesService.format(r.cost)} ✈</span>
            </div>
          `).join("")}</div>`
        : `<p class="muted">No rewards redeemed yet. Visit the Rewards lounge to browse.</p>`}
    </section>
  `;
}

function quickInfo(snapshot) {
  const diet = snapshot?.profile?.dietPreference || "Not specified";
  const emergency = snapshot?.profile?.emergencyContact || "Not specified";
  const checkedIn = snapshot?.profile?.checkedIn;

  return `
    <section class="dashboard-section">
      <h3>Quick Info</h3>
      <div class="quick-info-list">
        <div class="quick-info-row">
          <span>Diet Preference</span>
          <strong>${diet}</strong>
        </div>
        <div class="quick-info-row">
          <span>Emergency Contact</span>
          <strong>${emergency}</strong>
        </div>
        <div class="quick-info-row">
          <span>Check-in Status</span>
          <strong>${checkedIn ? "Checked In" : "Not Checked In"}</strong>
        </div>
      </div>
      <p class="quick-info-help">Need help? Find a volunteer or visit the front desk.</p>
    </section>
  `;
}

function loggedOutState() {
  return `
    <section class="profile-header">
      <div class="profile-avatar profile-avatar--placeholder" data-admin-trigger>✈</div>
      <h1 class="profile-name">Not Logged In</h1>
      <p class="profile-family">Log in with your passport number to see your profile</p>
      <button class="access-locked__cta" data-route="onboarding">Enter Passport →</button>
    </section>
  `;
}

function signOut() {
  return `
    <section class="profile-signout">
      <button class="profile-signout__btn" data-signout>Sign Out</button>
    </section>
  `;
}

export function ProfilePage() {
  if (!AuthService.isLoggedIn()) {
    return `
      ${TopBar()}
      <main class="profile-page">
        ${loggedOutState()}
      </main>
      ${BottomNav("profile")}
    `;
  }

  const snapshot = PassengerService.getCurrentSnapshot();
  const guestId = snapshot?.profile?.id;
  const stats = getJourneyStats(snapshot?.balance || 0);

  return `
    ${TopBar()}
    <main class="profile-page">
      ${profileHeader(snapshot)}
      ${journeyStats(stats)}
      ${transactionHistory(guestId)}
      ${myRewards(guestId)}
      ${quickInfo(snapshot)}
      ${signOut()}
    </main>
    ${BottomNav("profile")}
  `;
}
