import { APP_CONFIG } from "../../config.js";
import {
  CATEGORY_ROOMS,
  DEFAULT_NAV_DESTINATION_ID,
  NAV_EXCLUDED_IDS,
  ROAD_DRAG_THRESHOLD,
  ROUTE_ESTIMATE,
} from "../../constants.js";
import { $, copyText, createSvgElement } from "../../utils/dom.js";
import { pathLength, polygonCentroid } from "../../utils/geometry.js";

export function initNavigation({ data, map, state }) {
  const navigateBtn = $("navigateBtn");
  const navPanel = $("navPanel");
  const navFromSelect = $("navFromSelect");
  const navToSelect = $("navToSelect");
  const routeLayer = map.routeLayer;

  const navRooms = data.locations.filter((loc) => loc.category === CATEGORY_ROOMS);
  const navDestinations = data.locations.filter((loc) => loc.category !== CATEGORY_ROOMS && !NAV_EXCLUDED_IDS.includes(loc.id));

  navFromSelect.innerHTML = navRooms
    .map((loc) => `<option value="${loc.id}">${loc.name}${loc.destinationCity ? " \u2014 " + loc.destinationCity : ""}</option>`)
    .join("");
  navToSelect.innerHTML = navDestinations
    .map((loc) => `<option value="${loc.id}">${loc.icon || ""} ${loc.name}</option>`)
    .join("");

  const weddingOption = navDestinations.find((loc) => loc.id === DEFAULT_NAV_DESTINATION_ID);
  if (weddingOption) navToSelect.value = weddingOption.id;

  navigateBtn.onclick = () => {
    navPanel.classList.toggle("hidden");
  };

  function fitBounds(points) {
    map.fitBounds(points);
  }

  function buildRoadAdjacency() {
    const adj = {};
    data.roadNodes.forEach((node) => { adj[node.id] = []; });
    data.roadEdges.forEach(([a, b]) => {
      const na = data.roadNodes.find((node) => node.id === a);
      const nb = data.roadNodes.find((node) => node.id === b);
      if (!na || !nb) return;
      const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
      adj[a].push({ to: b, dist });
      adj[b].push({ to: a, dist });
    });
    return adj;
  }

  function nearestRoadNode(x, y) {
    let best = null;
    let bestDist = Infinity;
    data.roadNodes.forEach((node) => {
      const d = Math.hypot(node.x - x, node.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    });
    return best;
  }

  function dijkstra(startId, endId) {
    const adj = buildRoadAdjacency();
    const dist = {};
    const prev = {};
    data.roadNodes.forEach((node) => { dist[node.id] = Infinity; });
    dist[startId] = 0;
    const queue = new Set(data.roadNodes.map((node) => node.id));

    while (queue.size) {
      let u = null;
      let uDist = Infinity;
      queue.forEach((id) => {
        if (dist[id] < uDist) {
          uDist = dist[id];
          u = id;
        }
      });
      if (u === null) break;
      queue.delete(u);
      if (u === endId) break;
      (adj[u] || []).forEach(({ to, dist: d }) => {
        const alt = dist[u] + d;
        if (alt < dist[to]) {
          dist[to] = alt;
          prev[to] = u;
        }
      });
    }

    if (dist[endId] === Infinity) return null;
    const path = [endId];
    let cur = endId;
    while (cur !== startId) {
      cur = prev[cur];
      if (cur === undefined) return null;
      path.unshift(cur);
    }
    return path;
  }

  function routeAnchor(loc) {
    return loc.entryPoint || polygonCentroid(loc.polygon);
  }
  state.routeAnchor = routeAnchor;

  function getRoutePoints(fromId, toId) {
    const startLoc = data.locations.find((loc) => loc.id === fromId);
    const endLoc = data.locations.find((loc) => loc.id === toId);
    if (!startLoc || !endLoc) return null;
    const start = routeAnchor(startLoc);
    const end = routeAnchor(endLoc);
    const startNode = nearestRoadNode(...start);
    const endNode = nearestRoadNode(...end);
    if (!startNode || !endNode) return [start, end];
    const nodePath = dijkstra(startNode.id, endNode.id);
    if (!nodePath) return [start, end];
    const roadPoints = nodePath.map((id) => {
      const node = data.roadNodes.find((roadNode) => roadNode.id === id);
      return [node.x, node.y];
    });
    return [start, ...roadPoints, end];
  }

  function drawRoute(fromId, toId) {
    routeLayer.innerHTML = "";
    const points = getRoutePoints(fromId, toId);
    if (!points) return;

    const d = "M " + points.map((point) => `${point[0]},${point[1]}`).join(" L ");

    const path = createSvgElement("path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", APP_CONFIG.themeColors.routeGold);
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-dasharray", "3 11");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.classList.add("route-path");
    routeLayer.appendChild(path);

    const [x1, y1] = points[0];
    const [x2, y2] = points[points.length - 1];
    [[x1, y1, APP_CONFIG.themeColors.routeGold], [x2, y2, APP_CONFIG.themeColors.rose]].forEach(([x, y, color]) => {
      const c = createSvgElement("circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", 7);
      c.setAttribute("fill", color);
      c.setAttribute("stroke", "#f3ecda");
      c.setAttribute("stroke-width", "2");
      routeLayer.appendChild(c);
    });

    const plane = createSvgElement("path");
    plane.setAttribute("d", "M 13,0 L -9,7.5 L -3.5,0 L -9,-7.5 Z");
    plane.setAttribute("fill", "#ffffff");
    plane.setAttribute("stroke", APP_CONFIG.themeColors.night);
    plane.setAttribute("stroke-width", "1");
    plane.setAttribute("stroke-linejoin", "round");
    plane.style.filter = "drop-shadow(0 1px 3px rgba(0,0,0,0.6))";

    const totalLen = pathLength(points);
    const animateMotion = createSvgElement("animateMotion");
    animateMotion.setAttribute("dur", Math.max(2, Math.min(8, totalLen / 220)) + "s");
    animateMotion.setAttribute("repeatCount", "indefinite");
    animateMotion.setAttribute("rotate", "auto");
    animateMotion.setAttribute("path", d);
    plane.appendChild(animateMotion);
    routeLayer.appendChild(plane);

    const meters = Math.round(totalLen / ROUTE_ESTIMATE.pxPerMeter);
    const minutes = Math.max(1, Math.round(meters / ROUTE_ESTIMATE.walkSpeedMps / 60));
    $("navEta").textContent = `\u2248 ${minutes} min walk (~${meters} m) \u2014 estimate`;

    fitBounds(points);
  }

  $("navGoBtn").onclick = () => drawRoute(navFromSelect.value, navToSelect.value);
  $("navClearBtn").onclick = () => {
    routeLayer.innerHTML = "";
    $("navEta").textContent = "";
  };

  const roadEditor = initRoadEditor({ data, map, state });
  const entryEditor = initEntryEditor({ data, map, state, navDestinations, routeAnchor });

  return {
    navDestinations,
    closeRoadEdit: roadEditor.closeRoadEdit,
    closeEntryEdit: entryEditor.closeEntryEdit,
    routeAnchor,
  };
}

function initRoadEditor({ data, map, state }) {
  let roadEditMode = false;
  let roadSelectedNode = null;
  let roadPointerDown = null;
  const editRoadsBtn = $("editRoadsBtn");
  const roadPanel = $("roadPanel");
  const roadOutput = $("roadOutput");
  const roadEditLayer = createSvgElement("g");
  roadEditLayer.id = "roadEditLayer";
  map.overlay.appendChild(roadEditLayer);

  function renderRoadGraph() {
    roadEditLayer.innerHTML = "";
    data.roadEdges.forEach(([a, b]) => {
      const na = data.roadNodes.find((node) => node.id === a);
      const nb = data.roadNodes.find((node) => node.id === b);
      if (!na || !nb) return;
      const line = createSvgElement("line");
      line.setAttribute("x1", na.x);
      line.setAttribute("y1", na.y);
      line.setAttribute("x2", nb.x);
      line.setAttribute("y2", nb.y);
      line.classList.add("road-edge");
      roadEditLayer.appendChild(line);
    });
    data.roadNodes.forEach((node) => {
      const c = createSvgElement("circle");
      c.setAttribute("cx", node.x);
      c.setAttribute("cy", node.y);
      c.setAttribute("r", 8);
      c.classList.add("road-node");
      if (roadSelectedNode === node.id) c.classList.add("selected");
      c.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        const p = map.toSvgPoint(e);
        roadPointerDown = { id: node.id, startX: p.x, startY: p.y, moved: false };
      });
      roadEditLayer.appendChild(c);
    });
  }

  function updateRoadOutput() {
    if (!roadSelectedNode) {
      roadOutput.value = "";
      return;
    }
    const node = data.roadNodes.find((item) => item.id === roadSelectedNode);
    roadOutput.value = node ? JSON.stringify(node) : "";
  }

  function handleRoadNodeClick(id) {
    if (roadSelectedNode === null) {
      roadSelectedNode = id;
    } else if (roadSelectedNode === id) {
      roadSelectedNode = null;
    } else {
      const a = roadSelectedNode;
      const b = id;
      const idx = data.roadEdges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (idx >= 0) data.roadEdges.splice(idx, 1);
      else data.roadEdges.push([a, b]);
      roadSelectedNode = id;
    }
    renderRoadGraph();
    updateRoadOutput();
  }

  window.addEventListener("mousemove", (e) => {
    if (!roadEditMode || !roadPointerDown) return;
    const p = map.toSvgPoint(e);
    const dx = p.x - roadPointerDown.startX;
    const dy = p.y - roadPointerDown.startY;
    if (Math.hypot(dx, dy) > ROAD_DRAG_THRESHOLD) {
      roadPointerDown.moved = true;
      const node = data.roadNodes.find((item) => item.id === roadPointerDown.id);
      if (node) {
        node.x = Math.round(p.x);
        node.y = Math.round(p.y);
      }
      renderRoadGraph();
    }
  });
  window.addEventListener("mouseup", () => {
    if (!roadEditMode || !roadPointerDown) return;
    if (!roadPointerDown.moved) handleRoadNodeClick(roadPointerDown.id);
    roadPointerDown = null;
  });

  map.overlay.addEventListener("click", (e) => {
    if (!roadEditMode) return;
    if (e.target.classList && e.target.classList.contains("road-node")) return;
    const p = map.toSvgPoint(e);
    const nextNum = Math.max(0, ...data.roadNodes.map((node) => parseInt(node.id.slice(1), 10) || 0)) + 1;
    const newId = "r" + nextNum;
    data.roadNodes.push({ id: newId, x: Math.round(p.x), y: Math.round(p.y) });
    if (roadSelectedNode) data.roadEdges.push([roadSelectedNode, newId]);
    roadSelectedNode = newId;
    renderRoadGraph();
    updateRoadOutput();
  });

  function openRoadEdit() {
    roadEditMode = true;
    editRoadsBtn.classList.add("active");
    roadPanel.classList.remove("hidden");
    map.overlay.style.pointerEvents = "all";
    map.overlay.classList.add("edit-active");
    map.viewport.style.cursor = "default";
    roadSelectedNode = null;
    renderRoadGraph();
  }

  function closeRoadEdit() {
    if (!roadEditMode) return;
    roadEditMode = false;
    editRoadsBtn.classList.remove("active");
    roadPanel.classList.add("hidden");
    map.overlay.style.pointerEvents = "none";
    map.overlay.classList.remove("edit-active");
    map.viewport.style.cursor = "grab";
    roadSelectedNode = null;
    roadEditLayer.innerHTML = "";
  }

  editRoadsBtn.onclick = () => {
    if (roadEditMode) {
      closeRoadEdit();
      return;
    }
    state.closeEditUI();
    state.closeEntryEdit();
    openRoadEdit();
  };

  $("roadDeleteBtn").onclick = () => {
    if (!roadSelectedNode) return;
    const id = roadSelectedNode;
    const idx = data.roadNodes.findIndex((node) => node.id === id);
    if (idx >= 0) data.roadNodes.splice(idx, 1);
    for (let i = data.roadEdges.length - 1; i >= 0; i--) {
      if (data.roadEdges[i][0] === id || data.roadEdges[i][1] === id) data.roadEdges.splice(i, 1);
    }
    roadSelectedNode = null;
    renderRoadGraph();
    updateRoadOutput();
  };

  $("roadExportBtn").onclick = () => {
    const json = JSON.stringify({ nodes: data.roadNodes, edges: data.roadEdges }, null, 2);
    roadOutput.value = json;
    copyText(json);
    roadOutput.select();
  };

  return { closeRoadEdit };
}

function initEntryEditor({ data, map, state, navDestinations, routeAnchor }) {
  let entryEditMode = false;
  let entrySelectedId = null;
  let entryDragging = false;
  const entryPointsBtn = $("entryPointsBtn");
  const entryPanel = $("entryPanel");
  const entryLocationSelect = $("entryLocationSelect");
  const entryOutput = $("entryOutput");
  const entryEditLayer = createSvgElement("g");
  entryEditLayer.id = "entryEditLayer";
  map.overlay.appendChild(entryEditLayer);

  entryLocationSelect.innerHTML = navDestinations
    .map((loc) => `<option value="${loc.id}">${loc.icon || ""} ${loc.name}</option>`)
    .join("");

  function setEntryPoint(id, pt) {
    const loc = data.locations.find((item) => item.id === id);
    if (!loc) return;
    loc.entryPoint = pt;
    renderEntryEditor();
  }

  function renderEntryEditor() {
    entryEditLayer.innerHTML = "";
    if (!entrySelectedId) return;

    data.roadNodes.forEach((node) => {
      const c = createSvgElement("circle");
      c.setAttribute("cx", node.x);
      c.setAttribute("cy", node.y);
      c.setAttribute("r", 5);
      c.classList.add("road-node-ghost");
      c.addEventListener("click", (e) => {
        e.stopPropagation();
        setEntryPoint(entrySelectedId, [node.x, node.y]);
      });
      entryEditLayer.appendChild(c);
    });

    const loc = data.locations.find((item) => item.id === entrySelectedId);
    const pt = routeAnchor(loc);
    const marker = createSvgElement("circle");
    marker.setAttribute("cx", pt[0]);
    marker.setAttribute("cy", pt[1]);
    marker.setAttribute("r", 9);
    marker.classList.add("entry-marker");
    marker.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      entryDragging = true;
    });
    entryEditLayer.appendChild(marker);
    entryOutput.value = loc.entryPoint ? JSON.stringify(loc.entryPoint) : "(using auto center \u2014 click the map to set one)";
  }

  entryLocationSelect.addEventListener("change", () => {
    entrySelectedId = entryLocationSelect.value;
    renderEntryEditor();
  });

  window.addEventListener("mousemove", (e) => {
    if (!entryEditMode || !entryDragging || !entrySelectedId) return;
    const p = map.toSvgPoint(e);
    setEntryPoint(entrySelectedId, [Math.round(p.x), Math.round(p.y)]);
  });
  window.addEventListener("mouseup", () => { entryDragging = false; });

  map.overlay.addEventListener("click", (e) => {
    if (!entryEditMode || !entrySelectedId) return;
    if (e.target.classList && (e.target.classList.contains("road-node-ghost") || e.target.classList.contains("entry-marker"))) return;
    const p = map.toSvgPoint(e);
    setEntryPoint(entrySelectedId, [Math.round(p.x), Math.round(p.y)]);
  });

  $("entryResetBtn").onclick = () => {
    if (!entrySelectedId) return;
    const loc = data.locations.find((item) => item.id === entrySelectedId);
    loc.entryPoint = null;
    renderEntryEditor();
  };

  $("entryExportBtn").onclick = () => {
    const all = {};
    navDestinations.forEach((item) => {
      const loc = data.locations.find((candidate) => candidate.id === item.id);
      if (loc.entryPoint) all[item.id] = loc.entryPoint;
    });
    const json = JSON.stringify(all, null, 2);
    entryOutput.value = json;
    copyText(json);
    entryOutput.select();
  };

  function openEntryEdit() {
    entryEditMode = true;
    entryPointsBtn.classList.add("active");
    entryPanel.classList.remove("hidden");
    map.overlay.style.pointerEvents = "all";
    map.overlay.classList.add("edit-active");
    map.viewport.style.cursor = "default";
    if (!entrySelectedId) entrySelectedId = navDestinations[0]?.id || null;
    entryLocationSelect.value = entrySelectedId;
    renderEntryEditor();
  }

  function closeEntryEdit() {
    if (!entryEditMode) return;
    entryEditMode = false;
    entryPointsBtn.classList.remove("active");
    entryPanel.classList.add("hidden");
    map.overlay.style.pointerEvents = "none";
    map.overlay.classList.remove("edit-active");
    map.viewport.style.cursor = "grab";
    entryEditLayer.innerHTML = "";
  }

  entryPointsBtn.onclick = () => {
    if (entryEditMode) {
      closeEntryEdit();
      return;
    }
    state.closeEditUI();
    state.closeRoadEdit();
    openEntryEdit();
  };

  return { closeEntryEdit };
}
