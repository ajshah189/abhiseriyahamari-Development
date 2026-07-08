import { events } from "../data/events.js";

class EventService {

    getAllEvents() {
        return events;
    }

    getUpcomingEvents() {
        return events;
    }

}

export default new EventService();