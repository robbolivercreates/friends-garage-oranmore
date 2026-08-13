import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import Database from 'better-sqlite3';
import path from 'node:path';

const PORT = 3198;
const BASE = `http://localhost:${PORT}`;
const ROOT = process.cwd();

let server: ChildProcess;
let token = '';

async function waitForServer(retries = 60): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('server did not start');
}

function authed(pathname: string, options: RequestInit = {}) {
  return fetch(`${BASE}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
}

before(async () => {
  server = spawn('npx', ['tsx', 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
    detached: true
  });
  await waitForServer();
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'friends2026' })
  });
  token = (await res.json()).token;
});

after(() => {
  // Clean up every test artifact
  const db = new Database(path.join(ROOT, 'data', 'friendsgarage.db'));
  db.prepare(`DELETE FROM vehicles WHERE registration IN ('GATETEST1','242KE999')`).run();
  db.prepare(`DELETE FROM service_records WHERE json_extract(data,'$.serviceName') LIKE 'GateTest%'`).run();
  db.prepare(`DELETE FROM bookings WHERE json_extract(data,'$.customerName') LIKE 'GateTest%'`).run();
  db.close();
  if (server.pid) process.kill(-server.pid, 'SIGTERM');
});

test('plate parse endpoint: 242-KE-999 → 2024 half 2 Kildare', async () => {
  const res = await authed('/api/plates/parse/242-KE-999');
  assert.equal(res.status, 200);
  const p = await res.json();
  assert.equal(p.year, 2024);
  assert.equal(p.half, 2);
  assert.equal(p.county, 'Kildare');
});

test('vehicle create → upsert → get by reg with history', async () => {
  const create = await authed('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify({
      registration: 'GATETEST1',
      make: 'Toyota',
      model: 'Corolla',
      engine: '1.8 Hybrid',
      customerName: 'GateTest Owner'
    })
  });
  assert.equal(create.status, 201);

  const rec = await authed('/api/vehicles/GATETEST1/records', {
    method: 'POST',
    body: JSON.stringify({ serviceName: 'GateTest Full Service', technician: 'Matej', partsUsed: ['Oil filter'], notes: 'n' })
  });
  assert.equal(rec.status, 201);

  const get = await authed('/api/vehicles/GATETEST1');
  const data = await get.json();
  assert.equal(data.vehicle.make, 'Toyota');
  assert.equal(data.serviceHistory.length, 1);
  assert.deepEqual(data.serviceHistory[0].partsUsed, ['Oil filter']);
});

test('vehicle search finds by make', async () => {
  const res = await authed('/api/vehicles?q=corolla');
  const list = await res.json();
  assert.ok(list.some((v: any) => v.registration === 'GATETEST1'));
});

test('unknown plate returns 404 with parsed autofill info', async () => {
  const res = await authed('/api/vehicles/242KE999');
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.parsed.year, 2024);
  assert.equal(data.parsed.county, 'Kildare');
  assert.equal(data.provider, 'manual'); // NoOp provider chain → manual fallback
});

test('booking auto-registers the vehicle (self-building database)', async () => {
  const res = await fetch(`${BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'GateTest Auto', email: 'gate@test.ie', phone: '087',
      vehicleRegistration: '242-KE-999', bookingDate: '2026-11-26', bookingTime: '16:30'
    })
  });
  assert.equal(res.status, 201);
  const get = await authed('/api/vehicles/242KE999');
  assert.equal(get.status, 200);
  const data = await get.json();
  assert.equal(data.vehicle.county, 'Kildare');
  assert.equal(data.bookings.length, 1);
});

test('workshop kanban endpoint returns cards with workflow status', async () => {
  const res = await authed('/api/workshop');
  assert.equal(res.status, 200);
  const cards = await res.json();
  assert.ok(Array.isArray(cards));
  const gate = cards.find((c: any) => c.vehicleRegistration === '242-KE-999');
  assert.ok(gate);
  assert.equal(gate.workflowStatus, 'booked_in');
});

test('vehicle PATCH updates details', async () => {
  const res = await authed('/api/vehicles/GATETEST1', {
    method: 'PATCH',
    body: JSON.stringify({ colour: 'Blue' })
  });
  assert.equal(res.status, 200);
  const v = await res.json();
  assert.equal(v.colour, 'Blue');
});

test('vehicle endpoints reject unauthenticated calls', async () => {
  for (const p of ['/api/vehicles', '/api/vehicles/GATETEST1', '/api/workshop', '/api/plates/parse/241D1']) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 401, p);
  }
});
