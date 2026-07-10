import { DirectoryPage } from "./DirectoryPage.js";
import Router from "../../router.js";

let container = null;

function wireEvents() {
  container.querySelector("[data-route]")?.addEventListener("click", (e) => {
    Router.go(e.currentTarget.dataset.route);
  });

  const search = container.querySelector("#directorySearch");
  const list = container.querySelector("#guestList");
  const empty = container.querySelector("#directoryEmpty");

  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    list?.querySelectorAll(".guest-card").forEach(card => {
      const matches = !q
        || card.dataset.name?.includes(q)
        || card.dataset.family?.includes(q)
        || card.dataset.room?.includes(q);
      card.hidden = !matches;
      if (matches) visible++;
    });
    empty?.classList.toggle("hidden", visible > 0);
  });

  container.querySelectorAll("[data-map-room]").forEach(btn => {
    btn.addEventListener("click", () => {
      sessionStorage.setItem("ar_map_highlight", btn.dataset.mapRoom);
      Router.go("map");
    });
  });
}

function render() {
  container.innerHTML = DirectoryPage();
  wireEvents();
}

function mount() {
  container = document.getElementById("screen-directory");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const DirectoryScreen = { mount, show, hide };
