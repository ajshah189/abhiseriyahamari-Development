/**
 * ComingSoonScreen — shared "gate not open yet" screen.
 *
 * One Router screen factory reused for every module that's on the
 * roadmap but not built yet (Boarding Pass, Passport, Events, Rewards,
 * Leaderboard, Profile, Settings). This is a deliberate product surface
 * guests may actually see, not a stand-in for missing code — so it
 * carries the airline theme and a real way back, via the shared
 * BottomNav, instead of a dead end.
 */

import { BottomNav } from "../../components/layout/BottomNav.js";
import Router from "../../router.js";

export function createComingSoonScreen(route, { icon, title }) {
  let container = null;

  function render() {
    container.innerHTML = `
      <div class="coming-soon">
        <div class="coming-soon-icon">${icon}</div>
        <div class="coming-soon-eyebrow">Gate Closed</div>
        <h1>${title}</h1>
        <p>This part of your journey is still boarding. Check back soon.</p>
        <button class="btn-ghost" data-back>← Back to Dashboard</button>
      </div>
      ${BottomNav(route)}
    `;

    container.querySelector("[data-back]").addEventListener("click", () => Router.go("home"));
    container.querySelectorAll("[data-route]").forEach((button) => {
      button.addEventListener("click", () => Router.go(button.dataset.route));
    });
  }

  function mount() {
    container = document.getElementById("screen-placeholder");
  }

  function show() {
    render();
    container.hidden = false;
  }

  function hide() {
    container.hidden = true;
  }

  return { mount, show, hide };
}
