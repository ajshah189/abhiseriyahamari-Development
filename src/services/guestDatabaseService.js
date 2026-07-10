/**
 * GuestDatabaseService — single source of truth for guest records.
 *
 * Priority: localStorage (ar_guest_db) › guests.js static fallback.
 * Import replaces the entire live dataset; clearing reverts to mock data.
 * Every other service (Auth, Passenger, Leaderboard) must call getAll()
 * at method-call time — never cache the result module-level.
 */

import { guests as rawGuests } from "../data/guests.js";
import { families } from "../data/families.js";
import { rooms } from "../data/rooms.js";
import { normalizeGuest } from "../models/Guest.js";
import { parseCSV } from "../utils/csvParser.js";

const GUEST_DB_KEY = "ar_guest_db";
const GUEST_DB_META_KEY = "ar_guest_db_meta";

function generatePassportNumber(roomName, familyName, existingSet, pendingSet) {
  const initial = (familyName.trim()[0] || "X").toUpperCase();
  const base = `AR-${roomName}-${initial}`;
  const up = base.toUpperCase();
  if (!existingSet.has(up) && !pendingSet.has(up)) return base;
  let i = 2;
  while (existingSet.has(`${up}${i}`) || pendingSet.has(`${up}${i}`)) i++;
  return `${base}${i}`;
}

class GuestDatabaseService {

  /** Returns all guests: localStorage if present, else guests.js fallback. */
  getAll() {
    try {
      const raw = localStorage.getItem(GUEST_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return rawGuests.map(normalizeGuest);
  }

  getById(id) {
    return this.getAll().find(g => g.id === id) || null;
  }

  getByPassport(passportNumber) {
    if (!passportNumber) return null;
    const q = passportNumber.toUpperCase();
    return this.getAll().find(g => g.passportNumber?.toUpperCase() === q) || null;
  }

  getFamilies() { return families; }
  getRooms()    { return rooms; }

  hasImportedData() {
    try {
      const raw = localStorage.getItem(GUEST_DB_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }

  getImportMeta() {
    try {
      return JSON.parse(localStorage.getItem(GUEST_DB_META_KEY)) || null;
    } catch {
      return null;
    }
  }

  /**
   * Parse and validate a CSV string into guest records.
   * Does NOT write to localStorage — call commitImport() after preview.
   *
   * Expected headers: name, family, room, zone, phone, diet, passportNumber
   * Returns { guests, previewRows, imported, skipped, errors }.
   */
  parseCSVToGuests(csvString) {
    const { rows } = parseCSV(csvString);

    if (rows.length === 0) {
      return { guests: [], previewRows: [], imported: 0, skipped: 0, errors: ["CSV has no data rows"] };
    }

    const existing = this.getAll();

    // Highest existing numeric ID → new IDs continue from there
    let baseId = 0;
    for (const g of existing) {
      const m = g.id?.match(/^G(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > baseId) baseId = n;
      }
    }

    const existingPassports = new Set(
      existing.map(g => g.passportNumber).filter(Boolean).map(p => p.toUpperCase())
    );
    const pendingPassports = new Set();

    const guests = [];
    const previewRows = [];
    const errors = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name       = (row.name       || "").trim();
      const familyName = (row.family     || "").trim();
      const roomName   = (row.room       || "").trim();
      const zone       = (row.zone       || "").trim();

      if (!name && !familyName && !roomName) { skipped++; continue; }

      if (!name)       { errors.push(`Row ${rowNum}: missing name`);                      skipped++; continue; }
      if (!familyName) { errors.push(`Row ${rowNum}: missing family for "${name}"`);      skipped++; continue; }
      if (!roomName)   { errors.push(`Row ${rowNum}: missing room for "${name}"`);        skipped++; continue; }
      if (!zone)       { errors.push(`Row ${rowNum}: missing zone for "${name}"`);        skipped++; continue; }

      const family = families.find(f => f.name.toLowerCase() === familyName.toLowerCase());
      if (!family) {
        errors.push(`Row ${rowNum}: family "${familyName}" not found — check spelling`);
        skipped++;
        continue;
      }

      const room = rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
      if (!room) {
        errors.push(`Row ${rowNum}: room "${roomName}" not found — check spelling`);
        skipped++;
        continue;
      }

      let passportNumber = (row.passportNumber || "").trim();
      if (!passportNumber) {
        passportNumber = generatePassportNumber(room.name, familyName, existingPassports, pendingPassports);
      }
      pendingPassports.add(passportNumber.toUpperCase());

      const id = `G${String(baseId + guests.length + 1).padStart(3, "0")}`;
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName  = parts.slice(1).join(" ") || "";
      const diet      = (row.diet || "").trim() || "Jain Vegetarian";
      const phone     = (row.phone || "").trim() || null;

      const raw = {
        id,
        firstName,
        lastName,
        displayName: name,
        familyId: family.id,
        roomId: room.id,
        passportId: null,
        boardingPassId: null,
        passportNumber,
        profilePhoto: null,
        checkedIn: false,
        dietPreference: diet,
        emergencyContact: phone,
        role: "GUEST",
        arMiles: 0,
        status: "Explorer",
      };

      guests.push(normalizeGuest(raw));
      if (previewRows.length < 5) {
        previewRows.push({ displayName: name, familyName: family.name, roomName: room.name, diet, passportNumber });
      }
    }

    return { guests, previewRows, imported: guests.length, skipped, errors };
  }

  /** Persist a previously-parsed guest list to localStorage. */
  commitImport(guests) {
    localStorage.setItem(GUEST_DB_KEY, JSON.stringify(guests));
    localStorage.setItem(GUEST_DB_META_KEY, JSON.stringify({
      importedAt: new Date().toISOString(),
      count: guests.length,
    }));
  }

  /** Remove imported data — getAll() will fall back to guests.js. */
  clearImported() {
    localStorage.removeItem(GUEST_DB_KEY);
    localStorage.removeItem(GUEST_DB_META_KEY);
  }
}

export default new GuestDatabaseService();
