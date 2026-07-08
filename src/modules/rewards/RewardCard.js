import { $, copyText, createSvgElement } from "../../utils/dom.js";
import { attrToPoints, pointsToAttr } from "../../utils/geometry.js";

export function initUtilities({ data, map, zones, state }) {
  initOrganizerToggle();
  initCategoryFilters(map.hotspotEls);
  return initShapeEditor({ data, map, zones, state });
}

function initOrganizerToggle() {
  const toggle = $("editorToggle");
  const tools = $("editorTools");
  const divider = $("editorDivider");
  toggle.addEventListener("click", () => {
    const show = tools.hasAttribute("hidden");
    tools.toggleAttribute("hidden", !show);
    divider.toggleAttribute("hidden", !show);
    toggle.classList.toggle("active", show);
  });
}

function initCategoryFilters(hotspotEls) {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
      const cat = chip.dataset.cat;
      const on = chip.classList.contains("active");
      Object.values(hotspotEls).forEach((el) => {
        if (el.dataset.category === cat) {
          el.style.display = on ? "" : "none";
        }
      });
    });
  });
}

function initShapeEditor({ data, map, zones, state }) {
  let workingPoints = [];
  let tracingNew = false;
  let dragInfo = null;

  const editModeBtn = $("editModeBtn");
  const editZonesBtn = $("editZonesBtn");
  const editPanel = $("editPanel");
  const editPanelTitle = $("editPanelTitle");
  const editSelect = $("editLocationSelect");
  const editRedrawBtn = $("editRedrawBtn");
  const editOutput = $("editOutput");
  const editZoneSubModeRow = $("editZoneSubModeRow");
  const editSubAreaBtn = $("editSubAreaBtn");
  const editSubLabelBtn = $("editSubLabelBtn");

  const editLayer = createSvgElement("g");
  editLayer.id = "editLayer";
  map.overlay.appendChild(editLayer);

  function targetList() {
    return state.editTarget === "zone" ? data.roomZones : data.locations;
  }

  function targetLabel(item) {
    return state.editTarget === "zone" ? item.continent : item.name;
  }

  function targetEl(id) {
    return state.editTarget === "zone" ? zones.zoneEls[id].poly : map.hotspotEls[id];
  }

  function populateSelect() {
    editSelect.innerHTML = targetList().map((item) => `<option value="${item.id}">${targetLabel(item)}</option>`).join("");
    state.editSelectedId = targetList()[0].id;
  }

  editSelect.addEventListener("change", () => {
    state.editSelectedId = editSelect.value;
    if (state.editTarget === "zone" && state.editZoneSubMode === "label") {
      zones.setZoneLabelDraggable(state.editSelectedId, true);
    } else {
      loadShapeForEditing(state.editSelectedId);
    }
  });

  function applyZoneSubMode() {
    editSubAreaBtn.classList.toggle("active", state.editZoneSubMode === "area");
    editSubLabelBtn.classList.toggle("active", state.editZoneSubMode === "label");
    if (state.editZoneSubMode === "area") {
      zones.setZoneLabelDraggable(null, false);
      editRedrawBtn.style.display = "";
      loadShapeForEditing(state.editSelectedId);
    } else {
      tracingNew = false;
      workingPoints = [];
      editLayer.innerHTML = "";
      editOutput.value = state.editSelectedId && zones.zoneEls[state.editSelectedId].zone.labelPos
        ? JSON.stringify(zones.zoneEls[state.editSelectedId].zone.labelPos)
        : "";
      editRedrawBtn.style.display = "none";
      zones.setZoneLabelDraggable(state.editSelectedId, true);
    }
  }

  editSubAreaBtn.onclick = () => {
    state.editZoneSubMode = "area";
    applyZoneSubMode();
  };
  editSubLabelBtn.onclick = () => {
    state.editZoneSubMode = "label";
    applyZoneSubMode();
  };

  function openEditUI(target) {
    state.editTarget = target;
    state.editZoneSubMode = "area";
    state.editMode = true;
    editModeBtn.classList.toggle("active", target === "location");
    editZonesBtn.classList.toggle("active", target === "zone");
    editPanelTitle.textContent = target === "zone" ? "Edit Zones" : "Edit Mode";
    editZoneSubModeRow.classList.toggle("hidden", target !== "zone");
    $("editHelpText").textContent = target === "zone"
      ? '"Edit Area" drags the gold dots to reshape, or drag inside to shift the whole area. "Edit Label Position" moves just the continent name \u2014 nothing else is clickable in that mode, so the label always responds to your drag.'
      : 'Drag the gold dots to reshape a corner. Drag inside the shape to move the whole thing. Use "Redraw From Scratch" only if you want to trace an entirely new outline.';
    editPanel.classList.remove("hidden");
    map.viewport.style.cursor = "default";
    map.overlay.style.pointerEvents = "all";
    map.overlay.classList.add("edit-active");
    if (target === "zone") zones.setZonesActive(true);
    populateSelect();
    if (target === "zone") applyZoneSubMode();
    else loadShapeForEditing(state.editSelectedId);
  }

  function closeEditUI() {
    state.editMode = false;
    tracingNew = false;
    editModeBtn.classList.remove("active");
    editZonesBtn.classList.remove("active");
    editPanel.classList.add("hidden");
    map.viewport.style.cursor = "grab";
    map.overlay.style.pointerEvents = "none";
    map.overlay.classList.remove("edit-active");
    editLayer.innerHTML = "";
    editOutput.value = "";
    zones.setZoneLabelDraggable(null, false);
  }

  editModeBtn.onclick = () => {
    if (state.editMode && state.editTarget === "location") closeEditUI();
    else {
      state.closeRoadEdit();
      state.closeEntryEdit();
      openEditUI("location");
    }
  };
  editZonesBtn.onclick = () => {
    if (state.editMode && state.editTarget === "zone") closeEditUI();
    else {
      state.closeRoadEdit();
      state.closeEntryEdit();
      openEditUI("zone");
    }
  };

  function loadShapeForEditing(id) {
    const el = targetEl(id);
    if (!el) return;
    tracingNew = false;
    workingPoints = attrToPoints(el.getAttribute("points"));
    renderWorking();
  }

  function pushLiveToTarget() {
    if (workingPoints.length < 3) return;
    targetEl(state.editSelectedId).setAttribute("points", pointsToAttr(workingPoints));
    if (state.editTarget === "zone") zones.positionZoneLabel(state.editSelectedId);
  }

  function renderWorking() {
    editLayer.innerHTML = "";
    if (!workingPoints.length) {
      editOutput.value = "";
      return;
    }

    const shapeEl = createSvgElement(tracingNew ? "polyline" : "polygon");
    shapeEl.setAttribute("points", pointsToAttr(workingPoints));
    shapeEl.classList.add("edit-line");
    if (!tracingNew) {
      shapeEl.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        startShapeDrag(e);
      });
    }
    editLayer.appendChild(shapeEl);

    workingPoints.forEach((point, index) => {
      const c = createSvgElement("circle");
      c.setAttribute("cx", point[0]);
      c.setAttribute("cy", point[1]);
      c.setAttribute("r", 6);
      c.classList.add("edit-point");
      if (!tracingNew) {
        c.style.cursor = "grab";
        c.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          startVertexDrag(e, index);
        });
      }
      editLayer.appendChild(c);
    });

    editOutput.value = JSON.stringify(workingPoints);
    pushLiveToTarget();
  }

  function startVertexDrag(e, idx) {
    dragInfo = { type: "vertex", idx };
  }

  function startShapeDrag(e) {
    const p = map.toSvgPoint(e);
    dragInfo = { type: "shape", lastX: p.x, lastY: p.y };
  }

  function startLabelDrag(e, zoneId) {
    dragInfo = { type: "label", zoneId };
  }
  state.startLabelDrag = startLabelDrag;

  window.addEventListener("mousemove", (e) => {
    if (!dragInfo || !state.editMode) return;
    const p = map.toSvgPoint(e);
    if (dragInfo.type === "vertex") {
      workingPoints[dragInfo.idx] = [Math.round(p.x), Math.round(p.y)];
      renderWorking();
    } else if (dragInfo.type === "shape") {
      const dx = p.x - dragInfo.lastX;
      const dy = p.y - dragInfo.lastY;
      workingPoints = workingPoints.map(([x, y]) => [Math.round(x + dx), Math.round(y + dy)]);
      dragInfo.lastX = p.x;
      dragInfo.lastY = p.y;
      renderWorking();
    } else if (dragInfo.type === "label") {
      const zone = data.roomZones.find((item) => item.id === dragInfo.zoneId);
      zone.labelPos = [Math.round(p.x), Math.round(p.y)];
      zones.positionZoneLabel(dragInfo.zoneId);
      editOutput.value = JSON.stringify(zone.labelPos);
    }
  });
  window.addEventListener("mouseup", () => { dragInfo = null; });

  editRedrawBtn.onclick = () => {
    tracingNew = true;
    workingPoints = [];
    editLayer.innerHTML = "";
    editOutput.value = "";
  };

  map.overlay.addEventListener("click", (e) => {
    if (!state.editMode || !tracingNew) return;
    const p = map.toSvgPoint(e);
    workingPoints.push([Math.round(p.x), Math.round(p.y)]);
    renderWorking();
  });

  $("editFinishBtn").onclick = () => {
    if (tracingNew) {
      if (workingPoints.length < 3) return;
      tracingNew = false;
      renderWorking();
    }
  };

  $("editClearBtn").onclick = () => {
    if (state.editTarget === "zone" && state.editZoneSubMode === "label") {
      zones.zoneEls[state.editSelectedId].zone.labelPos = null;
      zones.positionZoneLabel(state.editSelectedId);
      editOutput.value = "";
    } else {
      loadShapeForEditing(state.editSelectedId);
    }
  };

  $("editCopyBtn").onclick = () => {
    if (state.editTarget === "zone" && state.editZoneSubMode === "label") {
      const pos = zones.zoneEls[state.editSelectedId].zone.labelPos;
      if (!pos) return;
      copyText(JSON.stringify(pos));
    } else {
      if (!workingPoints.length) return;
      copyText(JSON.stringify(workingPoints));
    }
    editOutput.select();
  };

  $("editExportAllBtn").onclick = () => {
    const all = {};
    targetList().forEach((item) => {
      const el = targetEl(item.id);
      const pts = attrToPoints(el.getAttribute("points"));
      all[item.id] = state.editTarget === "zone" ? { polygon: pts, labelPos: item.labelPos } : pts;
    });
    const json = JSON.stringify(all, null, 2);
    editOutput.value = json;
    copyText(json);
    editOutput.select();
  };

  return { closeEditUI };
}
