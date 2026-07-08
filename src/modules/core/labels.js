import { APP_CONFIG } from "../../config.js";
import { $ } from "../../utils/dom.js";

export function initLabels({ mapImage }) {
  let labeled = false;

  $("labelToggleBtn").onclick = (e) => {
    labeled = !labeled;
    mapImage.src = labeled ? APP_CONFIG.mapImages.labeled : APP_CONFIG.mapImages.blank;
    e.target.classList.toggle("active", labeled);
  };
}
