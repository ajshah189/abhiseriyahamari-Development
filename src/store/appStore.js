/**
 * AppStore — lightweight pub/sub event bus.
 *
 * When miles change, the store emits "miles:changed". Any module
 * that subscribes (dashboard, passport, topbar) re-renders the
 * affected portion without the others needing to know about it.
 *
 * This is the glue that makes the ecosystem feel live: earn miles
 * on the map, see the dashboard update without a page reload.
 *
 * Usage:
 *   import AppStore from "./appStore.js";
 *   const unsub = AppStore.on("miles:changed", (data) => { ... });
 *   AppStore.emit("miles:changed", { guestId, balance });
 *   unsub(); // cleanup
 */

class AppStore {
  constructor() {
    this._listeners = {};
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);

    return () => {
      this._listeners[event] = this._listeners[event].filter(fn => fn !== callback);
    };
  }

  /**
   * Emit an event with optional data payload.
   */
  emit(event, data) {
    const fns = this._listeners[event];
    if (!fns) return;
    for (const fn of fns) {
      try {
        fn(data);
      } catch (err) {
        console.error(`[AppStore] Listener error on "${event}":`, err);
      }
    }
  }

  /**
   * Subscribe to an event for a single firing only.
   */
  once(event, callback) {
    const unsub = this.on(event, (data) => {
      unsub();
      callback(data);
    });
    return unsub;
  }
}

export default new AppStore();
