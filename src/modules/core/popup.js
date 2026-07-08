import { $ } from "../../utils/dom.js";

export function initPopup({ state, hotspotEls }) {
  const tooltip = $("tooltip");
  const popupOverlay = $("popupOverlay");

  function showTooltip(loc) {
    if (state.editMode) return;
    tooltip.innerHTML = `
      <div class="tt-name">${loc.icon || ""} ${loc.name}</div>
      ${loc.subtitle ? `<div class="tt-sub">${loc.subtitle}${loc.date ? " \u00b7 " + loc.date : ""}</div>` : ""}
    `;
    tooltip.classList.remove("hidden");
    hotspotEls[loc.id].classList.add("hovered");
  }

  function positionTooltip(e) {
    tooltip.style.left = e.clientX + "px";
    tooltip.style.top = e.clientY + "px";
  }

  function hideTooltip() {
    tooltip.classList.add("hidden");
    Object.values(hotspotEls).forEach((el) => el.classList.remove("hovered"));
  }

  function openPopup(loc) {
    $("popupIcon").textContent = loc.icon || "";
    $("popupName").textContent = loc.name;
    $("popupSubtitle").textContent = [loc.subtitle, loc.date, loc.time].filter(Boolean).join(" \u00b7 ");

    const metaBits = [];
    if (loc.capacity) metaBits.push(`<span>Capacity <b>${loc.capacity}</b></span>`);
    if (loc.dressCode) metaBits.push(`<span>Dress code <b>${loc.dressCode}</b></span>`);
    if (loc.food) metaBits.push(`<span>Food <b>${loc.food}</b></span>`);
    if (loc.music) metaBits.push(`<span>Music <b>${loc.music}</b></span>`);
    if (loc.roomRange) metaBits.push(`<span>Rooms <b>${loc.roomRange}</b></span>`);
    if (loc.roomCount) metaBits.push(`<span>Rooms <b>${loc.roomCount}</b></span>`);
    $("popupMeta").innerHTML = metaBits.length ? metaBits.join("") : "";
    $("popupMeta").style.display = metaBits.length ? "flex" : "none";

    $("popupDescription").textContent = loc.description || "";

    const extra = $("popupExtra");
    if (loc.category === "rooms") {
      const cityLine = loc.destinationCity
        ? `Destination name: ${loc.destinationCity}`
        : "Destination-city name not yet assigned.";
      const continentLine = loc.continent ? ` \u00b7 ${loc.continent} zone` : "";
      extra.textContent = cityLine + continentLine;
    } else {
      extra.textContent = "";
    }

    popupOverlay.classList.remove("hidden");
  }

  $("popupClose").onclick = () => popupOverlay.classList.add("hidden");
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) popupOverlay.classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popupOverlay.classList.contains("hidden")) {
      popupOverlay.classList.add("hidden");
    }
  });

  return { showTooltip, positionTooltip, hideTooltip, openPopup };
}
