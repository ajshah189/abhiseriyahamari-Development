/**
 * LeaderboardService — ranking computations from the ledger.
 *
 * V1 limitation: only guests present in data/guests.js are ranked.
 * When a backend exists, this reads from a server-aggregated view.
 * The interface stays identical.
 */

import MilesService from "./milesService.js";
import GuestDatabaseService from "./guestDatabaseService.js";
import FirebaseService from "./firebaseService.js";

class LeaderboardService {

  /**
   * Overall leaderboard — all guests ranked by balance descending.
   * Returns [{ guestId, name, balance, tier, rank, isSelf }].
   */
  getOverall(currentGuestId) {
    const balances = MilesService.getAllBalances();
    const entries = GuestDatabaseService.getAll().map(g => ({
      guestId: g.id,
      name: g.displayName || `${g.firstName} ${g.lastName}`,
      balance: balances[g.id] || 0,
      tier: MilesService.getTier(g.id).current.name,
      isSelf: g.id === currentGuestId,
    }));

    entries.sort((a, b) => b.balance - a.balance);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries;
  }

  /**
   * Family leaderboard — families ranked by combined member balance.
   * Returns [{ familyId, name, color, totalBalance, memberCount, rank }].
   */
  getByFamily() {
    const balances = MilesService.getAllBalances();
    const familyTotals = {};
    const familyMemberCounts = {};

    for (const guest of GuestDatabaseService.getAll()) {
      if (!guest.familyId) continue;
      if (!familyTotals[guest.familyId]) familyTotals[guest.familyId] = 0;
      familyTotals[guest.familyId] += balances[guest.id] || 0;
      familyMemberCounts[guest.familyId] = (familyMemberCounts[guest.familyId] || 0) + 1;
    }

    const entries = GuestDatabaseService.getFamilies().map(f => ({
      familyId: f.id,
      name: f.name,
      color: f.color,
      totalBalance: familyTotals[f.id] || 0,
      memberCount: familyMemberCounts[f.id] || 0,
    }));

    entries.sort((a, b) => b.totalBalance - a.totalBalance);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries;
  }

  /**
   * Today's top earners — ranked by miles earned today.
   */
  getTodayLeaders(currentGuestId) {
    const entries = GuestDatabaseService.getAll().map(g => ({
      guestId: g.id,
      name: g.displayName || `${g.firstName} ${g.lastName}`,
      todayMiles: MilesService.getTodayMiles(g.id),
      isSelf: g.id === currentGuestId,
    }));

    entries.sort((a, b) => b.todayMiles - a.todayMiles);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries.filter(e => e.todayMiles > 0);
  }

  _getLocalBalance(guestId) {
    return MilesService.getBalance(guestId);
  }

  /**
   * Live family leaderboard from Firebase.
   * Groups guest balances by familyId, falls back to localStorage for
   * guests not yet synced to Firebase. Returns an unsubscribe function.
   */
  subscribeToLiveFamilyLeaderboard(callback) {
    return FirebaseService.subscribeToLeaderboard((fbData) => {
      const guests = GuestDatabaseService.getAll();
      const families = GuestDatabaseService.getFamilies();

      const familyTotals = {};

      fbData.forEach(({ guestId, balance }) => {
        const guest = guests.find(g => g.id === guestId);
        if (!guest || !guest.familyId) return;

        if (!familyTotals[guest.familyId]) {
          const fam = families.find(f => f.id === guest.familyId) || {};
          familyTotals[guest.familyId] = {
            name: fam.name || guest.familyId,
            color: fam.color,
            totalBalance: 0,
            memberCount: 0,
          };
        }
        familyTotals[guest.familyId].totalBalance += balance;
        familyTotals[guest.familyId].memberCount++;
      });

      // Fill in guests not yet in Firebase from localStorage
      guests.forEach(guest => {
        if (!guest.familyId) return;
        const inFirebase = fbData.find(f => f.guestId === guest.id);
        if (!inFirebase) {
          const localBalance = this._getLocalBalance(guest.id);
          if (localBalance > 0) {
            if (!familyTotals[guest.familyId]) {
              const fam = families.find(f => f.id === guest.familyId) || {};
              familyTotals[guest.familyId] = {
                name: fam.name || guest.familyId,
                color: fam.color,
                totalBalance: 0,
                memberCount: 0,
              };
            }
            familyTotals[guest.familyId].totalBalance += localBalance;
            familyTotals[guest.familyId].memberCount++;
          }
        }
      });

      const sorted = Object.values(familyTotals)
        .sort((a, b) => b.totalBalance - a.totalBalance);

      sorted.forEach((e, i) => { e.rank = i + 1; });

      callback(sorted);
    });
  }

  /**
   * Live leaderboard from Firebase, enriched with guest metadata.
   * Guests not yet in Firebase fall back to localStorage balance.
   * Returns an unsubscribe function.
   */
  subscribeToLiveLeaderboard(callback) {
    return FirebaseService.subscribeToLeaderboard((fbData) => {
      const guests = GuestDatabaseService.getAll();

      const leaderboard = fbData.map(({ guestId, balance }) => {
        const guest = guests.find(g => g.id === guestId);
        if (!guest) return null;
        return {
          guestId,
          name: guest.displayName || `${guest.firstName} ${guest.lastName}`,
          balance,
          tier: MilesService.getTier(guestId).current.name,
          isSelf: false,
        };
      }).filter(Boolean);

      // Include guests not yet in Firebase using localStorage balance
      guests.forEach(g => {
        if (!leaderboard.find(l => l.guestId === g.id)) {
          const bal = MilesService.getBalance(g.id);
          if (bal > 0) {
            leaderboard.push({
              guestId: g.id,
              name: g.displayName || `${g.firstName} ${g.lastName}`,
              balance: bal,
              tier: MilesService.getTier(g.id).current.name,
              isSelf: false,
            });
          }
        }
      });

      leaderboard.sort((a, b) => b.balance - a.balance);
      leaderboard.forEach((e, i) => { e.rank = i + 1; });
      callback(leaderboard);
    });
  }
}

export default new LeaderboardService();
