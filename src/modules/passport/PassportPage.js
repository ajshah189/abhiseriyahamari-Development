/**
 * PassportPage — the full passport: dark cover, cream/ink stamp pages.
 *
 * Stamp status is never stored — every render recomputes it from
 * getEventStatus() against the shared wedding schedule, via
 * getStampStatus()/getStampCount() in data/passport.js. Every guest
 * sees the same stamps, because "landed" is a property of the event,
 * not of the guest (there's no per-guest attendance tracking here).
 */

import PassengerService from "../../services/passengerService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { EVENTS, getEventStatus } from "../../data/events.js";
import { PASSPORT_COUNTRIES, getStampStatus, getStampCount } from "../../data/passport.js";

function stampCard(country) {
  const status = getStampStatus(country, getEventStatus, EVENTS);
  const event = EVENTS.find(e => e.id === country.eventId);

  if (status === "locked") {
    return `
      <div class="stamp-card stamp-card--locked" style="--stamp-color:${country.color}">
        <div class="stamp-card__flag">${country.flag}</div>
        <h4 class="stamp-card__name">${country.name}</h4>
        <p class="stamp-card__subtitle">${country.subtitle}</p>
        <div class="stamp-placeholder"></div>
        <p class="stamp-card__hint">Attend the event to earn this stamp</p>
      </div>
    `;
  }

  const boarding = status === "boarding";
  const label = boarding ? "BOARDING" : country.stampLabel;

  return `
    <div class="stamp-card ${boarding ? "stamp-card--boarding" : "stamp-card--stamped"}" style="--stamp-color:${country.color}">
      <div class="stamp-card__flag">${country.flag}</div>
      <h4 class="stamp-card__name">${country.name}</h4>
      <p class="stamp-card__subtitle">${country.subtitle}</p>
      <span class="stamp-ink">${label}</span>
      <p class="stamp-card__event">${event ? event.name : ""} — ${country.stampSubtext}</p>
    </div>
  `;
}

export function PassportPage() {
  const snapshot = PassengerService.getCurrentSnapshot();
  const stamped = getStampCount(getEventStatus, EVENTS);
  const total = PASSPORT_COUNTRIES.length;
  const percent = Math.round((stamped / total) * 100);

  return `
    ${TopBar()}
    <main class="passport-page">
      <section class="passport-header">
        <div class="passport-crest">✈</div>
        <div class="passport-eyebrow">AR AIRWAYS</div>
        <h1 class="passport-title">Passport</h1>
        <p class="passport-guest-name">${snapshot?.profile?.passengerName || "Guest"}</p>
        <p class="passport-progress-text">${stamped} of ${total} countries visited</p>
      </section>

      <div class="stamp-grid">
        ${PASSPORT_COUNTRIES.map(stampCard).join("")}
      </div>

      <section class="journey-progress">
        <p class="journey-progress-label">Your Journey: ${stamped} / ${total} countries</p>
        <div class="journey-progress-bar">
          <div class="journey-progress-fill" style="width:${percent}%"></div>
        </div>
        <p class="journey-progress-caption">Complete your passport to earn the Grand Explorer badge</p>
      </section>
    </main>
    ${BottomNav("passport")}
  `;
}
