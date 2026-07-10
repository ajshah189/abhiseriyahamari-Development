# Session Report — Blank Screen Debug

Date: 10 July 2026
Scope: Identified and fixed two compounding causes of the blank-screen regression.

---

## Root Cause 1: Router `_pending` never cleared on failure

**File:** `src/router.js` — `go()` method

```js
// BEFORE (broken)
this._pending = this._transition(name, next, params);
await this._pending;
this._pending = null;   // ← never reached if _transition throws
```

If `_transition()` rejected for any reason, `this._pending` stayed as a rejected
Promise. Every subsequent call to `Router.go()` hit:

```js
if (this._pending) await this._pending;
```

…and immediately rethrew the old rejection without ever calling `_transition()`.
This is exactly why "manually calling `App.start()` again from the console leaves
it empty" — the second call fails before `mount()` is ever attempted.

**Fix:** wrap in try/catch/finally so `_pending` is always cleared and errors
surface in the console:

```js
this._pending = this._transition(name, next, params);
try {
  await this._pending;
} catch (err) {
  console.error(`[Router] transition to "${name}" failed:`, err);
} finally {
  this._pending = null;
}
```

---

## Root Cause 2: admin.css desktop media query missing `:not([hidden])`

**File:** `src/modules/admin/admin.css`

Change 1 (earlier debug session) added `:not([hidden])` to the top-level
`#screen-admin { display: flex }` rule, but left the desktop media query
untouched:

```css
@media (min-width: 768px) {
  #screen-admin {
    display: grid;   /* author style overrides UA [hidden] { display: none } */
    ...
  }
}
```

On viewports ≥ 768 px, this author-level `display: grid` overrides the
browser's UA stylesheet rule `[hidden] { display: none }`. The admin screen
rendered as an empty grid even when the router had never navigated to it —
a blank overlay covering every other screen.

Change 2 (`[hidden] { display: none !important }` in style.css) papered over
this with `!important` but left the admin.css itself incorrect.

**Fix:**

```css
@media (min-width: 768px) {
  #screen-admin:not([hidden]) {
    display: grid;
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto 1fr;
  }
}
```

---

## Invariant to preserve going forward

Every CSS block that sets `display: flex | grid | block` on a screen container
(`#screen-*`) must be qualified with `:not([hidden])`. The `[hidden]` attribute
is the sole source of truth for screen visibility — the router sets and clears
it in `show()` and `hide()`. A `display` rule without the guard will override
the UA stylesheet's `[hidden] { display: none }` and leak the screen into view
when it shouldn't be shown.
