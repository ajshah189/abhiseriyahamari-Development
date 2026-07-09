/**
 * Guest model — canonical shape for a passenger record.
 *
 * The raw data in data/guests.js may have legacy fields (like arMiles
 * as a number). This normalizer ensures every consumer sees a clean,
 * consistent shape regardless of what the source data looks like.
 *
 * The arMiles field from the source is preserved as `seedMiles` so the
 * migration layer can seed the ledger, but it is never used as a live
 * balance anywhere in the application.
 */

export function normalizeGuest(raw) {
  return {
    id: raw.id,
    firstName: raw.firstName || "",
    lastName: raw.lastName || "",
    displayName: raw.displayName || `${raw.firstName || ""} ${raw.lastName || ""}`.trim(),
    familyId: raw.familyId || null,
    roomId: raw.roomId || null,
    passportId: raw.passportId || null,
    boardingPassId: raw.boardingPassId || null,
    profilePhoto: raw.profilePhoto || null,
    checkedIn: raw.checkedIn === true,
    dietPreference: raw.dietPreference || null,
    emergencyContact: raw.emergencyContact || null,
    role: raw.role || "GUEST",

    // Migration-only. Never read this for live balance —
    // use milesService.getBalance(guestId) instead.
    seedMiles: typeof raw.arMiles === "number" ? raw.arMiles : 0,
  };
}
