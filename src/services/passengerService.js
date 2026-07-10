/**
 * PassengerService — guest data access.
 *
 * Reads static guest records from data/guests.js.
 * For live miles/tier data, delegates to MilesService —
 * never reads the legacy arMiles field.
 *
 * getCurrentPassenger() reflects real login state via AuthService —
 * returns null in viewer mode. getCurrentSnapshot() falls back to
 * getViewerSnapshot() in that case, shaped identically to a real
 * snapshot (still nested under `profile`) so every existing consumer's
 * `snapshot?.profile?.x` optional-chaining stays crash-safe without
 * needing to touch every call site; `isViewer` is there for screens
 * that need to render something deliberately different, not just a
 * null-safe fallback.
 */

import { rooms } from "../data/rooms.js";
import { families } from "../data/families.js";
import MilesService from "./milesService.js";
import AuthService from "./authService.js";
import GuestDatabaseService from "./guestDatabaseService.js";

class PassengerService {

  getAllPassengers() {
    return GuestDatabaseService.getAll();
  }

  getPassengerById(id) {
    return GuestDatabaseService.getAll().find(g => g.id === id) || null;
  }

  getPassengerRoom(id) {
    const guest = this.getPassengerById(id);
    if (!guest) return null;
    return rooms.find(room => room.id === guest.roomId) || null;
  }

  getPassengerFamily(id) {
    const guest = this.getPassengerById(id);
    if (!guest) return null;
    return families.find(f => f.id === guest.familyId) || null;
  }

  /**
   * The logged-in guest, or null in viewer mode / before login.
   */
  getCurrentPassenger() {
    return AuthService.getCurrentGuest();
  }

  /**
   * Full profile snapshot for the current passenger, combining static
   * guest data with live miles/tier data from the ledger.
   * This is what the Dashboard and PassengerCard should consume.
   */
  getCurrentSnapshot() {
    const passenger = this.getCurrentPassenger();
    if (!passenger) return this.getViewerSnapshot();

    const room = this.getPassengerRoom(passenger.id);
    const family = this.getPassengerFamily(passenger.id);
    const miles = MilesService.getSnapshot(passenger.id);

    return {
      isViewer: false,
      profile: {
        id: passenger.id,
        passengerName: passenger.displayName,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        passportNumber: passenger.passportNumber,
        room: room ? room.name : passenger.roomId,
        roomCottage: room ? room.cottage : null,
        roomZone: room ? room.zone : null,
        family: family ? family.name : null,
        familyColor: family ? family.color : null,
        photo: passenger.profilePhoto,
        checkedIn: passenger.checkedIn,
        dietPreference: passenger.dietPreference,
        emergencyContact: passenger.emergencyContact,
        role: passenger.role,
        passportId: passenger.passportId,
        boardingPassId: passenger.boardingPassId,
      },
      ...miles,
    };
  }

  /**
   * Snapshot shape for viewer mode / not-logged-in — no identity, no
   * miles, no ledger access. Same top-level shape as a real snapshot
   * (profile + balance/tier/etc keys) so nothing downstream needs a
   * separate code path just to avoid crashing.
   */
  getViewerSnapshot() {
    return {
      isViewer: true,
      profile: {
        id: null,
        passengerName: null,
        firstName: null,
        lastName: null,
        passportNumber: null,
        room: null,
        roomCottage: null,
        roomZone: null,
        family: "—",
        familyColor: null,
        photo: null,
        checkedIn: false,
        dietPreference: null,
        emergencyContact: null,
        role: null,
        passportId: null,
        boardingPassId: null,
      },
      balance: null,
      lifetime: null,
      todayMiles: null,
      tier: null,
      recentActivity: [],
    };
  }
}

export default new PassengerService();
