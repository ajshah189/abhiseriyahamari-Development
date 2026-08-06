/**
 * CoupleStoryPage — swipeable story cards about Riya & Abhishek.
 *
 * Pure render function. currentIndex is owned by StoryScreen.
 */

import { COUPLE_STORY } from "../../data/coupleStory.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function dots(current) {
  return COUPLE_STORY.map((_, i) => `
    <button class="story-dot ${i === current ? "story-dot--active" : ""}" data-story-go="${i}" aria-label="Card ${i + 1}"></button>
  `).join("");
}

function card(story, isCurrent) {
  return `
    <div class="story-card ${isCurrent ? "story-card--active" : ""}"
         style="--story-color: ${esc(story.color)}">
      <div class="story-card__inner">
        <div class="story-card__emoji">${story.emoji}</div>
        <div class="story-card__year">${esc(story.year)}</div>
        <div class="story-card__location">${esc(story.location)}</div>
        <div class="story-card__title">${esc(story.title)}</div>
        <div class="story-card__text">${esc(story.text)}</div>
      </div>
    </div>
  `;
}

export function CoupleStoryPage(currentIndex = 0) {
  const idx = Math.max(0, Math.min(currentIndex, COUPLE_STORY.length - 1));
  const story = COUPLE_STORY[idx];
  const isFirst = idx === 0;
  const isLast  = idx === COUPLE_STORY.length - 1;

  return `
    <div class="story-screen" style="--story-color: ${esc(story.color)}">

      <button class="story-close" data-route="home" aria-label="Close">✕</button>

      <!-- Cards track -->
      <div class="story-track" id="storyTrack" data-current="${idx}">
        ${COUPLE_STORY.map((s, i) => card(s, i === idx)).join("")}
      </div>

      <!-- Prev / Next arrows -->
      ${!isFirst ? `<button class="story-arrow story-arrow--prev" data-story-prev aria-label="Previous">‹</button>` : ""}
      ${!isLast  ? `<button class="story-arrow story-arrow--next" data-story-next aria-label="Next">›</button>`    : ""}

      <!-- Dots -->
      <div class="story-dots">${dots(idx)}</div>

      <!-- Counter -->
      <div class="story-counter">${idx + 1} / ${COUPLE_STORY.length}</div>

    </div>
  `;
}
