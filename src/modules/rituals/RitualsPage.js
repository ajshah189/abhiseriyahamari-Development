/**
 * RitualsPage — Wedding rituals guide. Pure render function.
 *
 * Two modes:
 *   list   — shows all three rituals as tappable cards
 *   detail — shows one ritual's full description (ritualId provided)
 *
 * Read-only for guests. No editing.
 */

import { TopBar } from "../../components/layout/TopBar.js";
import { BottomNav } from "../../components/layout/BottomNav.js";
import { RITUALS, getRitualById } from "../../data/rituals.js";

function _esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const DAY_LABELS = { 1: "Day 1 · 22 Jan", 2: "Day 2 · 23 Jan", 3: "Day 3 · 24 Jan" };

function ritualCard(ritual) {
  return `
    <button class="ritual-card" data-ritual-id="${_esc(ritual.id)}">
      <div class="ritual-card__icon">${ritual.icon}</div>
      <div class="ritual-card__body">
        <div class="ritual-card__name">${_esc(ritual.name)}</div>
        <div class="ritual-card__tagline">${_esc(ritual.tagline)}</div>
        <div class="ritual-card__meta">${DAY_LABELS[ritual.day] || ""} · ${_esc(ritual.time)} · ${_esc(ritual.venueLabel)}</div>
      </div>
      <span class="ritual-card__chevron">›</span>
    </button>
  `;
}

function listView() {
  return `
    ${TopBar()}
    <main class="rituals-page">
      <div class="rituals-header">
        <div class="rituals-header__icon">🙏</div>
        <h1 class="rituals-header__title">Wedding Rituals</h1>
        <p class="rituals-header__subtitle">Riya &amp; Abhishek · Aayush Resort · Jan 2027</p>
      </div>
      ${RITUALS.map(ritualCard).join("")}
    </main>
    ${BottomNav()}
  `;
}

function detailView(ritual) {
  return `
    ${TopBar()}
    <main class="rituals-page">
      <div class="ritual-detail">
        <button class="ritual-detail__back" data-rituals-back>← All Rituals</button>

        <div class="ritual-detail__hero">
          <div class="ritual-detail__hero-icon">${ritual.icon}</div>
          <h1 class="ritual-detail__name">${_esc(ritual.name)}</h1>
          <p class="ritual-detail__tagline">${_esc(ritual.tagline)}</p>
          <div class="ritual-detail__meta-row">
            <span class="ritual-detail__meta-item">📅 ${DAY_LABELS[ritual.day] || ""}</span>
            <span class="ritual-detail__meta-item">🕐 ${_esc(ritual.time)}</span>
            <span class="ritual-detail__meta-item">📍 ${_esc(ritual.venueLabel)}</span>
          </div>
        </div>

        <div class="ritual-detail__section">
          <div class="ritual-detail__section-title">About This Ritual</div>
          <p class="ritual-detail__description">${_esc(ritual.description)}</p>
        </div>

        <div class="ritual-detail__section">
          <div class="ritual-detail__section-title">Why It Matters</div>
          <p class="ritual-detail__description">${_esc(ritual.significance)}</p>
        </div>

        <div class="ritual-detail__section">
          <div class="ritual-detail__section-title">What to Expect</div>
          <ul class="ritual-detail__expect-list">
            ${ritual.whatToExpect.map(item => `<li class="ritual-detail__expect-item">${_esc(item)}</li>`).join("")}
          </ul>
        </div>

        <div class="ritual-detail__section">
          <div class="ritual-detail__section-title">Dress Code</div>
          <div class="ritual-detail__dresscode">
            <strong>👗 </strong>${_esc(ritual.dresscode)}
          </div>
        </div>
      </div>
    </main>
    ${BottomNav()}
  `;
}

export function RitualsPage(ritualId) {
  if (ritualId) {
    const ritual = getRitualById(ritualId);
    if (ritual) return detailView(ritual);
  }
  return listView();
}
