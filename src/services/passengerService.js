import { guests } from "../data/guests.js";
import { rooms } from "../data/rooms.js";
import { families } from "../data/families.js";

class PassengerService {

    getAllPassengers() {
        return guests;
    }

    getPassengerById(id) {
        return guests.find(g => g.id === id);
    }

    getPassengerRoom(id) {

        const guest = this.getPassengerById(id);

        if (!guest) return null;

        return rooms.find(room => room.id === guest.roomId);

    }

    getPassengerFamily(id) {

        const guest = this.getPassengerById(id);

        if (!guest) return null;

        return families.find(f => f.id === guest.familyId);

    }

    getCurrentPassenger() {

        // Temporary
        // Later this comes from Login

        return guests[0];

    }

}

export default new PassengerService();