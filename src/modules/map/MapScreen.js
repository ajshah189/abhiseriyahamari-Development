/**
 * MapScreen — Router adapter for the resort map.
 *
 * The map engine (src/modules/core) is complete and self-contained.
 * This file owns only the boundary between the Router and that subsystem:
 * it lazily bootstraps the map on first visit, then toggles visibility.
 */

import Router from "../../router.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

let container = null;

function applyAdminVisibility() {
  const isAdmin = sessionStorage.getItem("ar_admin_auth") === "true";
  const editorToggle = document.getElementById("editorToggle");
  if (editorToggle) editorToggle.style.display = isAdmin ? "" : "none";
}

async function mount() {
  container = document.getElementById("screen-map");

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

  // ── "Navigate Here" in popup ─────────────────────────────────────────────
  let currentPopupLocId = null;

  // Add secondary listeners to hotspot polygons to track which loc is open.
  // stopPropagation in map.js only stops bubbling — sibling listeners still fire.
  Object.entries(map.hotspotEls).forEach(([id, el]) => {
    el.addEventListener("click", () => { currentPopupLocId = id; });
  });

  document.getElementById("popupNavBtn")?.addEventListener("click", () => {
    document.getElementById("popupOverlay")?.classList.add("hidden");
    const navToSelect = document.getElementById("navToSelect");
    if (navToSelect && currentPopupLocId) navToSelect.value = currentPopupLocId;
    navPanel?.classList.remove("hidden");
  });

  console.log("AR Airways map initialized — ledger architecture active");
}

function show() {
  container.hidden = false;
  applyAdminVisibility();
  document.body.style.overflow = "hidden";
}

function hide() {
  container.hidden = true;
  document.body.style.overflow = "";
}

export const MapScreen = { mount, show, hide };
