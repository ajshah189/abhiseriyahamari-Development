/**
 * PassportPage — the full passport: dark cover, cream/ink stamp pages.
 *
 * Stamp status is never stored — every render recomputes it from
 * getEventStatus() against the shared wedding schedule, via
 * getStampStatus()/getStampCount() in data/passport.js. Every guest
 * sees the same stamps, because "landed" is a property of the event,
 * not of the guest (there's no per-guest attendance tracking here).
 *
 * Viewer mode forces every stamp to render locked regardless of real
 * event status — the passport itself is a full-mode feature.
 */

import PassengerService from "../../services/passengerService.js";
import AuthService from "../../services/authService.js";
import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { EVENTS, getEventStatus } from "../../data/events.js";
import { PASSPORT_COUNTRIES, getStampStatus, getStampCount } from "../../data/passport.js";

function stampCard(country, hasAccess) {
  const status = hasAccess ? getStampStatus(country, getEventStatus, EVENTS) : "locked";
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

function accessBanner() {
  return `
    <div class="access-locked">
      <div class="access-locked__icon">🔒</div>
      <p class="access-locked__message">Your passport stamps are waiting. Log in to collect them.</p>
      <button class="access-locked__cta" data-route="onboarding">Enter Passport →</button>
    </div>
  `;
}

export function PassportPage() {
  const snapshot = PassengerService.getCurrentSnapshot();
  const hasAccess = AuthService.hasAccess("passport");
  const stamped = hasAccess ? getStampCount(getEventStatus, EVENTS) : 0;
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

      ${!hasAccess ? accessBanner() : ""}

      <div class="stamp-grid">
        ${PASSPORT_COUNTRIES.map(country => stampCard(country, hasAccess)).join("")}
      </div>

      ${stamped === 0 ? `
        <div class="empty-state" style="margin-top:var(--s-2)">
          <div class="empty-state__icon">✈</div>
          <p class="empty-state__title">Your passport is blank — for now.</p>
          <p class="empty-state__subtitle">Every event earns a new stamp.<br>Start at the Main Gate on 22 Jan.</p>
        </div>
      ` : ""}

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
