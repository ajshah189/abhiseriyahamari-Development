import PassengerService from "../../services/passengerService.js";
import AuthService from "../../services/authService.js";
import { families } from "../../data/families.js";
import { rooms } from "../../data/rooms.js";
import { initials, colorFromName } from "../leaderboard/LeaderboardCard.js";
import { BottomNav } from "../../components/layout/BottomNav.js";

function guestCard(guest, isViewer) {
  const family = families.find(f => f.id === guest.familyId);
  const familyName = family ? family.name : "—";
  const room = guest.roomId ? rooms.find(r => r.id === guest.roomId) : null;
  const avatarColor = colorFromName(guest.displayName);
  const avatarLetter = initials(guest.displayName);

  const roomDisplay = (!isViewer && room)
    ? `<div class="guest-card__room">
         <span class="guest-card__room-name">${room.name}</span>
         <span class="guest-card__zone">${room.zone}</span>
       </div>`
    : `<div class="guest-card__room guest-card__room--hidden"><span class="guest-card__room-name">—</span></div>`;

  const mapBtn = (!isViewer && room)
    ? `<button class="guest-card__map-btn" data-map-room="${room.name}" aria-label="Find ${guest.displayName} on map">🗺 Map</button>`
    : "";

  return `
    <div class="guest-card"
         data-name="${guest.displayName.toLowerCase()}"
         data-family="${familyName.toLowerCase()}"
         data-room="${!isViewer && room ? room.name.toLowerCase() : ""}">
      <div class="guest-card__avatar" style="background:${avatarColor}">${avatarLetter}</div>
      <div class="guest-card__body">
        <div class="guest-card__name">${guest.displayName}</div>
        <div class="guest-card__meta">${familyName}</div>
        ${roomDisplay}
      </div>
      ${mapBtn}
    </div>
  `;
}

export function DirectoryPage() {
  const isViewer = !AuthService.isLoggedIn();
  const guests = PassengerService.getAllPassengers()
    .slice()
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return `
    <header class="directory-topbar">
      <button class="directory-topbar__back" data-route="profile" aria-label="Back to Profile">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="directory-topbar__title">Guest Directory</h1>
      <div class="directory-topbar__spacer"></div>
    </header>

    <div class="directory-search-wrap">
      <input class="directory-search" id="directorySearch" type="text"
             placeholder="Search name, family, or room…" autocomplete="off" />
    </div>

    <main class="directory-main">
      <div class="guest-list" id="guestList">
        ${guests.map(g => guestCard(g, isViewer)).join("")}
      </div>
      <p class="directory-empty hidden" id="directoryEmpty">No guests found.</p>
    </main>

    ${BottomNav("profile")}
  `;
}
