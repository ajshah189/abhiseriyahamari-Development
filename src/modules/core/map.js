import { APP_CONFIG } from "../../config.js";
import { createSvgElement, $ } from "../../utils/dom.js";
import { pointsToAttr, polygonCentroid } from "../../utils/geometry.js";

export function initMap({ data, state, popup }) {
  const viewport = $("viewport");
  const mapWrap = $("mapWrap");
  const mapImage = $("mapImage");
  const overlay = $("overlay");

  const { width: mapWidth, height: mapHeight } = data.mapSize;
  const view = { x: 0, y: 0, scale: 1, minScale: 0.2, maxScale: 4 };
  let dragging = false;
  let dragStart = null;
  let touchState = null;
  let camAnim = null;

  function applyTransform() {
    mapWrap.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }

  function animateTo(target, duration) {
    if (camAnim) cancelAnimationFrame(camAnim);
    const from = { x: view.x, y: view.y, scale: view.scale };
    const dur = duration || APP_CONFIG.animationDurations.cameraMs;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const k = ease(t);
      view.x = from.x + (target.x - from.x) * k;
      view.y = from.y + (target.y - from.y) * k;
      view.scale = from.scale + (target.scale - from.scale) * k;
      applyTransform();
      if (t < 1) camAnim = requestAnimationFrame(step);
      else camAnim = null;
    }

    camAnim = requestAnimationFrame(step);
  }

  function stopCamAnim() {
    if (camAnim) {
      cancelAnimationFrame(camAnim);
      camAnim = null;
    }
  }

  function fitToScreen() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scale = Math.min(vw / mapWidth, vh / mapHeight) * APP_CONFIG.defaultZoom.baseScaleMultiplier;
    view.scale = scale;
    view.minScale = scale * APP_CONFIG.defaultZoom.minScaleMultiplier;
    view.maxScale = scale * APP_CONFIG.defaultZoom.maxScaleMultiplier;
    view.x = (vw - mapWidth * scale) / 2;
    view.y = (vh - mapHeight * scale) / 2;
    applyTransform();
  }

  function clampScale(scale) {
    return Math.min(view.maxScale, Math.max(view.minScale, scale));
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewport.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const newScale = clampScale(view.scale * factor);
    const ratio = newScale / view.scale;
    view.x = mx - (mx - view.x) * ratio;
    view.y = my - (my - view.y) * ratio;
    view.scale = newScale;
    applyTransform();
  }

  function flyTo(cx, cy, targetScale) {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scale = clampScale(targetScale || Math.max(view.scale, view.maxScale * 0.55));
    animateTo({ x: vw / 2 - cx * scale, y: vh / 2 - cy * scale, scale });
  }

  function fitBounds(points) {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const pad = 140;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const scale = clampScale(Math.min(vw / (maxX - minX), vh / (maxY - minY)));
    animateTo({
      x: vw / 2 - ((minX + maxX) / 2) * scale,
      y: vh / 2 - ((minY + maxY) / 2) * scale,
      scale,
    }, APP_CONFIG.animationDurations.routeFitMs);
  }

  function toSvgPoint(e) {
    const pt = overlay.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(overlay.getScreenCTM().inverse());
  }

  viewport.addEventListener("mousedown", (e) => {
    if (state.editMode) return;
    stopCamAnim();
    dragging = true;
    dragStart = { x: e.clientX - view.x, y: e.clientY - view.y };
    viewport.classList.add("grabbing");
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    view.x = e.clientX - dragStart.x;
    view.y = e.clientY - dragStart.y;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    viewport.classList.remove("grabbing");
  });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    stopCamAnim();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  viewport.addEventListener("dblclick", (e) => {
    if (state.editMode) return;
    stopCamAnim();
    zoomAt(e.clientX, e.clientY, 1.6);
  });

  viewport.addEventListener("touchstart", (e) => {
    stopCamAnim();
    if (e.touches.length === 1) {
      touchState = { mode: "pan", startX: e.touches[0].clientX - view.x, startY: e.touches[0].clientY - view.y };
    } else if (e.touches.length === 2) {
      const [a, b] = e.touches;
      touchState = {
        mode: "pinch",
        startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startScale: view.scale,
        midX: (a.clientX + b.clientX) / 2,
        midY: (a.clientY + b.clientY) / 2,
      };
    }
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (!touchState) return;
    if (touchState.mode === "pan" && e.touches.length === 1) {
      view.x = e.touches[0].clientX - touchState.startX;
      view.y = e.touches[0].clientY - touchState.startY;
      applyTransform();
    } else if (touchState.mode === "pinch" && e.touches.length === 2) {
      const [a, b] = e.touches;
      const factor = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / touchState.startDist;
      const rect = viewport.getBoundingClientRect();
      const mx = touchState.midX - rect.left;
      const my = touchState.midY - rect.top;
      const newScale = clampScale(touchState.startScale * factor);
      const ratio = newScale / view.scale;
      view.x = mx - (mx - view.x) * ratio;
      view.y = my - (my - view.y) * ratio;
      view.scale = newScale;
      applyTransform();
    }
  }, { passive: true });
  viewport.addEventListener("touchend", () => { touchState = null; });

  function zoomButtonStep(factor) {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const mx = vw / 2;
    const my = vh / 2;
    const newScale = clampScale(view.scale * factor);
    const ratio = newScale / view.scale;
    animateTo({
      x: mx - (mx - view.x) * ratio,
      y: my - (my - view.y) * ratio,
      scale: newScale,
    }, APP_CONFIG.animationDurations.zoomButtonMs);
  }

  $("zoomIn").onclick = () => zoomButtonStep(1.4);
  $("zoomOut").onclick = () => zoomButtonStep(1 / 1.4);
  $("zoomReset").onclick = () => {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scale = Math.min(vw / mapWidth, vh / mapHeight) * APP_CONFIG.defaultZoom.baseScaleMultiplier;
    animateTo({ x: (vw - mapWidth * scale) / 2, y: (vh - mapHeight * scale) / 2, scale });
  };
  window.addEventListener("resize", fitToScreen);

  overlay.setAttribute("viewBox", `0 0 ${mapWidth} ${mapHeight}`);
  overlay.setAttribute("width", mapWidth);
  overlay.setAttribute("height", mapHeight);

  const zoneLayer = createSvgElement("g");
  zoneLayer.id = "zoneLayer";
  overlay.appendChild(zoneLayer);

  const hotspotEls = {};
  data.locations.forEach((loc) => {
    const poly = createSvgElement("polygon");
    poly.setAttribute("points", pointsToAttr(loc.polygon));
    poly.classList.add("hotspot");
    poly.dataset.id = loc.id;
    poly.dataset.category = loc.category;
    poly.addEventListener("mouseenter", () => popup.showTooltip(loc));
    poly.addEventListener("mousemove", (e) => popup.positionTooltip(e));
    poly.addEventListener("mouseleave", popup.hideTooltip);
    poly.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.openPopup(loc);
    });
    overlay.appendChild(poly);
    hotspotEls[loc.id] = poly;
  });

  const routeLayer = createSvgElement("g");
  routeLayer.id = "routeLayer";
  overlay.appendChild(routeLayer);

  mapImage.addEventListener("load", fitToScreen);
  if (mapImage.complete) fitToScreen();

  return {
    viewport,
    mapImage,
    overlay,
    zoneLayer,
    routeLayer,
    hotspotEls,
    flyTo,
    fitBounds,
    clampScale,
    toSvgPoint,
    centroid: polygonCentroid,
  };
}
