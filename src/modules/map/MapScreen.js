/**
 * MapScreen — Router adapter for the resort map.
 *
 * The map itself (src/modules/core) is complete, self-contained and
 * untouched here. This file only owns the boundary between the Router
 * and that subsystem: it lazily bootstraps the map into #screen-map on
 * first visit, then toggles visibility on every visit after that.
 *
 * A full re-init is deliberately avoided — 500 guests on resort wifi
 * should pay the map's asset/import cost once per session, not once
 * per navigation.
 */

import Router from "../../router.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

let container = null;
let homeBtn = null;

function applyAdminVisibility() {
  const isAdmin = sessionStorage.getItem("ar_admin_auth") === "true";
  const editorToggle = document.getElementById("editorToggle");
  const editorDivider = document.getElementById("editorDivider");
  if (editorToggle) editorToggle.style.display = isAdmin ? "" : "none";
  if (editorDivider) editorDivider.style.display = isAdmin ? "" : "none";
}

async function mount() {
  container = document.getElementById("screen-map");
  homeBtn = document.getElementById("homeBtn");

  // Reveal the container before the core map modules run. They measure
  // #viewport's live layout size to compute the initial zoom-to-fit
  // transform — under a `hidden` ancestor that measurement collapses
  // to 0x0, so this can't wait until Router calls show() afterwards.
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

  // Inject BottomNav once at mount
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

  homeBtn.addEventListener("click", () => Router.go("home"));

  console.log("AR Airways map initialized — ledger architecture active");
}

function show() {
  container.hidden = false;
  homeBtn.hidden = false;
  applyAdminVisibility();
  document.body.style.overflow = 'hidden';
}

function hide() {
  container.hidden = true;
  homeBtn.hidden = true;
  document.body.style.overflow = '';
}

export const MapScreen = { mount, show, hide };
