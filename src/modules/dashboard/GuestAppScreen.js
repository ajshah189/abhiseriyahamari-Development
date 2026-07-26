/**
 * GuestAppScreen — Router adapter for the guest dashboard.
 *
 * Re-renders HomePage() on every show(), not just the first mount —
 * matching every other screen built since. Necessary now that "current
 * guest" can actually change mid-session (Sign Out, log back in as
 * someone else, switch to Viewer): a mount-once render would keep
 * showing the previous guest's card forever.
 *
 * The "miles:changed" subscription lives here (subscribed once, at
 * mount) rather than inside HomePage() itself — HomePage used to
 * re-subscribe on every call with no unsubscribe, which was harmless
 * only because it was never called more than once. It now is.
 *
 * Countdown interval: started in show(), cleared in hide(). Ticks
 * every second to update #up-next-countdown in-place so the whole
 * page doesn't re-render every second.
 */

import { HomePage } from "./HomePage.js";
import AppStore from "../../store/appStore.js";
import Router from "../../router.js";
import FirebaseService from "../../services/firebaseService.js";
import AuthService from "../../services/authService.js";
import PassengerService from "../../services/passengerService.js";
import MilesService from "../../services/milesService.js";
import { buildShareText } from "../chronicle/ChroniclePage.js";
import { pullToRefresh } from "../../utils/pullToRefresh.js";
import { getUpNextCountdownText, isWeddingWeek } from "./TodaysJourney.js";
import { getCurrentOrNextEvent, getEventStatus } from "../../data/events.js";
import { isJourneyComplete, buildJourneyStats, showJourneyCompleteCard } from "../journey/JourneyCompleteCard.js";

let container        = null;
let refreshTimer     = null;
let countdownTimer   = null;
let _latestChronicle = null;
let _activeChallenge = null;
let _unsubChallenges = null;
let _challengeTimer  = null;

function bindRoutes() {
  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => Router.go(button.dataset.route));
  });

  // Login banner dismiss — store timestamp so it stays hidden for 24h
  container.querySelector("[data-dismiss-login-banner]")?.addEventListener("click", () => {
    try { localStorage.setItem("ar_login_banner_dismissed", String(Date.now())); } catch {}
    container.querySelector(".login-banner")?.remove();
  });

  // Chronicle share — opens WhatsApp with formatted text summary
  container.querySelector("[data-chronicle-share]")?.addEventListener("click", () => {
    if (!_latestChronicle) return;
    const text = buildShareText(_latestChronicle);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  });

  // Quick Actions "More / Less" toggle — pure CSS class flip, no routing
  container.querySelector("[data-qa-toggle]")?.addEventListener("click", () => {
    const grid = container.querySelector("#qa-more-grid");
    const btn  = container.querySelector("[data-qa-toggle]");
    const open = grid?.classList.toggle("expanded");
    if (btn) {
      btn.innerHTML = open
        ? `Less <span class="qa-toggle-chevron">▴</span>`
        : `More ✈ <span class="qa-toggle-chevron">▾</span>`;
    }
  });
}

function showDashboardToast(msg) {
  const t = document.createElement("div");
  t.className = "admin-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2500);
}

function render() {
  container.innerHTML = HomePage(_latestChronicle, _activeChallenge);
  bindRoutes();
  bindChallengeFound();
}

function bindChallengeFound() {
  const btn = container.querySelector("[data-challenge-found]");
  if (!btn || btn.disabled) return;

  btn.addEventListener("click", async () => {
    if (!AuthService.isLoggedIn()) { Router.go("onboarding"); return; }

    const banner = container.querySelector("[data-challenge-id]");
    const challengeId = banner?.dataset?.challengeId;
    if (!challengeId || !_activeChallenge) return;

    const title = _activeChallenge.title || "Daily Challenge";
    if (!confirm(`Have you found it? This is on your honour.\n\n${title}`)) return;

    btn.disabled = true;
    btn.textContent = "Claiming…";

    const snapshot = PassengerService.getCurrentSnapshot();
    const guestId  = snapshot?.profile?.id;
    if (!guestId) { btn.disabled = false; btn.textContent = "I Found It!"; return; }

    const ok = await FirebaseService.completeChallenge(challengeId, guestId, {});
    if (!ok) { btn.disabled = false; btn.textContent = "I Found It!"; return; }

    const miles = _activeChallenge.miles || 0;
    if (miles > 0) {
      MilesService.earn(guestId, miles, `🎯 Challenge: ${title}`, "CHALLENGE");
    }

    if (_activeChallenge.type === "Speed Rush" && _activeChallenge.limit) {
      const completions = await FirebaseService.getChallengeCompletions(challengeId);
      if (completions.length >= _activeChallenge.limit) {
        FirebaseService.endChallenge(challengeId).catch(() => {});
      }
    }

    showDashboardToast(`🎯 Challenge complete! +${miles} AR Miles`);
    btn.textContent = "Claimed ✓";
  });
}

function tickCountdown() {
  const el = container.querySelector("#up-next-countdown");
  if (!el) return;

  const text = getUpNextCountdownText();
  if (text === null) {
    // Event just started or ended — full re-render to pick up new state.
    render();
    return;
  }
  el.textContent = text;
}

function startCountdown() {
  stopCountdown();
  if (!isWeddingWeek()) return; // pre-wedding: days don't need per-second update
  countdownTimer = setInterval(tickCountdown, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function mount() {
  container = document.getElementById("screen-guest");
  render();

  // Batches rapid earns (e.g. admin awarding) into one re-render.
  AppStore.on("miles:changed", () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(render, 80);
  });

  // Subscribe to latest chronicle once — re-renders dashboard when published/updated.
  FirebaseService.subscribeToLatestChronicle((chronicle) => {
    _latestChronicle = chronicle;
    if (!container.hidden) {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(render, 80);
    }
  });

  pullToRefresh(container, async () => { render(); });
}

function show() {
  render();
  container.hidden = false;
  startCountdown();
  _startChallengeSubscription();
  _maybeShowJourneyCard();
}

function _startChallengeSubscription() {
  if (_unsubChallenges) { _unsubChallenges(); _unsubChallenges = null; }
  _unsubChallenges = FirebaseService.subscribeToActiveChallenges((active) => {
    const next = active[0] || null;
    _activeChallenge = next;
    if (!container.hidden) render();
    // For Timed challenges, start a 1-min refresh so the countdown stays current
    if (_challengeTimer) { clearInterval(_challengeTimer); _challengeTimer = null; }
    if (next?.type === "Timed" && next.expiresAt) {
      _challengeTimer = setInterval(() => { if (!container.hidden) render(); }, 60_000);
    }
  });
}

function _maybeShowJourneyCard() {
  if (!isJourneyComplete()) return;
  if (!AuthService.isLoggedIn()) return;
  if (sessionStorage.getItem("ar_journey_card_shown")) return;
  sessionStorage.setItem("ar_journey_card_shown", "1");

  const snapshot = PassengerService.getCurrentSnapshot();
  const guestId  = snapshot?.profile?.id;
  if (!guestId) return;

  setTimeout(() => {
    const stats = buildJourneyStats(guestId);
    showJourneyCompleteCard(snapshot, stats);
  }, 1500);
}

function hide() {
  container.hidden = true;
  stopCountdown();
  if (_unsubChallenges) { _unsubChallenges(); _unsubChallenges = null; }
  if (_challengeTimer)  { clearInterval(_challengeTimer); _challengeTimer = null; }
}

export const GuestAppScreen = { mount, show, hide };
