/**
 * FirebaseService — single gateway to Firebase Realtime Database.
 *
 * All reads/writes go through here.
 * Falls back gracefully if Firebase is unavailable (offline).
 *
 * Firebase data structure:
 * /miles/{guestId}/transactions/{txId}
 * /checkins/{guestId}
 * /announcements/{id}
 * /requests/{id}
 */

import { db, ref, push, set, get, onValue } from '../config/firebase.js';

class FirebaseService {

  // ─── CONNECTION STATE ───────────────────────────────────────────────────────

  isOnline() {
    return navigator.onLine;
  }

  // ─── MILES LEDGER ───────────────────────────────────────────────────────────

  async addTransaction(guestId, transaction) {
    try {
      const txRef = ref(db, `miles/${guestId}/transactions`);
      await push(txRef, {
        ...transaction,
        syncedAt: Date.now(),
      });
      return true;
    } catch (e) {
      console.warn('Firebase addTransaction failed:', e.message);
      return false;
    }
  }

  async getTransactions(guestId) {
    try {
      const txRef = ref(db, `miles/${guestId}/transactions`);
      const snapshot = await get(txRef);
      if (!snapshot.exists()) return [];
      return Object.values(snapshot.val());
    } catch (e) {
      console.warn('Firebase getTransactions failed:', e.message);
      return null;
    }
  }

  subscribeToTransactions(guestId, callback) {
    const txRef = ref(db, `miles/${guestId}/transactions`);
    return onValue(txRef, (snapshot) => {
      const transactions = snapshot.exists() ? Object.values(snapshot.val()) : [];
      callback(transactions);
    }, (error) => {
      console.warn('Firebase subscription error:', error.message);
    });
  }

  // ─── LEADERBOARD ────────────────────────────────────────────────────────────

  subscribeToLeaderboard(callback) {
    const milesRef = ref(db, 'miles');
    return onValue(milesRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }

      const data = snapshot.val();
      const leaderboard = Object.entries(data).map(([guestId, guestData]) => {
        const transactions = guestData.transactions
          ? Object.values(guestData.transactions)
          : [];
        const balance = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        return { guestId, balance, transactions };
      });

      leaderboard.sort((a, b) => b.balance - a.balance);
      callback(leaderboard);
    }, (error) => {
      console.warn('Firebase leaderboard error:', error.message);
      callback([]);
    });
  }

  // ─── CHECK-INS ──────────────────────────────────────────────────────────────

  async checkIn(guestId, checkedInBy = 'Ground Crew') {
    try {
      const checkinRef = ref(db, `checkins/${guestId}`);
      const existing = await get(checkinRef);

      if (existing.exists() && existing.val().checkedIn) {
        return { success: false, alreadyCheckedIn: true, data: existing.val() };
      }

      await set(checkinRef, {
        checkedIn: true,
        timestamp: Date.now(),
        checkedInBy,
        date: new Date().toISOString(),
      });
      return { success: true };
    } catch (e) {
      console.warn('Firebase checkIn failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  subscribeToCheckins(callback) {
    const checkinsRef = ref(db, 'checkins');
    return onValue(checkinsRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
  }

  // ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────

  async postAnnouncement(message, priority = 'normal', sentBy = 'Ground Crew') {
    try {
      const announcementsRef = ref(db, 'announcements');
      await push(announcementsRef, {
        message,
        priority,
        sentBy,
        timestamp: Date.now(),
      });
      return true;
    } catch (e) {
      console.warn('Firebase announcement failed:', e.message);
      return false;
    }
  }

  subscribeToAnnouncements(callback) {
    const announcementsRef = ref(db, 'announcements');
    return onValue(announcementsRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const data = Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }));
      callback(data.sort((a, b) => b.timestamp - a.timestamp));
    });
  }

  // ─── GUEST REQUESTS / CONCIERGE ─────────────────────────────────────────────

  async postRequest(request) {
    try {
      const requestsRef = ref(db, 'requests');
      const result = await push(requestsRef, {
        ...request,
        timestamp: Date.now(),
        status: 'pending',
      });
      return { success: true, id: result.key };
    } catch (e) {
      console.warn('Firebase postRequest failed:', e.message);
      return { success: false };
    }
  }

  async updateRequestStatus(requestId, status) {
    try {
      await set(ref(db, `requests/${requestId}/status`), status);
      if (status === 'done') {
        await set(ref(db, `requests/${requestId}/completedAt`), Date.now());
      }
      return true;
    } catch (e) {
      console.warn('Firebase updateRequestStatus failed:', e.message);
      return false;
    }
  }

  subscribeToRequests(callback) {
    const requestsRef = ref(db, 'requests');
    return onValue(requestsRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const requests = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(requests);
    });
  }

  subscribeToGuestRequests(guestId, callback) {
    const requestsRef = ref(db, 'requests');
    return onValue(requestsRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const requests = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(r => r.guestId === guestId)
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(requests);
    });
  }
}

export default new FirebaseService();
