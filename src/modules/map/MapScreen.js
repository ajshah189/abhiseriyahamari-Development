/**
 * MapScreen — Router adapter for the resort map.
 *
 * The map engine (src/modules/core) is complete and self-contained.
 * This file owns only the boundary between the Router and that subsystem:
 * it lazily bootstraps the map on first visit, then toggles visibility.
 */

import Router from "../../router.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import PassengerService from "../../services/passengerService.js";
import GuestDatabaseService from "../../services/guestDatabaseService.js";
import { rooms } from "../../data/rooms.js";

let container = null;

// Stored during mount() so show() can pan/highlight without re-importing
let _hotspotEls = {};
let _flyTo = null;

// Resolved location IDs when a guest is selected in the nav selects
const _navGuestOverride = { from: null, to: null };

// Wrap existing select options in a Locations optgroup, then append a Guests optgroup.
// Called once after initNavigation() has populated the selects.
function addGuestOptgroups(selectEl, which) {
  const existing = Array.from(selectEl.options);
  if (!existing.length) return;

  const locGroup = document.createElement("optgroup");
  locGroup.label = "📍 Locations";
  existing.forEach(opt => locGroup.appendChild(opt.cloneNode(true)));

  const guestGroup = document.createElement("optgroup");
  guestGroup.label = "👤 Guests";
  GuestDatabaseService.getAll().forEach(g => {
    const room = rooms.find(r => r.id === g.roomId);
    const opt = document.createElement("option");
    opt.value = `guest-${g.id}`;
    opt.textContent = room
      ? `${g.displayName} · Room ${room.cottage}`
      : g.displayName;
    guestGroup.appendChild(opt);
  });

  selectEl.innerHTML = "";
  selectEl.appendChild(locGroup);
  selectEl.appendChild(guestGroup);

  // Resolve guest selection to a location ID
  selectEl.addEventListener("change", () => {
    const val = selectEl.value;
    if (!val.startsWith("guest-")) {
      _navGuestOverride[which] = null;
      return;
    }
    const guestId = val.slice(6);
    const guest = GuestDatabaseService.getById(guestId);
    const room = guest ? rooms.find(r => r.id === guest.roomId) : null;
    _navGuestOverride[which] = room ? (findNavLocId(room.name) || null) : null;
  });
}

// Average of polygon point pairs → [cx, cy] in map-image coordinate space
function polygonCentroid(el) {
  const raw = el.getAttribute("points") || "";
  const nums = raw.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  let sx = 0, sy = 0, n = nums.length / 2;
  for (let i = 0; i < nums.length; i += 2) { sx += nums[i]; sy += nums[i + 1]; }
  return n > 0 ? [sx / n, sy / n] : [500, 400];
}

// Match a room name/number against navFromSelect option text or value.
// Options are formatted "{cluster name}[ — {city}]"; values are cluster IDs.
// Handles: direct text match, normalized hyphen stripping ("C-9" → "c9"),
// prefix routing (N→new-building, T→treetop), range clusters (e1-e8).
function findNavLocId(roomName) {
  if (!roomName) return null;
  const sel = document.getElementById("navFromSelect");
  const opts = Array.from(sel?.options || []).filter(o => o.value);
  if (!opts.length) return null;

  const lower = roomName.toLowerCase();

  // 1. Text contains the room name directly (e.g. "Bali" in "C29–C34 — Bali")
  const byText = opts.find(o => o.textContent.toLowerCase().includes(lower));
  if (byText) return byText.value;

  // Normalize: strip hyphens/en-dashes
  const norm = s => s.toLowerCase().replace(/[-–]/g, "");
  const needle = norm(roomName);

  // 2. Normalized value match ("C-9" → "c9" === value "c9")
  const byNormVal = opts.find(o => norm(o.value) === needle);
  if (byNormVal) return byNormVal.value;

  // 3. Normalized text match ("C-9" → "c9" in "c9 — bali")
  const byNormText = opts.find(o => norm(o.textContent).includes(needle));
  if (byNormText) return byNormText.value;

  // 4. Prefix-based routing for block rooms
  const pm = needle.match(/^([a-z]+)(\d+)$/);
  if (pm) {
    const [, prefix, numStr] = pm;
    const num = parseInt(numStr, 10);

    if (prefix === "n") {
      const nb = opts.find(o => o.value === "new-building");
      if (nb) return nb.value;
    }
    if (prefix === "t") {
      const tt = opts.find(o => o.value === "treetop");
      if (tt) return tt.value;
    }
    // Range cluster values like "e1-e8", "c5-c6", "c29-c34"
    for (const o of opts) {
      const rm = o.value.match(/^([a-z]+)(\d+)-[a-z]*(\d+)$/);
      if (!rm) continue;
      const [, vPfx, vStart, vEnd] = rm;
      if (vPfx === prefix && num >= parseInt(vStart, 10) && num <= parseInt(vEnd, 10))
        return o.value;
    }
  }

  return null;
}

// Auto-fill #navFromSelect with the logged-in guest's room and show the
// "Your room · auto-filled" label. Safe to call multiple times (idempotent).
function autoFillNavFrom() {
  const navFromSelect = document.getElementById("navFromSelect");
  const autoFillLabel = document.getElementById("navFromAutoFill");
  if (!navFromSelect) return;

  const passenger = PassengerService.getCurrentPassenger();
  if (!passenger) {
    if (autoFillLabel) autoFillLabel.hidden = true;
    return;
  }

  const room = PassengerService.getPassengerRoom(passenger.id);
  if (!room) {
    if (autoFillLabel) autoFillLabel.hidden = true;
    return;
  }

  const locId = findNavLocId(room.name);
  if (locId) {
    navFromSelect.value = locId;
    if (autoFillLabel) autoFillLabel.hidden = false;
  } else {
    if (autoFillLabel) autoFillLabel.hidden = true;
  }
}

async function mount() {
  container = document.getElementById("screen-map");

  // Inject shared TopBar — identical to Dashboard, Events, Journey, Rewards, Profile
  container.insertAdjacentHTML("afterbegin", TopBar());

  // Fix 4: Edit Map toggle for admins — injects ✏️ button into TopBar right area
  if (sessionStorage.getItem("ar_admin_auth") === "true") {
    const topRight = container.querySelector(".top-right");
    if (topRight) {
      const editBtn = document.createElement("button");
      editBtn.className = "top-icon";
      editBtn.title = "Toggle map editor";
      editBtn.textContent = "✏️";
      topRight.insertBefore(editBtn, topRight.firstChild);
      editBtn.addEventListener("click", () => {
        const tools = document.getElementById("editorTools");
        if (!tools) return;
        tools.hidden = !tools.hidden;
      });
    }
  }

  // Reveal the container before the core map modules run — they measure
  // #viewport's live layout size to compute the initial zoom-to-fit
  // transform. Under a `hidden` ancestor that measurement collapses to 0×0.
  container.hidden = false;

  const [
    { loadMapData },
    { initLabels },
    { initMap },
    { initNavigation },
    { initPopup },
    { initSearch },
    { initUtilities },
    { initZones },
  ] = await Promise.all([
    import("../../services/dataService.js"),
    import("../core/labels.js"),
    import("../core/map.js"),
    import("../core/navigation.js"),
    import("../core/popup.js"),
    import("../core/search.js"),
    import("../core/utilities.js"),
    import("../core/zones.js"),
  ]);

  const data = loadMapData();

  const state = {
    editMode: false,
    editTarget: "location",
    editZoneSubMode: "area",
    editSelectedId: null,
    startLabelDrag() {},
    closeEditUI() {},
    closeRoadEdit() {},
    closeEntryEdit() {},
    routeAnchor: null,
  };

  const hotspotEls = {};

  const popup = initPopup({ state, hotspotEls });
  const map = initMap({ data, state, popup });
  Object.assign(hotspotEls, map.hotspotEls);

  // Store module-level so show() can use them for highlight/pan
  _hotspotEls = map.hotspotEls;
  _flyTo = map.flyTo;

  const zones = initZones({ data, zoneLayer: map.zoneLayer, state });

  initLabels({ mapImage: map.mapImage });
  initSearch({ data, hotspotEls: map.hotspotEls, flyTo: map.flyTo });

  const editor = initUtilities({ data, map, zones, state });
  state.closeEditUI = editor.closeEditUI;

  const navigation = initNavigation({ data, map, state });
  state.closeRoadEdit = navigation.closeRoadEdit;
  state.closeEntryEdit = navigation.closeEntryEdit;
  state.routeAnchor = navigation.routeAnchor;

  // ── Guest optgroups in navigate selects ──────────────────────────────────
  // initNavigation has already populated the selects; wrap them with optgroups
  // and add a Guests group. A capture-phase click on navGoBtn swaps any
  // "guest-{id}" value to the resolved location ID before the core handler fires.
  const navFromSel = document.getElementById("navFromSelect");
  const navToSel   = document.getElementById("navToSelect");
  if (navFromSel) addGuestOptgroups(navFromSel, "from");
  if (navToSel)   addGuestOptgroups(navToSel,   "to");

  // Fix 1: Add rooms optgroup to navToSelect so "Take Me There" on room popups
  // resolves — the popup sets navToSelect.value = roomLocId which only works if
  // room location IDs are actually in the select.
  if (navToSel) {
    const roomGroup = document.createElement("optgroup");
    roomGroup.label = "🏨 Rooms";
    data.locations
      .filter(loc => loc.category === "rooms")
      .forEach(loc => {
        const opt = document.createElement("option");
        opt.value = loc.id;
        opt.textContent = loc.name + (loc.destinationCity ? ` — ${loc.destinationCity}` : "");
        roomGroup.appendChild(opt);
      });
    navToSel.appendChild(roomGroup);
  }

  document.getElementById("navGoBtn")?.addEventListener("click", (e) => {
    let blocked = false;
    if (navFromSel?.value?.startsWith("guest-")) {
      if (_navGuestOverride.from) {
        navFromSel.value = _navGuestOverride.from;
      } else {
        e.stopImmediatePropagation();
        blocked = true;
        // Reset so user can try again
        navFromSel.value = navFromSel.options[0]?.value || "";
        _navGuestOverride.from = null;
        alert("Room not mapped — guest's room has no matching location on this map.");
      }
    }
    if (!blocked && navToSel?.value?.startsWith("guest-")) {
      if (_navGuestOverride.to) {
        navToSel.value = _navGuestOverride.to;
      } else {
        e.stopImmediatePropagation();
        navToSel.value = navToSel.options[0]?.value || "";
        _navGuestOverride.to = null;
        alert("Room not mapped — guest's room has no matching location on this map.");
      }
    }
  }, true); // capture phase: fires before core's bubbling listener

  // ── BottomNav ────────────────────────────────────────────────────────────
  const navWrapper = document.createElement("div");
  navWrapper.innerHTML = BottomNav("map");
  const navEl = navWrapper.firstElementChild;
  if (navEl) {
    container.appendChild(navEl);
    navEl.querySelectorAll("[data-route]").forEach(btn => {
      btn.addEventListener("click", () => Router.go(btn.dataset.route));
    });
  }

  // Push map content above the fixed BottomNav
  const viewport = document.getElementById("viewport");
  if (viewport) viewport.style.paddingBottom = "64px";

  // ── Prevent page scroll during map touch pan ─────────────────────────────
  // map.js touch handlers are passive (can't call preventDefault there).
  // This non-passive listener on the same element fills the gap.
  if (viewport) {
    viewport.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }

  // ── Search bar ───────────────────────────────────────────────────────────
  const mapSearchBar = document.getElementById("mapSearchBar");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  document.getElementById("mapSearchClose")?.addEventListener("click", () => {
    if (mapSearchBar) mapSearchBar.hidden = true;
    if (searchInput) searchInput.value = "";
    searchResults?.classList.add("hidden");
  });

  // ── Navigate panel backdrop / close button ───────────────────────────────
  const navPanel = document.getElementById("navPanel");

  navPanel?.addEventListener("click", (e) => {
    if (!e.target.closest(".map-nav-sheet")) {
      navPanel.classList.add("hidden");
    }
  });

  document.getElementById("navPanelClose")?.addEventListener("click", () => {
    navPanel?.classList.add("hidden");
  });

  // ── Auto-fill "From" when FAB opens the nav panel ────────────────────────
  // Core's onclick fires first (toggling .hidden), then this listener checks
  // the resulting state — if the panel is now visible, auto-fill From.
  document.getElementById("navigateBtn")?.addEventListener("click", () => {
    if (!navPanel?.classList.contains("hidden")) {
      autoFillNavFrom();
    }
  });

  // ── Popup hotspot tracking ────────────────────────────────────────────────
  let currentPopupLocId = null;

  Object.entries(map.hotspotEls).forEach(([id, el]) => {
    el.addEventListener("click", () => {
      currentPopupLocId = id;
      // "Take Me There" only for logged-in guests
      const takeMeThereBtn = document.getElementById("popupTakeMeThereBtn");
      if (takeMeThereBtn) {
        takeMeThereBtn.hidden = !PassengerService.getCurrentPassenger();
      }
    });
  });

  // ── "Take Me There ✈" — one-tap route for logged-in guests ───────────────
  document.getElementById("popupTakeMeThereBtn")?.addEventListener("click", () => {
    document.getElementById("popupOverlay")?.classList.add("hidden");
    const navToSelect = document.getElementById("navToSelect");
    if (navToSelect && currentPopupLocId) navToSelect.value = currentPopupLocId;
    navPanel?.classList.remove("hidden");
    autoFillNavFrom();
    // Allow selects to settle before firing the route calculation
    setTimeout(() => document.getElementById("navGoBtn")?.click(), 60);
  });

  // ── Guest search extension ───────────────────────────────────────────────
  // Appended after core search results; searches by display name or last name.
  searchInput?.addEventListener("input", () => {
    searchResults?.querySelector(".search-guests")?.remove();
    const q = searchInput.value.trim().toLowerCase();
    if (!q || q.length < 2) return;

    const all = PassengerService.getAllPassengers();
    const matches = all
      .filter(p =>
        p.displayName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      )
      .slice(0, 5);

    if (!matches.length) return;

    const section = document.createElement("div");
    section.className = "search-guests";
    section.innerHTML = `
      <div class="search-section-label">GUESTS</div>
      ${matches.map(p => {
        const room = PassengerService.getPassengerRoom(p.id);
        const locId = room ? (findNavLocId(room.name) || "") : "";
        return `<div class="search-result search-guest-result" data-guest-loc="${locId}">
          <span class="search-result__icon">👤</span>
          <div class="search-result__body">
            <div class="search-result__name">${p.displayName}</div>
            ${room ? `<div class="search-result__room">${room.name}</div>` : ""}
          </div>
        </div>`;
      }).join("")}
    `;

    section.querySelectorAll(".search-guest-result").forEach(el => {
      el.addEventListener("click", () => {
        const locId = el.dataset.guestLoc;
        if (!locId) return;
        if (mapSearchBar) mapSearchBar.hidden = true;
        if (searchInput) searchInput.value = "";
        searchResults?.classList.add("hidden");
        const polygon = _hotspotEls[locId];
        if (polygon && _flyTo) {
          const [cx, cy] = polygonCentroid(polygon);
          _flyTo(cx, cy, 2.5);
          setTimeout(() => polygon.click(), 400);
        }
      });
    });

    searchResults?.classList.remove("hidden");
    searchResults?.appendChild(section);
  });

  console.log("AR Airways map initialized — ledger architecture active");
}

function show() {
  container.hidden = false;
  document.body.style.overflow = "hidden";

  // ── "Find on Map" highlight from Guest Directory ─────────────────────────
  // DirectoryPage sets ar_map_highlight = room.name (e.g. "Bali").
  // We match it against navFromSelect option text to get the cluster locId.
  const roomName = sessionStorage.getItem("ar_map_highlight");
  if (roomName) {
    sessionStorage.removeItem("ar_map_highlight");
    setTimeout(() => {
      const locId = findNavLocId(roomName);
      const polygon = locId ? _hotspotEls[locId] : null;
      if (polygon && _flyTo) {
        const [cx, cy] = polygonCentroid(polygon);
        _flyTo(cx, cy, 2.5);
        setTimeout(() => {
          polygon.classList.add("map-highlight-pulse");
          polygon.click();
          setTimeout(() => polygon.classList.remove("map-highlight-pulse"), 3200);
        }, 450);
      }
    }, 300);
  }
}

function hide() {
  container.hidden = true;
  document.body.style.overflow = "";
}

export const MapScreen = { mount, show, hide };
