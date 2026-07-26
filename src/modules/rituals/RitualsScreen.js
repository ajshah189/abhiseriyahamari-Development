/**
 * RitualsScreen — Router adapter for the Wedding Rituals page.
 *
 * Supports two modes via show(params):
 *   show()                  — renders the list view
 *   show({ ritualId })      — renders the detail view for that ritual
 *
 * Back button in detail view returns to list (re-calls show() with no params),
 * NOT to home — per spec.
 */

import { RitualsPage } from "./RitualsPage.js";
import Router from "../../router.js";

const CONTAINER_ID = "screen-rituals";

let _container = null;
let _currentRitualId = null;

export const RitualsScreen = {
  mount() {
    _container = document.getElementById(CONTAINER_ID);
    console.log('[Rituals] mount — container:', _container);
  },

  show(params = {}) {
    console.log('[Rituals] show — params:', params);
    _currentRitualId = params?.ritualId || null;
    _render();
  },

  hide() {
    if (_container) _container.hidden = true;
  },
};

function _render() {
  if (!_container) return;
  _container.innerHTML = RitualsPage(_currentRitualId);
  _container.hidden = false;
  _bindEvents();
}

function _bindEvents() {
  if (!_container) return;

  _container.querySelectorAll("[data-ritual-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      _currentRitualId = btn.dataset.ritualId;
      _render();
    });
  });

  _container.querySelector("[data-rituals-back]")?.addEventListener("click", () => {
    _currentRitualId = null;
    _render();
  });

  _container.addEventListener("click", e => {
    const routeBtn = e.target.closest("[data-route]");
    if (routeBtn) Router.go(routeBtn.dataset.route);
  });
}
