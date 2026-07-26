/**
 * HomePage — the main dashboard surface.
 *
 * Layout (top to bottom):
 *   1. Login banner (viewer mode only, dismissible for 24h)
 *   2. What's On Now widget
 *   3. Quick Actions (4 primary + expandable More)
 *   4. Boarding Pass / Passenger Card
 *   5. Today's Journey timeline
 *   6. Recent Activity feed
 */

import PassengerService from "../../services/passengerService.js";
import AuthService from "../../services/authService.js";

import { PassengerCard } from "../../components/cards/PassengerCard.js";
import { ActivityCard } from "../../components/cards/ActivityCard.js";
import { QuickActions } from "./QuickActions.js";
import { TodaysJourney } from "./TodaysJourney.js";
import { WhatsOnNow } from "./WhatsOnNow.js";
import { ChronicleCard } from "../chronicle/ChroniclePage.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

const BANNER_KEY = "ar_login_banner_dismissed";

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ChallengeBanner(challenge) {
  if (!challenge) return "";

  const completionCount = Object.keys(challenge.completions || {}).length;
  const metaParts = [`+${challenge.miles || 0} ✈`];

  if (challenge.type === "Speed Rush") {
    const remaining = Math.max(0, (challenge.limit || 5) - completionCount);
    metaParts.push(remaining > 0 ? `${remaining} spot${remaining !== 1 ? "s" : ""} left` : "All spots filled");
  } else if (challenge.type === "Timed" && challenge.expiresAt) {
    const minsLeft = Math.max(0, Math.floor((challenge.expiresAt - Date.now()) / 60_000));
    metaParts.push(`${minsLeft}m remaining`);
  } else if (challenge.type === "Open") {
    metaParts.push("Everyone who finds it wins");
  }

  const isFull = challenge.type === "Speed Rush" &&
    completionCount >= (challenge.limit || 5);

  return `
    <div class="challenge-banner" data-challenge-id="${esc(challenge.id)}">
      <div class="challenge-banner__icon">🎯</div>
      <div class="challenge-banner__body">
        <div class="challenge-banner__title">${esc(challenge.title || "Daily Challenge")}</div>
        ${challenge.description ? `<div class="challenge-banner__desc">${esc(challenge.description)}</div>` : ""}
        <div class="challenge-banner__meta">${metaParts.join(" · ")}</div>
      </div>
      <button class="challenge-banner__cta" data-challenge-found ${isFull ? "disabled" : ""}>
        ${isFull ? "Full" : "I Found It!"}
      </button>
    </div>
  `;
}
const BANNER_TTL = 24 * 60 * 60 * 1000; // 24 hours

function isBannerDismissed() {
  try {
    const ts = parseInt(localStorage.getItem(BANNER_KEY) || "0", 10);
    return ts > 0 && (Date.now() - ts) < BANNER_TTL;
  } catch { return false; }
}

function LoginBanner() {
  if (AuthService.isLoggedIn()) return "";
  if (isBannerDismissed()) return "";
  return `
    <div class="login-banner">
      <div class="login-banner__body">
        <div class="login-banner__icon">✈</div>
        <div class="login-banner__text">
          <strong>Welcome to AR Airways</strong>
          <p>Enter your passport number to earn AR Miles, see your room, and join the leaderboard.</p>
        </div>
      </div>
      <div class="login-banner__actions">
        <button class="login-banner__cta" data-route="onboarding">Board Your Flight →</button>
        <button class="login-banner__dismiss" data-dismiss-login-banner aria-label="Dismiss">✕</button>
      </div>
    </div>
  `;
}

export function HomePage(chronicle = null, challenge = null) {
  const snapshot = PassengerService.getCurrentSnapshot();

  return `
    ${TopBar()}
    ${LoginBanner()}
    ${ChallengeBanner(challenge)}
    ${ChronicleCard(chronicle)}
    <main class="dashboard-page">
      <section class="dashboard-main">
        ${WhatsOnNow()}
        ${QuickActions()}
        ${PassengerCard(snapshot)}
        ${TodaysJourney()}
      </section>
      <aside class="dashboard-sidebar">
        ${ActivityCard()}
      </aside>
    </main>
    ${BottomNav("home")}
  `;
}
