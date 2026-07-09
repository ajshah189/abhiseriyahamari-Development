/**
 * ProfileScreen — Router adapter for the Profile page.
 *
 * Re-renders on every show(), matching JourneyScreen/RewardsScreen —
 * stats, balance and transaction history should reflect whatever's
 * happened elsewhere in the app by the time a guest returns here.
 */

import { ProfilePage } from "./ProfilePage.js";
import AuthService from "../../services/authService.js";
import Router from "../../router.js";

let container = null;

// 5 taps within 1.5s on the avatar opens Admin. No visual hint for
// guests. Module-level so the count survives a re-render mid-sequence.
let tapCount = 0;
let tapTimer = null;

function bindAdminTrigger() {
  const el = container.querySelector("[data-admin-trigger]");
  if (!el) return;

  el.addEventListener("click", () => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 1500);

    if (tapCount >= 5) {
      tapCount = 0;
      Router.go("admin");
    }
  });
}

function bindSignOut() {
  container.querySelector("[data-signout]")?.addEventListener("click", () => {
    if (!confirm("Sign out of AR Airways?")) return;
    AuthService.logout();
    Router.go("onboarding");
  });
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  bindAdminTrigger();
  bindSignOut();
}

function render() {
  container.innerHTML = ProfilePage();
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-profile");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const ProfileScreen = { mount, show, hide };
