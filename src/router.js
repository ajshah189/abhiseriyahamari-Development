/**
 * Router — screen-based navigation for the app shell.
 *
 * A "screen" is `{ mount(), show(), hide() }`. mount() runs lazily, once,
 * the first time a screen is visited; go() after that only toggles
 * show()/hide(). This is what makes navigation instant with no page
 * reload and no re-initialization — critical for a screen as heavy as
 * the resort map, and for keeping AppStore-driven live updates (miles,
 * activity feed) intact on screens that aren't currently visible.
 *
 * Usage:
 *   import Router from "./router.js";
 *   Router.register("home", GuestAppScreen);
 *   Router.register("map", MapScreen);
 *   await Router.go("map");
 */

import AppStore from "./store/appStore.js";

// Routes where the screen container ID doesn't follow screen-{name}
const CONTAINER_IDS = {
  home: 'screen-guest',
  leaderboard: 'screen-rewards',
};

// Routes that skip the fade animation (map has its own init/display logic)
const NO_ANIM_ROUTES = new Set(['map']);

class Router {
  constructor() {
    this._screens = new Map();
    this._current = null;
    this._pending = null;
  }

  /**
   * Register a screen under a route name. Safe to call in any order —
   * screens aren't mounted until they're navigated to.
   */
  register(name, screen) {
    this._screens.set(name, { ...screen, mounted: false });
  }

  has(name) {
    return this._screens.has(name);
  }

  /**
   * Currently active route name, or null before the first go().
   */
  current() {
    return this._current;
  }

  /**
   * Navigate to a registered screen. Mounts it on first visit only.
   * No-ops if already on that screen. Concurrent-safe: a second go()
   * call while one is still mounting waits for it rather than racing.
   */
  async go(name, params) {
    const next = this._screens.get(name);
    if (!next) {
      console.error(`[Router] No screen registered for "${name}"`);
      return;
    }

    if (this._pending) await this._pending;

    if (this._current === name) {
      next.show?.(params);
      return;
    }

    this._pending = this._transition(name, next, params);
    try {
      await this._pending;
    } catch (err) {
      console.error(`[Router] transition to "${name}" failed:`, err);
    } finally {
      this._pending = null;
    }
  }

  async _transition(name, next, params) {
    const previous = this._current ? this._screens.get(this._current) : null;

    const reduceMotion =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skipAnim =
      NO_ANIM_ROUTES.has(name) ||
      NO_ANIM_ROUTES.has(this._current) ||
      reduceMotion;

    // ── Fade out current ──────────────────────────────────────────────
    if (previous && !skipAnim) {
      const prevEl = document.querySelector('[id^="screen-"]:not([hidden])');
      if (prevEl) {
        prevEl.style.transition = 'opacity 0.15s ease';
        prevEl.style.opacity = '0';
        await new Promise(r => setTimeout(r, 150));
        prevEl.style.transition = '';
        prevEl.style.opacity = '';
      }
    }
    previous?.hide?.();

    // ── Mount on first visit ──────────────────────────────────────────
    if (!next.mounted) {
      await next.mount?.(params);
      next.mounted = true;
    }

    // ── Fade in next ──────────────────────────────────────────────────
    if (!skipAnim) {
      const id = CONTAINER_IDS[name] ?? `screen-${name}`;
      const nextEl = document.getElementById(id);
      if (nextEl) nextEl.style.opacity = '0';
      next.show?.(params);
      if (nextEl) {
        nextEl.style.transition = 'opacity 0.2s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          nextEl.style.opacity = '1';
        }));
        await new Promise(r => setTimeout(r, 200));
        nextEl.style.transition = '';
        nextEl.style.opacity = '';
      }
    } else {
      next.show?.(params);
    }

    this._current = name;
    AppStore.emit("route:changed", { route: name, params });
  }
}

export default new Router();
