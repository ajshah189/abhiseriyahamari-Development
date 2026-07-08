// Reusable behavioral constants. Business rules belong here, not inside DOM
// modules, so future auth/passport/admin work can reuse them without hunting.
export const SVG_NS = "http://www.w3.org/2000/svg";

export const CATEGORY_ROOMS = "rooms";

export const NAV_EXCLUDED_IDS = [
  "sb1",
  "main-house",
  "fountain-central",
  "fountain-c15",
  "pool-lower",
];

export const DEFAULT_NAV_DESTINATION_ID = "palace-de-shaan";

export const ROUTE_ESTIMATE = {
  pxPerMeter: 6.7,
  walkSpeedMps: 1.2,
};

export const SEARCH_MAX_RESULTS = 8;

export const ROAD_DRAG_THRESHOLD = 4;
