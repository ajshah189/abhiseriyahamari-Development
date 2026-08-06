/**
 * AR Airways — Wedding Event Schedule
 * Aayush Resort, 22–24 January 2027
 *
 * Each event is a "flight" in the AR Airways journey.
 * Status is derived at runtime, never hardcoded.
 */

export const EVENTS = [
  // ─── DAY 1: 22 January 2027 ───
  {
    id: "evt-001",
    flightCode: "AR-101",
    name: "Check-in",
    tagline: "Welcome aboard, passengers",
    country: "International",
    countryFlag: "🌍",
    date: "2027-01-22",
    startTime: "10:00",
    endTime: "13:00",
    venue: "Main Gate",
    venueLabel: "Terminal 1 — Main Gate",
    venueId: "reception",
    dresscode: "Travel comfortable",
    dresscodeEmoji: "👕",
    theme: "Arrivals",
    themeColors: ["#4f46e5", "#818cf8"],
    description: "Collect your passport, boarding pass, luggage tags and room keys. Your AR Airways journey begins here.",
    whatToExpect: ["Boarding pass collection", "Room key handover", "AR Airways welcome kit", "First passport stamp"],
    bestPhotoSpot: "Main Gate arch with the AR Airways welcome banner",
    photoSpotRating: 3,
    milesReward: 100,
    day: 1,
    icon: "🛬"
  },
  {
    id: "evt-002",
    flightCode: "AR-102",
    name: "Games & Treasure Hunt",
    tagline: "Explore uncharted territory",
    country: "Australia",
    countryFlag: "🇦🇺",
    date: "2027-01-22",
    startTime: "15:00",
    endTime: "18:00",
    venue: "Resort Grounds",
    venueLabel: "Across the resort",
    venueId: null,
    dresscode: "Casual — wear comfortable shoes",
    dresscodeEmoji: "👟",
    theme: "The Great Outback",
    themeColors: ["#b45309", "#f59e0b"],
    description: "Team challenges, QR treasure hunts, and resort-wide missions. Earn bonus AR Miles at every stop.",
    whatToExpect: ["15 hidden QR codes across the resort", "Team challenges", "AR Miles for every discovery", "Prize for top explorer"],
    bestPhotoSpot: "The Treetop Cottages viewpoint — best view of the whole resort",
    photoSpotRating: 5,
    milesReward: 300,
    day: 1,
    icon: "🗺️"
  },
  {
    id: "evt-003",
    flightCode: "AR-103",
    name: "Garba Night",
    tagline: "Touchdown in Marrakech",
    country: "Morocco",
    countryFlag: "🇲🇦",
    date: "2027-01-22",
    startTime: "20:00",
    endTime: "23:59",
    venue: "Palace",
    venueLabel: "The Palace",
    venueId: "palace-de-shaan",
    dresscode: "Traditional Chaniya Choli / Kediyu",
    dresscodeEmoji: "💃",
    theme: "Moroccan Nights",
    themeColors: ["#b45309", "#dc2626"],
    themeNote: "Mirror work, royal blue, deep reds",
    description: "A Moroccan-themed Garba night under the stars. Dandiya, music, and the biggest AR Miles night.",
    whatToExpect: ["Live folk music band", "Dandiya sticks provided", "Photo booth with Moroccan props", "Midnight snacks", "AR Miles competition"],
    bestPhotoSpot: "The Palace entrance with lantern decorations — magical after 21:00",
    photoSpotRating: 5,
    milesReward: 500,
    day: 1,
    icon: "💃"
  },

  // ─── DAY 2: 23 January 2027 ───
  {
    id: "evt-004",
    flightCode: "AR-201",
    name: "Mameru",
    tagline: "A sacred Indian tradition",
    country: "India",
    countryFlag: "🇮🇳",
    date: "2027-01-23",
    startTime: "09:00",
    endTime: "11:00",
    venue: "Garden",
    venueLabel: "The Garden",
    venueId: "palace-lawns",
    dresscode: "Traditional Indian",
    dresscodeEmoji: "🌺",
    theme: "Sacred India",
    themeColors: ["#15803d", "#f59e0b"],
    description: "The maternal uncle's ceremony. A cherished Gujarati tradition honouring family bonds.",
    whatToExpect: ["Intimate family ceremony", "Traditional songs", "Sweet distribution", "Family blessings"],
    bestPhotoSpot: "Garden archway with morning light — golden hour until 10:30",
    photoSpotRating: 4,
    milesReward: 200,
    day: 2,
    icon: "🎁"
  },
  {
    id: "evt-005",
    flightCode: "AR-202",
    name: "Haldi + Carnival",
    tagline: "Carnival in Rio",
    country: "Brazil",
    countryFlag: "🇧🇷",
    date: "2027-01-23",
    startTime: "14:00",
    endTime: "17:00",
    venue: "Swimming Pool Lower",
    venueLabel: "Poolside",
    venueId: "pool-upper",
    dresscode: "White or Yellow — you WILL get messy",
    dresscodeEmoji: "💛",
    theme: "Brazilian Carnival",
    themeColors: ["#16a34a", "#eab308"],
    themeNote: "Wear white or yellow — haldi will stain!",
    description: "Haldi ceremony meets Brazilian carnival. Colour, music, pool, and celebration.",
    whatToExpect: ["Haldi ceremony for bride and groom", "Water games", "DJ music", "Carnival games", "Colour powder"],
    bestPhotoSpot: "Poolside with the yellow and white flower arch — set up from 13:00",
    photoSpotRating: 5,
    milesReward: 400,
    day: 2,
    icon: "🎭"
  },
  {
    id: "evt-006",
    flightCode: "AR-203",
    name: "Sangeet",
    tagline: "An evening in Venice",
    country: "Italy",
    countryFlag: "🇮🇹",
    date: "2027-01-23",
    startTime: "19:30",
    endTime: "23:59",
    venue: "Palace",
    venueLabel: "The Palace",
    venueId: "palace-de-shaan",
    dresscode: "Indo-Western / Cocktail",
    dresscodeEmoji: "✨",
    theme: "Venetian Masquerade",
    themeColors: ["#9333ea", "#d4af6a"],
    themeNote: "Black, gold, deep purple — glamour night",
    description: "A Venetian-themed evening of performances, dance, and celebration.",
    whatToExpect: ["Family dance performances", "Live music", "Couple's surprise performance", "Photo booth with Venetian props", "Gala dinner"],
    bestPhotoSpot: "The Palace staircase with purple uplighting — spectacular after 20:00",
    photoSpotRating: 5,
    milesReward: 500,
    day: 2,
    icon: "🎶"
  },

  // ─── DAY 3: 24 January 2027 ───
  {
    id: "evt-007",
    flightCode: "AR-301",
    name: "Wedding Ceremony",
    tagline: "Final destination — Home",
    country: "India",
    countryFlag: "🇮🇳",
    date: "2027-01-24",
    startTime: "07:00",
    endTime: "12:00",
    venue: "Palace",
    venueLabel: "The Palace — Mandap",
    venueId: "palace-de-shaan",
    dresscode: "Traditional Jain wedding attire",
    dresscodeEmoji: "👘",
    theme: "Royal Jain",
    themeColors: ["#dc2626", "#d4af6a"],
    themeNote: "Royal red, antique gold, ivory — the most traditional of all three days",
    description: "The Jain wedding ceremony. Pheras, vows, and the moment two journeys become one.",
    whatToExpect: ["Sacred Jain rituals", "Kanyadaan", "Mangal Pheras", "Saptapadi", "Vidaai — emotional farewell"],
    bestPhotoSpot: "The Mandap during pheras — the sacred fire creates incredible light",
    photoSpotRating: 5,
    milesReward: 1000,
    day: 3,
    icon: "💍"
  }
];

/**
 * Derive the live status of an event based on current time.
 * Returns: "landed" | "in-flight" | "boarding" | "upcoming"
 *
 * boarding = starts within the next 30 minutes
 */
export function getEventStatus(event) {
  const now = new Date();
  const start = new Date(`${event.date}T${event.startTime}:00+05:30`);
  const end = new Date(`${event.date}T${event.endTime}:00+05:30`);
  const boardingWindow = new Date(start.getTime() - 30 * 60 * 1000);

  if (now > end) return "landed";
  if (now >= start) return "in-flight";
  if (now >= boardingWindow) return "boarding";
  return "upcoming";
}

/**
 * Helper: get all events for a given day number (1, 2, or 3).
 */
export function getEventsForDay(dayNumber) {
  return EVENTS.filter(e => e.day === dayNumber);
}

/**
 * Helper: get the current or next upcoming event.
 */
export function getCurrentOrNextEvent() {
  const now = new Date();
  const inFlight = EVENTS.find(e => getEventStatus(e) === "in-flight");
  if (inFlight) return inFlight;

  const boarding = EVENTS.find(e => getEventStatus(e) === "boarding");
  if (boarding) return boarding;

  return EVENTS.find(e => getEventStatus(e) === "upcoming") || EVENTS[EVENTS.length - 1];
}
