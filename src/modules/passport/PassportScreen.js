/**
 * PassportScreen — Router adapter for the full Passport page.
 *
 * Re-renders on every show() — stamp statuses change over time
 * (upcoming -> boarding -> landed) independent of any user action,
 * so a guest returning to this screen should see current state.
 */

import { PassportPage } from "./PassportPage.js";
import Router from "../../router.js";

let container = null;

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });
}

function render() {
  container.innerHTML = PassportPage();
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-passport");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const PassportScreen = { mount, show, hide };
