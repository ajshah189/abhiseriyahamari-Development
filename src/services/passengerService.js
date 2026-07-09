/**
 * PassengerService — guest data access.
 *
 * Reads static guest records from data/guests.js.
 * For live miles/tier data, delegates to MilesService —
 * never reads the legacy arMiles field.
 *
 * getCurrentPassenger() is a temporary shortcut until login exists.
 * It returns the first guest in the dataset.
 */

import { guests as rawGuests } from "../data/guests.js";
import { rooms } from "../data/rooms.js";
import { families } from "../data/families.js";
import { normalizeGuest } from "../models/Guest.js";
import MilesService from "./milesService.js";

const normalized = rawGuests.map(normalizeGuest);

class PassengerService {

  getAllPassengers() {
    return normalized;
  }

  getPassengerById(id) {
    return normalized.find(g => g.id === id) || null;
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
   * Temporary — returns the first guest until login is implemented.
   */
  getCurrentPassenger() {
    return normalized[0] || null;
  }

  /**
   * Full profile snapshot for the current passenger, combining static
   * guest data with live miles/tier data from the ledger.
   * This is what the Dashboard and PassengerCard should consume.
   */
  getCurrentSnapshot() {
    const passenger = this.getCurrentPassenger();
    if (!passenger) return null;

    const room = this.getPassengerRoom(passenger.id);
    const family = this.getPassengerFamily(passenger.id);
    const miles = MilesService.getSnapshot(passenger.id);

    return {
      profile: {
        id: passenger.id,
        passengerName: passenger.displayName,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
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
}

export default new PassengerService();
