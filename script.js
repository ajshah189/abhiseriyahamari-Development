(async () => {
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
    import("./src/services/dataService.js"),
    import("./src/modules/core/labels.js"),
    import("./src/modules/core/map.js"),
    import("./src/modules/core/navigation.js"),
    import("./src/modules/core/popup.js"),
    import("./src/modules/core/search.js"),
    import("./src/modules/core/utilities.js"),
    import("./src/modules/core/zones.js"),
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

  const zones = initZones({
    data,
    zoneLayer: map.zoneLayer,
    state,
  });

  initLabels({
    mapImage: map.mapImage,
  });

  initSearch({
    data,
    hotspotEls: map.hotspotEls,
    flyTo: map.flyTo,
  });

  const editor = initUtilities({
    data,
    map,
    zones,
    state,
  });

  state.closeEditUI = editor.closeEditUI;

  const navigation = initNavigation({
    data,
    map,
    state,
  });

  state.closeRoadEdit = navigation.closeRoadEdit;
  state.closeEntryEdit = navigation.closeEntryEdit;
  state.routeAnchor = navigation.routeAnchor;

  console.log("AR Airways v2 initialized");
})();