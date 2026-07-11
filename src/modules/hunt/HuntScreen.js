/**
 * HuntScreen — Router adapter for the Treasure Hunt hub.
 *
 * Manages the active day tab state and re-renders HuntPage on
 * tab switches. State resets to Day 1 on each fresh show().
 */

import { HuntPage } from "./HuntPage.js";
import Router from "../../router.js";

let container = null;
let activeDay = 1;

function render() {
  container.innerHTML = HuntPage(activeDay);
  bindEvents();
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  container.querySelectorAll("[data-hunt-day]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeDay = Number(btn.dataset.huntDay);
      render();
    });
  });

  const startBtn = container.querySelector("[data-start-hunt]");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      sessionStorage.setItem("ar_map_highlight", "HUNT-001");
      Router.go("map");
    });
  }
}

function mount() {
  container = document.getElementById("screen-hunt");
}

function show() {
  container.hidden = false;
  activeDay = 1;
  render();
}

function hide() {
  container.hidden = true;
}

export const HuntScreen = { mount, show, hide };
