/**
 * LeaderboardService — ranking computations from the ledger.
 *
 * V1 limitation: only guests present in data/guests.js are ranked.
 * When a backend exists, this reads from a server-aggregated view.
 * The interface stays identical.
 */

import MilesService from "./milesService.js";
import GuestDatabaseService from "./guestDatabaseService.js";

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
}

export default new LeaderboardService();
