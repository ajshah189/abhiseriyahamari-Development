/**
 * StoryScreen — Router adapter for the Couple Story page.
 *
 * Manages current card index, swipe/drag detection, and prev/next navigation.
 */

import { CoupleStoryPage } from "./CoupleStoryPage.js";
import { COUPLE_STORY } from "../../data/coupleStory.js";
import Router from "../../router.js";

const CONTAINER_ID = "screen-story";
const SWIPE_THRESHOLD = 50; // px

let _container = null;
let _index = 0;

// ── Render & bind ─────────────────────────────────────────────────────────

function _render() {
  if (!_container) return;
  _container.innerHTML = CoupleStoryPage(_index);
  _container.hidden = false;
  _bindEvents();
}

function _bindEvents() {
  if (!_container) return;

  // Close / route buttons
  _container.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => Router.go(btn.dataset.route));
  });

  // Prev / next arrows
  _container.querySelector("[data-story-prev]")?.addEventListener("click", () => {
    if (_index > 0) { _index--; _render(); }
  });
  _container.querySelector("[data-story-next]")?.addEventListener("click", () => {
    if (_index < COUPLE_STORY.length - 1) { _index++; _render(); }
  });

  // Dot nav
  _container.querySelectorAll("[data-story-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      _index = Number(btn.dataset.storyGo);
      _render();
    });
  });

  // Swipe / drag (touch + mouse)
  const track = _container.querySelector("#storyTrack");
  if (!track) return;

  let startX = null;

  function onStart(x) { startX = x; }
  function onEnd(x) {
    if (startX === null) return;
    const delta = startX - x;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta > 0 && _index < COUPLE_STORY.length - 1) _index++;
      else if (delta < 0 && _index > 0) _index--;
      _render();
    }
    startX = null;
  }

  // Touch
  track.addEventListener("touchstart", e => onStart(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend",   e => onEnd(e.changedTouches[0].clientX), { passive: true });

  // Mouse drag
  track.addEventListener("mousedown", e => onStart(e.clientX));
  track.addEventListener("mouseup",   e => onEnd(e.clientX));
  track.addEventListener("mouseleave", () => { startX = null; });
}

// ── Lifecycle ────────────────────────────────────────────────────────────

export const StoryScreen = {
  mount() {
    _container = document.getElementById(CONTAINER_ID);
  },

  show(params = {}) {
    _index = 0;
    _render();
  },

  hide() {
    if (_container) _container.hidden = true;
  },
};
