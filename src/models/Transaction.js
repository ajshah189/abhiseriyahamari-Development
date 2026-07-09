/**
 * Transaction — the atomic unit of the AR Miles ledger.
 *
 * Every balance change in the system creates a Transaction.
 * Balance is NEVER stored; it is always derived by summing
 * the ledger. This mirrors banking/airline-loyalty architecture.
 *
 * Fields:
 *   id        Unique identifier (prefixed string).
 *   guestId   Which passenger owns this transaction.
 *   amount    Positive = earn, negative = spend/redeem.
 *   reason    Human-readable description shown in the activity feed.
 *   kind      Machine-readable category for filtering/analytics.
 *   createdAt Unix timestamp (ms).
 */

let counter = 0;

/**
 * Valid transaction kinds. Extensible — add new kinds here when new
 * earn/spend categories are introduced. No code changes needed elsewhere.
 */
export const TX_KINDS = {
  OPENING_BALANCE: "OPENING_BALANCE",
  CHECK_IN: "CHECK_IN",
  EVENT: "EVENT",
  GAME: "GAME",
  QR_SCAN: "QR_SCAN",
  SOCIAL: "SOCIAL",
  TREASURE: "TREASURE",
  HUNT_DISCOVERY: "HUNT_DISCOVERY",
  COUNTRY_VISIT: "COUNTRY_VISIT",
  ACHIEVEMENT: "ACHIEVEMENT",
  MISSION: "MISSION",
  REDEEM: "REDEEM",
  ADMIN: "ADMIN",
  AWARD_MANUAL: "AWARD_MANUAL",
  BONUS: "BONUS",
  MANUAL: "MANUAL",
};

/**
 * Factory — creates a validated Transaction object.
 * Throws if amount is not a finite number or reason is empty.
 */
export function createTransaction({ guestId, amount, reason, kind, createdAt }) {
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error(`Transaction amount must be a non-zero finite number. Got: ${amount}`);
  }
  if (!reason || typeof reason !== "string") {
    throw new Error("Transaction requires a non-empty reason string.");
  }

  counter += 1;

  return Object.freeze({
    id: `tx_${Date.now()}_${counter}`,
    guestId: guestId || null,
    amount,
    reason: reason.trim(),
    kind: kind && TX_KINDS[kind] ? kind : TX_KINDS.MANUAL,
    createdAt: createdAt || Date.now(),
  });
}
