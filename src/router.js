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
    previous?.hide?.();

    if (!next.mounted) {
      await next.mount?.(params);
      next.mounted = true;
    }
    next.show?.(params);

    this._current = name;
    AppStore.emit("route:changed", { route: name, params });
  }
}

export default new Router();
