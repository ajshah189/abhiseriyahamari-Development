/**
 * AR Airways Passport — Country definitions
 * Stamps are earned by attending events (status: "landed").
 * Countries are ordered by the day/time of their first event appearance.
 */

export const PASSPORT_COUNTRIES = [
  {
    id: "international",
    name: "International",
    subtitle: "Terminal 1 — Arrivals",
    flag: "🌍",
    color: "#4f46e5", // indigo
    eventId: "evt-001",
    stampLabel: "ARRIVED",
    stampSubtext: "Aayush Resort International"
  },
  {
    id: "australia",
    name: "Australia",
    subtitle: "Sydney Outpost",
    flag: "🇦🇺",
    color: "#0369a1", // ocean blue
    eventId: "evt-002",
    stampLabel: "EXPLORED",
    stampSubtext: "Resort Grounds Expedition"
  },
  {
    id: "morocco",
    name: "Morocco",
    subtitle: "Kingdom of Marrakech",
    flag: "🇲🇦",
    color: "#b45309", // warm amber
    eventId: "evt-003",
    stampLabel: "DANCED",
    stampSubtext: "Garba Night — The Palace"
  },
  {
    id: "india-mameru",
    name: "India",
    subtitle: "Sacred Traditions",
    flag: "🇮🇳",
    color: "#15803d", // deep green
    eventId: "evt-004",
    stampLabel: "BLESSED",
    stampSubtext: "Mameru Ceremony"
  },
  {
    id: "brazil",
    name: "Brazil",
    subtitle: "Carnival do Rio",
    flag: "🇧🇷",
    color: "#16a34a", // carnival green
    eventId: "evt-005",
    stampLabel: "CELEBRATED",
    stampSubtext: "Haldi + Carnival — Poolside"
  },
  {
    id: "italy",
    name: "Italy",
    subtitle: "La Serenissima, Venice",
    flag: "🇮🇹",
    color: "#9333ea", // venetian purple
    eventId: "evt-006",
    stampLabel: "ENCHANTED",
    stampSubtext: "Sangeet Night — The Palace"
  },
  {
    id: "india-wedding",
    name: "India",
    subtitle: "Final Destination",
    flag: "🇮🇳",
    color: "#dc2626", // auspicious red
    eventId: "evt-007",
    stampLabel: "UNITED",
    stampSubtext: "Wedding Ceremony — The Mandap"
  }
];

/**
 * Get stamp status for a country based on current event statuses.
 * Returns: "stamped" | "boarding" | "locked"
 */
export function getStampStatus(country, getEventStatusFn, events) {
  const event = events.find(e => e.id === country.eventId);
  if (!event) return "locked";
  const status = getEventStatusFn(event);
  if (status === "landed") return "stamped";
  if (status === "in-flight" || status === "boarding") return "boarding";
  return "locked";
}

/**
 * Count stamped countries.
 */
export function getStampCount(getEventStatusFn, events) {
  return PASSPORT_COUNTRIES.filter(
    c => getStampStatus(c, getEventStatusFn, events) === "stamped"
  ).length;
}
