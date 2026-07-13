/**
 * OnboardingPage — the first screen a guest ever sees.
 *
 * Pure render of (state). No TopBar, no BottomNav — this sets the tone
 * for the whole app before any of that chrome exists. OnboardingScreen
 * owns the input value, error state, and submit handling; this file
 * only turns that state into markup.
 */

import { APP_CONFIG } from "../../config.js";

function hero() {
  return `
    <div class="onboarding__hero">
      <div class="onboarding__wordmark">✈</div>
      <p class="onboarding__couple">${APP_CONFIG.coupleNames.display}</p>
      <p class="onboarding__invite">invite you aboard</p>
      <h1 class="onboarding__title">AR Airways</h1>
      <p class="onboarding__subtitle">Your journey begins at ${APP_CONFIG.resortName}<br>22 · 23 · 24 January 2027</p>
    </div>
  `;
}

function passportEntry(state) {
  const disabled = state.passportNumber.trim().length === 0;

  return `
    <div class="onboarding__input-wrap">
      <label class="onboarding__label" for="onboarding-passport">Passport Number</label>
      <input
        id="onboarding-passport"
        class="onboarding__input ${state.error ? "onboarding__input--error" : ""}"
        type="text"
        placeholder="e.g. AR-501-S"
        value="${state.passportNumber}"
        autocomplete="off"
        data-passport-input />
      <p class="onboarding__hint">Your passport number is on your physical boarding pass 🎫</p>
      ${state.error ? `<p class="onboarding__error">${state.error}</p>` : ""}
      <button class="onboarding__cta" ${disabled ? "disabled" : ""} data-board-btn>Board Flight →</button>
    </div>
  `;
}

export function OnboardingPage(state) {
  return `
    <div class="onboarding ${state.success ? "onboarding--success" : ""}">
      ${hero()}
      ${passportEntry(state)}
      <div class="onboarding__later-wrap">
        <button class="onboarding__later" data-route="home">Maybe later</button>
      </div>
    </div>
  `;
}
