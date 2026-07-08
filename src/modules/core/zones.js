import { createSvgElement, $ } from "../../utils/dom.js";
import { attrToPoints, pointsToAttr } from "../../utils/geometry.js";

export function initZones({ data, zoneLayer, state }) {
  let zonesActive = false;
  const worldModeBtn = $("worldModeBtn");
  const zoneEls = {};

  data.roomZones.forEach((zone) => {
    const poly = createSvgElement("polygon");
    poly.setAttribute("points", pointsToAttr(zone.polygon));
    poly.setAttribute("fill", zone.color);
    poly.setAttribute("fill-opacity", "0.32");
    poly.setAttribute("stroke", zone.color);
    poly.setAttribute("stroke-opacity", "0.85");
    poly.setAttribute("stroke-width", "2");
    poly.style.pointerEvents = "none";
    zoneLayer.appendChild(poly);
    zoneEls[zone.id] = { poly, zone };
  });

  data.roomZones.forEach((zone) => {
    const g = createSvgElement("g");
    g.style.pointerEvents = "none";
    g.style.cursor = "grab";

    const rect = createSvgElement("rect");
    rect.setAttribute("rx", 8);
    rect.setAttribute("fill", "rgba(11,14,19,0.75)");
    rect.setAttribute("stroke", zone.color);
    rect.setAttribute("stroke-opacity", "0.8");

    const text = createSvgElement("text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", '"Cormorant Garamond", serif');
    text.setAttribute("font-size", "28");
    text.setAttribute("font-weight", "700");
    text.setAttribute("letter-spacing", "2");
    text.setAttribute("fill", "#f3ecda");
    text.textContent = zone.continent.toUpperCase() + (zone.needsRoomSplit ? " *" : "");

    g.appendChild(rect);
    g.appendChild(text);
    zoneLayer.appendChild(g);

    g.addEventListener("mousedown", (e) => {
      if (state.editTarget !== "zone" || state.editZoneSubMode !== "label" || state.editSelectedId !== zone.id) return;
      e.stopPropagation();
      state.startLabelDrag(e, zone.id);
    });

    Object.assign(zoneEls[zone.id], { g, rect, text });
    positionZoneLabel(zone.id);
  });

  function positionZoneLabel(zoneId) {
    const els = zoneEls[zoneId];
    let cx;
    let cy;
    if (els.zone.labelPos) {
      [cx, cy] = els.zone.labelPos;
    } else {
      const pts = attrToPoints(els.poly.getAttribute("points"));
      cx = pts.reduce((sum, point) => sum + point[0], 0) / pts.length;
      cy = pts.reduce((sum, point) => sum + point[1], 0) / pts.length;
    }
    els.text.setAttribute("x", cx);
    els.text.setAttribute("y", cy);
    const bbox = els.text.getBBox();
    const padX = 14;
    const padY = 8;
    els.rect.setAttribute("x", bbox.x - padX);
    els.rect.setAttribute("y", bbox.y - padY);
    els.rect.setAttribute("width", bbox.width + padX * 2);
    els.rect.setAttribute("height", bbox.height + padY * 2);
  }

  function setZoneLabelDraggable(zoneId, draggable) {
    Object.entries(zoneEls).forEach(([id, els]) => {
      const on = draggable && id === zoneId;
      els.g.style.pointerEvents = on ? "all" : "none";
      els.rect.setAttribute("stroke-width", on ? "2.5" : "1");
    });
  }

  function renderZonesVisibility() {
    zoneLayer.style.display = zonesActive ? "" : "none";
  }

  function setZonesActive(active) {
    zonesActive = active;
    worldModeBtn.classList.toggle("active", zonesActive);
    renderZonesVisibility();
  }

  renderZonesVisibility();
  worldModeBtn.onclick = () => setZonesActive(!zonesActive);

  return {
    zoneEls,
    positionZoneLabel,
    setZoneLabelDraggable,
    setZonesActive,
  };
}
