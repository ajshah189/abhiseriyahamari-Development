/**
 * AdminPinGate — full-screen PIN entry overlay for Ground Crew access.
 *
 * Organiser convenience, not a security product — see APP_CONFIG.admin.
 * Owns its own digit-entry state and re-render loop (unlike the rest of
 * the app's pure "Page" functions, this needs local mutable state
 * between keystrokes). Calls onSuccess() when the PIN matches; the
 * caller (AdminScreen) is responsible for persisting the sessionStorage
 * auth flag and swapping to AdminPage.
 */

import { APP_CONFIG } from "../../config.js";

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];

export function renderAdminPinGate(container, onSuccess) {
  const { pin, pinLength } = APP_CONFIG.admin;
  let entered = "";

  function render() {
    container.innerHTML = `
      <div class="pin-gate">
        <div class="pin-gate__header">
          <div class="pin-gate__eyebrow">Staff Access</div>
          <h1 class="pin-gate__title">AR Airways Ground Crew</h1>
        </div>

        <div class="pin-dots" id="pin-dots">
          ${Array.from({ length: pinLength }).map((_, i) => `
            <div class="pin-dot ${i < entered.length ? "pin-dot--filled" : ""}"></div>
          `).join("")}
        </div>

        <div class="pin-numpad">
          ${NUMPAD_KEYS.map(key => `
            <button class="pin-numpad__key" data-key="${key}">
              ${key === "clear" ? "Clear" : key === "enter" ? "Enter" : key}
            </button>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => handleKey(btn.dataset.key));
    });
  }

  function handleKey(key) {
    if (key === "clear") {
      entered = "";
      render();
      return;
    }

    if (key === "enter") {
      submit();
      return;
    }

    if (entered.length >= pinLength) return;

    entered += key;
    render();

    if (entered.length === pinLength) {
      submit();
    }
  }

  function submit() {
    if (entered === pin) {
      onSuccess();
      return;
    }
    shake();
  }

  function shake() {
    const dots = container.querySelector("#pin-dots");
    dots?.classList.add("pin-dots--shake");

    setTimeout(() => {
      entered = "";
      render();
    }, 1000);
  }

  render();
}
