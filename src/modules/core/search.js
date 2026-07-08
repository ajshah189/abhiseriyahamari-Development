import { APP_CONFIG } from "../../config.js";
import { SEARCH_MAX_RESULTS } from "../../constants.js";
import { $, setHidden } from "../../utils/dom.js";
import { polygonCentroid } from "../../utils/geometry.js";

export function initSearch({ data, hotspotEls, flyTo }) {
  const searchInput = $("searchInput");
  const searchResults = $("searchResults");

  function goToLocation(loc) {
    const [cx, cy] = polygonCentroid(loc.polygon);
    flyTo(cx, cy);
    hotspotEls[loc.id].classList.add("search-match");
    setTimeout(
      () => hotspotEls[loc.id].classList.remove("search-match"),
      APP_CONFIG.animationDurations.searchHighlightMs
    );
  }

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    Object.values(hotspotEls).forEach((el) => el.classList.remove("search-match"));
    if (!q) {
      setHidden(searchResults, true);
      return;
    }

    const matches = data.locations.filter((loc) => loc.name.toLowerCase().includes(q)).slice(0, SEARCH_MAX_RESULTS);
    if (!matches.length) {
      searchResults.innerHTML = `<div class="search-result-item">No matches</div>`;
      setHidden(searchResults, false);
      return;
    }

    searchResults.innerHTML = matches.map((loc) => `
      <div class="search-result-item" data-id="${loc.id}">
        <span>${loc.icon || ""} ${loc.name}</span>
        <span class="sr-cat">${loc.category}</span>
      </div>
    `).join("");
    setHidden(searchResults, false);

    searchResults.querySelectorAll(".search-result-item[data-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const loc = data.locations.find((item) => item.id === el.dataset.id);
        goToLocation(loc);
        setHidden(searchResults, true);
        searchInput.value = loc.name;
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) setHidden(searchResults, true);
  });

  searchInput.addEventListener("keydown", (e) => {
    const items = [...searchResults.querySelectorAll(".search-result-item[data-id]")];
    if (searchResults.classList.contains("hidden") || !items.length) return;
    const current = searchResults.querySelector(".active-result");
    let idx = items.indexOf(current);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      idx = (idx + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      idx = (idx - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      (current || items[0]).click();
      return;
    } else if (e.key === "Escape") {
      setHidden(searchResults, true);
      searchInput.blur();
      return;
    } else {
      return;
    }

    items.forEach((el) => el.classList.remove("active-result"));
    items[idx].classList.add("active-result");
    items[idx].scrollIntoView({ block: "nearest" });
  });

  return { goToLocation };
}
