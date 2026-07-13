/**
 * ChroniclePage — Morning Chronicle card.
 *
 * Pure render function — no state, no subscriptions.
 * Appears on the dashboard when admin has published a chronicle.
 * Chronicle data lives at /chronicles/{day} in Firebase Realtime Database.
 */

export function ChronicleCard(chronicle) {
  if (!chronicle) return '';

  const photosHTML = chronicle.photos && chronicle.photos.length > 0
    ? `<div class="chronicle-photos chronicle-photos--${Math.min(chronicle.photos.length, 4)}">
        ${chronicle.photos.slice(0, 4).map((url, i) => `
          <div class="chronicle-photo-wrap">
            <img src="${url}" alt="${_esc(chronicle.eventName)} photo ${i + 1}" loading="lazy" />
          </div>
        `).join('')}
       </div>`
    : '';

  const highlightsHTML = chronicle.highlights && chronicle.highlights.length > 0
    ? `<div class="chronicle-highlights">
        ${chronicle.highlights.map(h => `
          <div class="chronicle-highlight">
            <span class="chronicle-highlight-icon">✈</span>
            <span>${_esc(h)}</span>
          </div>
        `).join('')}
       </div>`
    : '';

  return `
    <div class="chronicle-card">
      <div class="chronicle-header">
        <div class="chronicle-label">MORNING CHRONICLE</div>
        <div class="chronicle-title">${_esc(chronicle.title || chronicle.eventName)}</div>
        ${chronicle.subtitle ? `<div class="chronicle-subtitle">${_esc(chronicle.subtitle)}</div>` : ''}
        ${chronicle.date ? `<div class="chronicle-date">${_esc(chronicle.date)}</div>` : ''}
      </div>

      ${photosHTML}

      ${highlightsHTML}

      ${chronicle.closingLine
        ? `<div class="chronicle-closing">${_esc(chronicle.closingLine)}</div>`
        : ''}

      <div class="chronicle-actions">
        <button class="chronicle-share-btn" data-chronicle-share>
          Share on WhatsApp ↗
        </button>
        <span class="chronicle-hashtag">#AbhiSeRiyaHamari</span>
      </div>
    </div>
  `;
}

export function buildShareText(chronicle) {
  let text = `✈ *AR Airways Morning Chronicle*\n`;
  text += `*${chronicle.title || chronicle.eventName}*`;
  if (chronicle.date) text += ` · ${chronicle.date}`;
  text += '\n\n';

  if (chronicle.highlights?.length) {
    text += chronicle.highlights.map(h => `• ${h}`).join('\n');
    text += '\n\n';
  }

  if (chronicle.closingLine) {
    text += `_${chronicle.closingLine}_\n\n`;
  }

  text += `#AbhiSeRiyaHamari 💍\nabhiseriyahamari.in`;
  return text;
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
