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

import { db, ref, push, set, get, onValue, remove } from '../config/firebase.js';

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

  // ─── FCM TOKENS ─────────────────────────────────────────────────────────────

  async saveFCMToken(guestId, token) {
    try {
      await set(ref(db, `fcm_tokens/${guestId}`), {
        token,
        updatedAt: Date.now(),
      });
      return true;
    } catch (e) {
      console.warn('Failed to save FCM token:', e.message);
      return false;
    }
  }

  async getAllFCMTokens() {
    try {
      const snapshot = await get(ref(db, 'fcm_tokens'));
      if (!snapshot.exists()) return [];
      return Object.values(snapshot.val()).map(t => t.token);
    } catch (e) {
      return [];
    }
  }

  // ─── CHRONICLES ─────────────────────────────────────────────────────────────

  async publishChronicle(day, data) {
    try {
      await set(ref(db, `chronicles/day${day}`), {
        ...data,
        publishedAt: Date.now(),
        publishedBy: 'Ground Crew',
      });
      return true;
    } catch (e) {
      console.warn('Firebase publishChronicle failed:', e.message);
      return false;
    }
  }

  async deleteChronicle(day) {
    try {
      await remove(ref(db, `chronicles/day${day}`));
      return true;
    } catch (e) {
      console.warn('Firebase deleteChronicle failed:', e.message);
      return false;
    }
  }

  async uploadChroniclePhoto(day, photoIndex, file) {
    try {
      const { storage, storageRef, uploadBytes, getDownloadURL } =
        await import('../config/firebase.js');
      const photoRef = storageRef(storage, `chronicles/day${day}/photo${photoIndex}`);
      const snapshot = await uploadBytes(photoRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (e) {
      console.warn('Firebase uploadChroniclePhoto failed:', e.message);
      return null;
    }
  }

  subscribeToLatestChronicle(callback) {
    const chroniclesRef = ref(db, 'chronicles');
    return onValue(chroniclesRef, (snapshot) => {
      if (!snapshot.exists()) { callback(null); return; }
      const data = snapshot.val();
      const latest = Object.values(data)
        .filter(c => c.publishedAt)
        .sort((a, b) => b.publishedAt - a.publishedAt)[0] || null;
      callback(latest);
    });
  }

  subscribeToAllChronicles(callback) {
    const chroniclesRef = ref(db, 'chronicles');
    return onValue(chroniclesRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const data = snapshot.val();
      const chronicles = Object.entries(data)
        .map(([key, val]) => ({ ...val, _day: key.replace('day', '') }))
        .filter(c => c.publishedAt)
        .sort((a, b) => b.publishedAt - a.publishedAt);
      callback(chronicles);
    });
  }

  // ─── SOCIAL CONNECTIONS ──────────────────────────────────────────────────────

  async getConnection(connectionKey) {
    try {
      const snap = await get(ref(db, `connections/${connectionKey}`));
      return snap.exists() ? snap.val() : null;
    } catch (e) { return null; }
  }

  async saveConnection(connectionKey, data) {
    try {
      await set(ref(db, `connections/${connectionKey}`), data);
      return true;
    } catch (e) { return false; }
  }

  async postNotification(guestId, notification) {
    try {
      await push(ref(db, `notifications/${guestId}`), notification);
      return true;
    } catch (e) { return false; }
  }

  subscribeToNotifications(guestId, callback) {
    const notifRef = ref(db, `notifications/${guestId}`);
    return onValue(notifRef, (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const notifs = Object.entries(snap.val())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(notifs);
    });
  }

  // ─── EVENT ATTENDANCE ────────────────────────────────────────────────────────

  async markEventAttendance(guestId, eventId, data) {
    try {
      await set(ref(db, `attendance/${guestId}/${eventId}`), data);
      return true;
    } catch (e) { return false; }
  }

  subscribeToAllAttendance(callback) {
    return onValue(ref(db, 'attendance'), (snap) => {
      callback(snap.exists() ? snap.val() : {});
    });
  }

  // ─── DAILY CHALLENGES ────────────────────────────────────────────────────────

  async launchChallenge(data) {
    try {
      await push(ref(db, 'challenges'), { ...data, active: true, launchedAt: Date.now() });
      return true;
    } catch (e) { return false; }
  }

  async completeChallenge(challengeId, guestId, completionData) {
    try {
      await push(ref(db, `challenges/${challengeId}/completions`), {
        guestId,
        ...completionData,
        completedAt: Date.now(),
      });
      return true;
    } catch (e) { return false; }
  }

  subscribeToActiveChallenges(callback) {
    return onValue(ref(db, 'challenges'), (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const active = Object.entries(snap.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(c => c.active);
      callback(active);
    });
  }

  async endChallenge(challengeId) {
    try {
      await set(ref(db, `challenges/${challengeId}/active`), false);
      return true;
    } catch (e) { return false; }
  }

  async getChallengeCompletions(challengeId) {
    try {
      const snap = await get(ref(db, `challenges/${challengeId}/completions`));
      if (!snap.exists()) return [];
      return Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }));
    } catch (e) { return []; }
  }

  // ─── FCM TOKENS (continued) ──────────────────────────────────────────────────

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
