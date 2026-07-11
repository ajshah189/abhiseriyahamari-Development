/**
 * Treasure Hunt data — 15 locations hidden around Aayush Resort.
 *
 * QR codes encode the URL /?hunt=HUNT-NNN. Guests scan with their phone
 * camera (no camera API needed — the OS handles QR-to-URL natively) and
 * the app awards miles on the first discovery per guest.
 *
 * Found state is stored in localStorage per guest: ar_hunt_found_{guestId}
 */

export const HUNT_LOCATIONS = [
  // ---------- Day 1 — Arrival (22 Jan) ----------
  {
    id: "HUNT-001",
    name: "Welcome Gate",
    day: 1,
    location: "Main Entrance",
    icon: "🏛️",
    hint: "Your journey starts here — where the adventure of AR Airways begins",
    clueToNext: "Follow the sound of flowing water deeper into the resort",
    milesReward: 100,
  },
  {
    id: "HUNT-002",
    name: "Check-In Desk",
    day: 1,
    location: "Resort Reception",
    icon: "🛂",
    hint: "Every great journey begins with a boarding pass",
    clueToNext: "The pool area calls — find the spot where guests take their first dip",
    milesReward: 100,
  },
  {
    id: "HUNT-003",
    name: "The Main Pool",
    day: 1,
    location: "Central Pool Area",
    icon: "🏊",
    hint: "Where laughter echoes and the water shimmers gold in the afternoon sun",
    clueToNext: "Something sacred awaits — seek the place where flowers are offered",
    milesReward: 150,
  },
  {
    id: "HUNT-004",
    name: "The Temple",
    day: 1,
    location: "Resort Temple",
    icon: "🛕",
    hint: "A place for blessings before the wedding ceremonies begin",
    clueToNext: "Find the zone where Asia blooms — look among the lanterns",
    milesReward: 150,
  },
  {
    id: "HUNT-005",
    name: "Asia Garden",
    day: 1,
    location: "Asia Zone Garden",
    icon: "🌸",
    hint: "Cherry blossoms and lanterns mark this serene corner of the resort",
    clueToNext: "Day 2 begins — rise early and find the grand hall before the ceremonies start",
    milesReward: 200,
  },

  // ---------- Day 2 — Wedding Day (23 Jan) ----------
  {
    id: "HUNT-006",
    name: "Grand Ballroom",
    day: 2,
    location: "Main Banquet Hall",
    icon: "💃",
    hint: "Where the Sangeet fills the air with music and the reception glitters with gold",
    clueToNext: "Seek the stage where henna artists painted hands at dusk yesterday",
    milesReward: 200,
  },
  {
    id: "HUNT-007",
    name: "Mehendi Stage",
    day: 2,
    location: "Garden Stage",
    icon: "🎨",
    hint: "Intricate patterns, the smell of fresh henna, and stories in every swirl",
    clueToNext: "A picture is worth a thousand miles — find the resort's most scenic photo spot",
    milesReward: 150,
  },
  {
    id: "HUNT-008",
    name: "Lakeside Gazebo",
    day: 2,
    location: "Photo Spot — Lakeside",
    icon: "📸",
    hint: "The most photographed corner of Aayush Resort — golden hour magic happens here",
    clueToNext: "All this exploring must have made you hungry — follow your nose to the dining hall",
    milesReward: 200,
  },
  {
    id: "HUNT-009",
    name: "Dining Hall",
    day: 2,
    location: "Main Restaurant",
    icon: "🍽️",
    hint: "Biryani, chaat, and endless mithai — the heart of the resort's hospitality",
    clueToNext: "Go up — the best view of the entire resort is from the very top",
    milesReward: 150,
  },
  {
    id: "HUNT-010",
    name: "Rooftop Terrace",
    day: 2,
    location: "Rooftop Level",
    icon: "🌟",
    hint: "Stars above, the resort below, and a view that takes your breath away",
    clueToNext: "Day 3's final discoveries await — start at the European quarter tomorrow",
    milesReward: 250,
  },

  // ---------- Day 3 — Farewell (24 Jan) ----------
  {
    id: "HUNT-011",
    name: "Europe Fountain",
    day: 3,
    location: "Europe Zone",
    icon: "⛲",
    hint: "A little bit of Rome in the heart of Rajasthan — coins in the fountain bring luck",
    clueToNext: "The sneakiest spot in the resort — where cars rest but treasure doesn't",
    milesReward: 200,
  },
  {
    id: "HUNT-012",
    name: "Secret Garden Path",
    day: 3,
    location: "Garden Walk",
    icon: "🌿",
    hint: "The winding path guests rarely explore — those who wander are rewarded",
    clueToNext: "Cool off one last time — find the pool that seems to touch the sky",
    milesReward: 150,
  },
  {
    id: "HUNT-013",
    name: "Infinity Pool",
    day: 3,
    location: "Upper Pool Deck",
    icon: "♾️",
    hint: "The water meets the horizon — Aayush Resort's crown jewel",
    clueToNext: "Play one last game before the farewell — find the games room",
    milesReward: 250,
  },
  {
    id: "HUNT-014",
    name: "Games Pavilion",
    day: 3,
    location: "Recreation Area",
    icon: "🎯",
    hint: "Cricket, carom, and chaos — where the competitive spirits of both families collide",
    clueToNext: "One last location remains. All journeys must end where they began — the stage",
    milesReward: 200,
  },
  {
    id: "HUNT-015",
    name: "Grand Finale Stage",
    day: 3,
    location: "Main Stage",
    icon: "🏆",
    hint: "The final act of the AR Airways journey — find this and become a Champion Traveller",
    clueToNext: null,
    milesReward: 300,
  },
];

export function getHuntLocation(huntId) {
  return HUNT_LOCATIONS.find(loc => loc.id === huntId) || null;
}

export function getFoundLocations(guestId) {
  if (!guestId) return [];
  try {
    return JSON.parse(localStorage.getItem(`ar_hunt_found_${guestId}`)) || [];
  } catch {
    return [];
  }
}

export function getFoundTimestamps(guestId) {
  if (!guestId) return {};
  try {
    return JSON.parse(localStorage.getItem(`ar_hunt_times_${guestId}`)) || {};
  } catch {
    return {};
  }
}

export function alreadyFound(guestId, huntId) {
  return getFoundLocations(guestId).includes(huntId);
}

export function markLocationFound(guestId, huntId) {
  if (!guestId || !huntId) return;
  const found = getFoundLocations(guestId);
  if (!found.includes(huntId)) {
    found.push(huntId);
    localStorage.setItem(`ar_hunt_found_${guestId}`, JSON.stringify(found));
    const times = getFoundTimestamps(guestId);
    times[huntId] = new Date().toISOString();
    localStorage.setItem(`ar_hunt_times_${guestId}`, JSON.stringify(times));
  }
}
