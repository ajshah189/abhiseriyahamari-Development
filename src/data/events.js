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
    dresscode: "Travel comfortable",
    description: "Collect your passport, boarding pass, luggage tags and room keys. Your AR Airways journey begins here.",
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
    dresscode: "Casual",
    description: "Team challenges, QR treasure hunts, and resort-wide missions. Earn bonus AR Miles at every stop.",
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
    dresscode: "Traditional Chaniya Choli / Kediyu",
    description: "A Moroccan-themed Garba night under the stars. Dandiya, music, and the first big AR Miles opportunity.",
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
    dresscode: "Traditional Indian",
    description: "The maternal uncle's ceremony. A cherished Gujarati tradition honouring family bonds.",
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
    dresscode: "White / Yellow — you will get messy",
    description: "Haldi ceremony meets Brazilian carnival. Colour, music, pool, and celebration. Wear something you do not mind staining.",
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
    dresscode: "Indo-Western / Cocktail",
    description: "A Venetian-themed evening of performances, dance, and celebration. The biggest AR Miles night of the journey.",
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
    dresscode: "Traditional Jain wedding attire",
    description: "The Jain wedding ceremony. Pheras, vows, and the moment two journeys become one.",
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
