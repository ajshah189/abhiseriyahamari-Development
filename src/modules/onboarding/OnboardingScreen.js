/**
 * OnboardingScreen — Router adapter for the first-visit passport gate.
 *
 * Owns the input value, error state, and the brief success fade before
 * handing off to Router.go("home"). Re-renders on every show() (state
 * reset each time) so revisiting onboarding after Sign Out starts
 * clean rather than showing a stale error from a previous attempt.
 */

import { OnboardingPage } from "./OnboardingPage.js";
import AuthService from "../../services/authService.js";
import Router from "../../router.js";

const SUCCESS_FADE_MS = 450;

let container = null;
let state = createState();

function createState() {
  return { passportNumber: "", error: null, success: false };
}

function render(focus) {
  container.innerHTML = OnboardingPage(state);
  bindEvents();

  const input = container.querySelector("[data-passport-input]");
  if (input && !state.success) {
    input.focus();
    const pos = focus?.cursor ?? input.value.length;
    input.setSelectionRange?.(pos, pos);
  }
}

function bindEvents() {
  const input = container.querySelector("[data-passport-input]");

  input?.addEventListener("input", (e) => {
    const upper = e.target.value.toUpperCase();
    e.target.value = upper;
    state.passportNumber = upper;
    state.error = null;
    render({ cursor: e.target.selectionStart });
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  container.querySelector("[data-board-btn]")?.addEventListener("click", submit);
  container.querySelector("[data-viewer-btn]")?.addEventListener("click", continueAsViewer);
}

function submit() {
  if (!state.passportNumber.trim()) return;

  const result = AuthService.login(state.passportNumber);

  if (!result.success) {
    state.error = result.error;
    render();
    return;
  }

  state.success = true;
  render();

  setTimeout(() => Router.go("home"), SUCCESS_FADE_MS);
}

function continueAsViewer() {
  AuthService.loginAsViewer();
  Router.go("home");
}

function mount() {
  container = document.getElementById("screen-onboarding");
  render();
}

function show() {
  state = createState();
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const OnboardingScreen = { mount, show, hide };
