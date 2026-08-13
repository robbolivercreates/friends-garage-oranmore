/**
 * Friends Garage — SQLite data layer.
 *
 * Professional-grade local database (WAL mode, atomic transactions).
 * Zero external services required; the whole site works offline/self-hosted.
 * If a legacy data/db.json exists it is imported automatically on first run.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { INITIAL_SERVICES, INITIAL_TEAM, INITIAL_REVIEWS, INITIAL_SETTINGS } from '../src/data/initialData.js';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'friendsgarage.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS content (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  referenceNumber TEXT UNIQUE,
  data TEXT NOT NULL,
  bookingDate TEXT,
  bookingTime TEXT,
  status TEXT
);
CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  referenceNumber TEXT UNIQUE,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS callbacks (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS roadside (
  id TEXT PRIMARY KEY,
  referenceNumber TEXT UNIQUE,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS blocked_dates (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE,
  reason TEXT
);
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  registration TEXT UNIQUE,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS service_records (
  id TEXT PRIMARY KEY,
  vehicleId TEXT NOT NULL,
  date TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle ON service_records(vehicleId);
`);

/* ---------------------------- seeding / migration ---------------------------- */

function seed() {
  const hasContent = db.prepare(`SELECT COUNT(*) AS c FROM content`).get() as { c: number };
  if (hasContent.c === 0) {
    const insert = db.prepare(`INSERT INTO content (collection, id, data) VALUES (?, ?, ?)`);
    const tx = db.transaction(() => {
      for (const s of INITIAL_SERVICES) insert.run('services', s.id, JSON.stringify(s));
      for (const t of INITIAL_TEAM) insert.run('team', t.id, JSON.stringify(t));
      for (const r of INITIAL_REVIEWS) insert.run('reviews', r.id, JSON.stringify(r));
    });
    tx();
  }
  const hasSettings = db.prepare(`SELECT COUNT(*) AS c FROM settings`).get() as { c: number };
  if (hasSettings.c === 0) {
    db.prepare(`INSERT INTO settings (id, data) VALUES (1, ?)`).run(JSON.stringify(INITIAL_SETTINGS));
  }

  // One-time import of the legacy JSON database, if present
  const legacyFile = path.join(dataDir, 'db.json');
  if (fs.existsSync(legacyFile)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf-8'));
      const tx = db.transaction(() => {
        const insBooking = db.prepare(`INSERT OR IGNORE INTO bookings (id, referenceNumber, data, bookingDate, bookingTime, status) VALUES (?, ?, ?, ?, ?, ?)`);
        for (const b of legacy.bookings || []) insBooking.run(b.id, b.referenceNumber, JSON.stringify(b), b.bookingDate, b.bookingTime, b.status);
        const insEst = db.prepare(`INSERT OR IGNORE INTO estimates (id, referenceNumber, data) VALUES (?, ?, ?)`);
        for (const e of legacy.estimates || []) insEst.run(e.id, e.referenceNumber, JSON.stringify(e));
        const insCb = db.prepare(`INSERT OR IGNORE INTO callbacks (id, data) VALUES (?, ?)`);
        for (const c of legacy.callbacks || []) insCb.run(c.id, JSON.stringify(c));
        const insRs = db.prepare(`INSERT OR IGNORE INTO roadside (id, referenceNumber, data) VALUES (?, ?, ?)`);
        for (const r of legacy.roadside || []) insRs.run(r.id, r.referenceNumber, JSON.stringify(r));
        const insBd = db.prepare(`INSERT OR IGNORE INTO blocked_dates (id, date, reason) VALUES (?, ?, ?)`);
        for (const bd of legacy.blockedDates || []) insBd.run(bd.id, bd.date, bd.reason);
      });
      tx();
      fs.renameSync(legacyFile, legacyFile + '.imported');
      console.log('[db] legacy data/db.json imported into SQLite (renamed to db.json.imported)');
    } catch (err) {
      console.error('[db] legacy import failed', err);
    }
  }
}
seed();

/* ---------------------------- generic helpers ---------------------------- */

function listContent(collection: string): any[] {
  return (db.prepare(`SELECT data FROM content WHERE collection = ?`).all(collection) as any[])
    .map(r => JSON.parse(r.data));
}

function prependContent(collection: string, item: any) {
  db.prepare(`INSERT INTO content (collection, id, data) VALUES (?, ?, ?)`)
    .run(collection, item.id, JSON.stringify(item));
}

/* ---------------------------- public API ---------------------------- */

export const getServices = () => listContent('services');
export const getService = (slugOrId: string) =>
  getServices().find((s: any) => s.slug === slugOrId || s.id === slugOrId) || null;
export const getTeam = () => listContent('team');

export function getReviews() {
  return listContent('reviews');
}
export function addReview(review: any) {
  prependContent('reviews', review);
  return review;
}

export function getSettings() {
  const row = db.prepare(`SELECT data FROM settings WHERE id = 1`).get() as any;
  return JSON.parse(row.data);
}
export function updateSettings(patch: Record<string, any>) {
  const merged = { ...getSettings(), ...patch };
  db.prepare(`UPDATE settings SET data = ? WHERE id = 1`).run(JSON.stringify(merged));
  return merged;
}

/* bookings */
export function getBookings() {
  return (db.prepare(`SELECT data FROM bookings ORDER BY json_extract(data,'$.createdAt') DESC`).all() as any[])
    .map(r => JSON.parse(r.data));
}
export function addBooking(b: any) {
  db.prepare(`INSERT INTO bookings (id, referenceNumber, data, bookingDate, bookingTime, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(b.id, b.referenceNumber, JSON.stringify(b), b.bookingDate, b.bookingTime, b.status);
  return b;
}
export function updateBooking(idOrRef: string, patch: Record<string, any>) {
  const row = db.prepare(`SELECT data FROM bookings WHERE id = ? OR referenceNumber = ?`).get(idOrRef, idOrRef) as any;
  if (!row) return null;
  const merged = { ...JSON.parse(row.data), ...patch };
  db.prepare(`UPDATE bookings SET data = ?, bookingDate = ?, bookingTime = ?, status = ? WHERE id = ? OR referenceNumber = ?`)
    .run(JSON.stringify(merged), merged.bookingDate, merged.bookingTime, merged.status, idOrRef, idOrRef);
  return merged;
}

/* availability */
export function getAvailability(date?: string) {
  const settings = getSettings();
  const blockedDates = (db.prepare(`SELECT date FROM blocked_dates`).all() as any[]).map(r => r.date);
  const dayBookings = date
    ? (db.prepare(`SELECT bookingTime FROM bookings WHERE bookingDate = ? AND status IN ('pending','confirmed','rescheduled')`).all(date) as any[])
    : [];
  return {
    blockedDates,
    takenSlots: dayBookings.map(r => r.bookingTime),
    bookedCount: dayBookings.length,
    maxDailyBookings: settings.maxDailyBookings || 12
  };
}
export function isDateBlocked(date: string): boolean {
  return Boolean(db.prepare(`SELECT 1 FROM blocked_dates WHERE date = ?`).get(date));
}
export function isSlotTaken(date: string, time: string): boolean {
  return Boolean(
    db.prepare(`SELECT 1 FROM bookings WHERE bookingDate = ? AND bookingTime = ? AND status IN ('pending','confirmed','rescheduled')`).get(date, time)
  );
}
export function dayBookingCount(date: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM bookings WHERE bookingDate = ? AND status IN ('pending','confirmed','rescheduled')`).get(date) as any;
  return row.c;
}

/* estimates / callbacks / roadside */
export function getEstimates() {
  return (db.prepare(`SELECT data FROM estimates ORDER BY json_extract(data,'$.createdAt') DESC`).all() as any[]).map(r => JSON.parse(r.data));
}
export function addEstimate(e: any) {
  db.prepare(`INSERT INTO estimates (id, referenceNumber, data) VALUES (?, ?, ?)`).run(e.id, e.referenceNumber, JSON.stringify(e));
  return e;
}
export function getCallbacks() {
  return (db.prepare(`SELECT data FROM callbacks ORDER BY json_extract(data,'$.createdAt') DESC`).all() as any[]).map(r => JSON.parse(r.data));
}
export function addCallback(c: any) {
  db.prepare(`INSERT INTO callbacks (id, data) VALUES (?, ?)`).run(c.id, JSON.stringify(c));
  return c;
}
export function getRoadside() {
  return (db.prepare(`SELECT data FROM roadside ORDER BY json_extract(data,'$.createdAt') DESC`).all() as any[]).map(r => JSON.parse(r.data));
}
export function addRoadside(r: any) {
  db.prepare(`INSERT INTO roadside (id, referenceNumber, data) VALUES (?, ?, ?)`).run(r.id, r.referenceNumber, JSON.stringify(r));
  return r;
}

/* blocked dates */
export function getBlockedDates() {
  return db.prepare(`SELECT id, date, reason FROM blocked_dates ORDER BY date`).all() as any[];
}
export function addBlockedDate(bd: any) {
  db.prepare(`INSERT OR IGNORE INTO blocked_dates (id, date, reason) VALUES (?, ?, ?)`).run(bd.id, bd.date, bd.reason);
  return bd;
}
export function deleteBlockedDate(idOrDate: string) {
  db.prepare(`DELETE FROM blocked_dates WHERE id = ? OR date = ?`).run(idOrDate, idOrDate);
}

/* ------------------------------------------------------------------ */
/*  VEHICLES — self-building database keyed by registration            */
/* ------------------------------------------------------------------ */

export function getVehicles(query?: string) {
  const rows = db.prepare(`SELECT data FROM vehicles ORDER BY json_extract(data,'$.lastSeenAt') DESC`).all() as any[];
  let list = rows.map(r => JSON.parse(r.data));
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((v: any) =>
      [v.registration, v.make, v.model, v.displayPlate, v.customerName]
        .some((f: string) => (f || '').toLowerCase().includes(q)));
  }
  return list;
}

export function getVehicleByReg(registration: string) {
  const norm = registration.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const row = db.prepare(`SELECT data FROM vehicles WHERE registration = ?`).get(norm) as any;
  return row ? JSON.parse(row.data) : null;
}

export function upsertVehicle(vehicle: any) {
  const existing = getVehicleByReg(vehicle.registration);
  const merged = existing
    ? { ...existing, ...vehicle, registration: existing.registration, lastSeenAt: new Date().toISOString() }
    : {
        id: `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        ...vehicle,
        registration: vehicle.registration.toUpperCase().replace(/[^A-Z0-9]/g, '')
      };
  db.prepare(`INSERT INTO vehicles (id, registration, data) VALUES (?, ?, ?)
    ON CONFLICT(registration) DO UPDATE SET data = excluded.data`)
    .run(merged.id, merged.registration, JSON.stringify(merged));
  return merged;
}

export function updateVehicle(registration: string, patch: Record<string, any>) {
  const existing = getVehicleByReg(registration);
  if (!existing) return null;
  const merged = { ...existing, ...patch, registration: existing.registration, lastSeenAt: new Date().toISOString() };
  db.prepare(`UPDATE vehicles SET data = ? WHERE registration = ?`).run(JSON.stringify(merged), existing.registration);
  return merged;
}

/** Auto-register/update a vehicle whenever a booking comes in. */
export function upsertVehicleFromBooking(booking: any, parsed?: any) {
  if (!booking.vehicleRegistration) return;
  return upsertVehicle({
    registration: booking.vehicleRegistration,
    displayPlate: booking.vehicleRegistration,
    make: booking.vehicleMake || undefined,
    model: booking.vehicleModel || undefined,
    year: booking.vehicleYear || parsed?.year || undefined,
    fuelType: booking.fuelType || undefined,
    transmission: booking.transmission || undefined,
    county: parsed?.county,
    plateFormat: parsed?.format,
    customerName: booking.customerName,
    customerPhone: booking.phone,
    customerEmail: booking.email
  });
}

/* service records (history, parts, notes) */
export function getServiceHistory(vehicleId: string) {
  return (db.prepare(`SELECT data FROM service_records WHERE vehicleId = ? ORDER BY date DESC, json_extract(data,'$.createdAt') DESC`).all(vehicleId) as any[])
    .map(r => JSON.parse(r.data));
}

export function addServiceRecord(record: any) {
  const full = {
    id: `sr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    date: record.date || new Date().toISOString().split('T')[0],
    ...record
  };
  db.prepare(`INSERT INTO service_records (id, vehicleId, date, data) VALUES (?, ?, ?, ?)`)
    .run(full.id, full.vehicleId, full.date, JSON.stringify(full));
  return full;
}

export function deleteServiceRecord(id: string) {
  db.prepare(`DELETE FROM service_records WHERE id = ?`).run(id);
}
