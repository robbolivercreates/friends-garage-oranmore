/**
 * Integration tests — boots the real Express server on port 3199 and exercises
 * the public + staff REST API over HTTP.
 *
 * The test DB (data/friendsgarage.db) is shared with the real site, so all
 * test data uses the unique "Gate Test" customer-name prefix on unusual dates
 * (late November 2026) and is deleted again in teardown. data/outbox.json is
 * reset to [] after the run.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 2026-11-24 is a Tuesday, 2026-11-25 a Wednesday — unusual dates far in the
// future so the gate never collides with real workshop bookings.
const BOOKING_DATE = '2026-11-24';
const BOOKING_TIME = '14:30';
const SUNDAY_DATE = '2026-08-16'; // a known Sunday

let server: ChildProcess;
let serverLog = '';
let adminToken = '';
let createdBookingId = '';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer(timeoutMs = 60000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await sleep(500);
  }
  throw new Error(`Server did not start on port ${PORT} within ${timeoutMs}ms.\n--- server output ---\n${serverLog}`);
}

before(async () => {
  server = spawn('npx', ['tsx', 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    detached: true, // own process group so we can kill tsx + its child
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout?.on('data', d => { serverLog += d.toString(); });
  server.stderr?.on('data', d => { serverLog += d.toString(); });
  await waitForServer();
});

after(async () => {
  // Let async outbox writes settle, then stop the server (whole process group).
  await sleep(700);
  if (server?.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  }
  await sleep(300);

  // Remove gate-test rows from the shared DB.
  const db = new Database(path.join(ROOT, 'data', 'friendsgarage.db'));
  db.prepare(`DELETE FROM bookings WHERE json_extract(data,'$.customerName') LIKE 'Gate Test%'`).run();
  db.prepare(`DELETE FROM estimates WHERE json_extract(data,'$.name') LIKE 'Gate Test%'`).run();
  db.close();

  // Reset the mail outbox.
  fs.writeFileSync(path.join(ROOT, 'data', 'outbox.json'), '[]');
});

/* ------------------------------- public GETs -------------------------------- */

test('GET /api/health → 200 ok', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});

test('GET /api/services returns 11 items', async () => {
  const res = await fetch(`${BASE}/api/services`);
  assert.equal(res.status, 200);
  const services = await res.json();
  assert.ok(Array.isArray(services));
  assert.equal(services.length, 11);
});

test('GET /api/settings does not expose geminiApiKey', async () => {
  const res = await fetch(`${BASE}/api/settings`);
  assert.equal(res.status, 200);
  const raw = await res.text();
  assert.ok(!raw.includes('geminiApiKey'), 'public settings must not contain geminiApiKey');
});

test('GET / serves HTML containing "Friends Garage"', async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Friends Garage'));
});

/* --------------------------------- auth ------------------------------------- */

test('GET /api/bookings without token → 401', async () => {
  const res = await fetch(`${BASE}/api/bookings`);
  assert.equal(res.status, 401);
});

test('POST /api/blocked-dates without token → 401', async () => {
  const res = await fetch(`${BASE}/api/blocked-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: BOOKING_DATE, reason: 'Gate Test block' })
  });
  assert.equal(res.status, 401);
});

test('POST /api/admin/login with passcode friends2026 → token', async () => {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'friends2026' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.token === 'string' && body.token.length > 0);
  adminToken = body.token;
});

test('GET /api/bookings with Bearer token → 200 array', async () => {
  const res = await fetch(`${BASE}/api/bookings`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const bookings = await res.json();
  assert.ok(Array.isArray(bookings));
});

/* -------------------------------- bookings ---------------------------------- */

const bookingPayload = {
  serviceId: 'system-diagnosis',
  serviceName: 'System Diagnosis & Repair',
  customerName: 'Gate Test Booking',
  email: 'gatetest@example.com',
  phone: '+353 85 000 0000',
  preferredContact: 'email',
  vehicleMake: 'Gate',
  vehicleModel: 'Tester',
  vehicleYear: '2024',
  vehicleRegistration: '241-D-12345',
  fuelType: 'diesel',
  transmission: 'manual',
  problemDescription: 'Automated test gate booking — safe to delete.',
  bookingDate: BOOKING_DATE,
  bookingTime: BOOKING_TIME,
  durationMinutes: 60
};

const postBooking = (body: Record<string, unknown>) =>
  fetch(`${BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

test('POST /api/bookings on a Sunday → 409 (garage closed)', async () => {
  const res = await postBooking({ ...bookingPayload, bookingDate: SUNDAY_DATE });
  assert.equal(res.status, 409);
});

test('POST /api/bookings valid weekday → 201 with referenceNumber', async () => {
  const res = await postBooking(bookingPayload);
  assert.equal(res.status, 201);
  const booking = await res.json();
  assert.ok(booking.referenceNumber, 'booking should carry a referenceNumber');
  assert.equal(booking.bookingDate, BOOKING_DATE);
  createdBookingId = booking.id;
});

test('POST /api/bookings same slot again → 409 (slot taken)', async () => {
  const res = await postBooking(bookingPayload);
  assert.equal(res.status, 409);
});

test('PATCH /api/bookings/:id with token, status confirmed → 200', async () => {
  const res = await fetch(`${BASE}/api/bookings/${createdBookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'confirmed' })
  });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.status, 'confirmed');
});

test('GET /api/availability?date shows the test slot as taken', async () => {
  const res = await fetch(`${BASE}/api/availability?date=${BOOKING_DATE}`);
  assert.equal(res.status, 200);
  const availability = await res.json();
  assert.ok(Array.isArray(availability.takenSlots));
  assert.ok(
    availability.takenSlots.includes(BOOKING_TIME),
    `expected ${BOOKING_TIME} in takenSlots, got ${JSON.stringify(availability.takenSlots)}`
  );
});

/* -------------------------------- estimates --------------------------------- */

test('POST /api/estimates missing mandatory fields → 400', async () => {
  const res = await fetch(`${BASE}/api/estimates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Gate Test Estimate' })
  });
  assert.equal(res.status, 400);
});

test('POST /api/estimates valid (no email) → 201', async () => {
  const res = await fetch(`${BASE}/api/estimates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Gate Test Estimate',
      phone: '+353 85 000 0000',
      vehicleRegistration: '132-KE-999',
      problemDescription: 'Automated test gate estimate — safe to delete.'
    })
  });
  assert.equal(res.status, 201);
  const estimate = await res.json();
  assert.ok(estimate.referenceNumber);
});
