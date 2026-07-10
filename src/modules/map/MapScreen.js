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

let container = null;

// Stored during mount() so show() can pan/highlight without re-importing
let _hotspotEls = {};
let _flyTo = null;

// Average of polygon point pairs → [cx, cy] in map-image coordinate space
function polygonCentroid(el) {
  const raw = el.getAttribute("points") || "";
  const nums = raw.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  let sx = 0, sy = 0, n = nums.length / 2;
  for (let i = 0; i < nums.length; i += 2) { sx += nums[i]; sy += nums[i + 1]; }
  return n > 0 ? [sx / n, sy / n] : [500, 400];
}

// Match a room name (e.g. "Bali") against navFromSelect option display text
// (options are formatted as "C29–C34 — Bali" by navigation.js)
function findNavLocId(roomName) {
  if (!roomName) return null;
  const sel = document.getElementById("navFromSelect");
  const opt = Array.from(sel?.options || []).find(o =>
    o.textContent.toLowerCase().includes(roomName.toLowerCase())
  );
  return opt?.value || null;
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

function applyAdminVisibility() {
  const isAdmin = sessionStorage.getItem("ar_admin_auth") === "true";
  const editorToggle = document.getElementById("editorToggle");
  if (editorToggle) editorToggle.style.display = isAdmin ? "" : "none";
}

async function mount() {
  container = document.getElementById("screen-map");

  // Inject shared TopBar (map variant) — replaces the old static HTML in index.html
  container.insertAdjacentHTML("afterbegin", TopBar({ map: true }));

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

  applyAdminVisibility();

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

  // ── Back button ──────────────────────────────────────────────────────────
  document.getElementById("mapBackBtn")?.addEventListener("click", () => {
    Router.go("home");
  });

  // ── Search bar toggle ────────────────────────────────────────────────────
  const mapSearchBar = document.getElementById("mapSearchBar");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  document.getElementById("mapSearchToggle")?.addEventListener("click", () => {
    if (mapSearchBar) {
      mapSearchBar.hidden = false;
      searchInput?.focus();
    }
  });

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

  // ── "Navigate Here" in popup ─────────────────────────────────────────────
  let currentPopupLocId = null;

  // Track which hotspot the popup is showing. stopPropagation in map.js
  // blocks bubbling but NOT sibling listeners on the same element.
  Object.entries(map.hotspotEls).forEach(([id, el]) => {
    el.addEventListener("click", () => {
      currentPopupLocId = id;
      // Show "Take Me There" only for logged-in guests
      const takeMeThereBtn = document.getElementById("popupTakeMeThereBtn");
      if (takeMeThereBtn) {
        takeMeThereBtn.hidden = !PassengerService.getCurrentPassenger();
      }
    });
  });

  document.getElementById("popupNavBtn")?.addEventListener("click", () => {
    document.getElementById("popupOverlay")?.classList.add("hidden");
    const navToSelect = document.getElementById("navToSelect");
    if (navToSelect && currentPopupLocId) navToSelect.value = currentPopupLocId;
    navPanel?.classList.remove("hidden");
    autoFillNavFrom();
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
  applyAdminVisibility();
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
