/**
 * JourneyScreen — Router adapter for the Journey hub.
 *
 * Matches the mount/show/hide pattern used by EventsScreen and
 * MapScreen. Re-renders on every show() (not just the first mount) so
 * the boarding pass reflects live miles/tier data and the flight
 * schedule preview reflects live event status whenever a guest
 * navigates back here.
 */

import { JourneyPage } from "./JourneyPage.js";
import PassengerService from "../../services/passengerService.js";
import Router from "../../router.js";

let container = null;

async function shareBoarding() {
  const snapshot = PassengerService.getCurrentSnapshot();
  if (!snapshot || snapshot.isViewer) return;

  const name = snapshot.profile?.passengerName || "Guest";
  const room = snapshot.profile?.room || "TBD";
  const passportNumber = snapshot.profile?.passportNumber || "";

  const text = [
    "✈ AR Airways Boarding Pass",
    "",
    `Passenger: ${name}`,
    "Flight: AR-2027",
    `Gate: ${room}`,
    "Date: 22–24 JAN 2027",
    `Passport: ${passportNumber}`,
    "",
    "abhiseriyahamari.in",
  ].join("\n");

  if (navigator.share) {
    try {
      await navigator.share({ title: "AR Airways Boarding Pass", text });
    } catch {
      // User cancelled — ignore
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Boarding pass copied to clipboard ✈");
    } catch {
      showToast("Copy not supported — screenshot your pass instead");
    }
  }
}

function showToast(message) {
  const existing = container.querySelector(".journey-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "journey-toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function bindEvents() {
  container.querySelectorAll("[data-route]").forEach((el) => {
    el.addEventListener("click", () => Router.go(el.dataset.route));
  });

  const shareBtn = container.querySelector("[data-share-btn]");
  if (shareBtn) {
    shareBtn.addEventListener("click", shareBoarding);
  }
}

function render() {
  container.innerHTML = JourneyPage();
  bindEvents();
}

function mount() {
  container = document.getElementById("screen-journey");
  render();
}

function show() {
  render();
  container.hidden = false;
}

function hide() {
  container.hidden = true;
}

export const JourneyScreen = { mount, show, hide };
