/**
 * Unit tests for the Irish & UK number-plate parser (server/plates.ts).
 * Pure functions — no server or database required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlate, formatPlate, normalizePlate } from '../server/plates.js';

/* ------------------------------ normalizePlate ------------------------------ */

test('normalizePlate uppercases and strips spaces, dashes and punctuation', () => {
  assert.equal(normalizePlate(' 241-d-12345 '), '241D12345');
  assert.equal(normalizePlate('zv 12345'), 'ZV12345');
  assert.equal(normalizePlate('ab51 cde'), 'AB51CDE');
  assert.equal(normalizePlate(''), '');
});

/* ------------------------------- parsePlate --------------------------------- */

test('parsePlate: 241-D-12345 → irish_current, 2024 half 1, Dublin', () => {
  const p = parsePlate('241-D-12345');
  assert.equal(p.format, 'irish_current');
  assert.equal(p.year, 2024);
  assert.equal(p.half, 1);
  assert.equal(p.county, 'Dublin');
  assert.equal(p.countyCode, 'D');
  assert.equal(p.registration, '241D12345');
  assert.equal(p.needsReview, false);
});

test('parsePlate: 132-KE-999 → irish_current, 2013 half 2, Kildare', () => {
  const p = parsePlate('132-KE-999');
  assert.equal(p.format, 'irish_current');
  assert.equal(p.year, 2013);
  assert.equal(p.half, 2);
  assert.equal(p.county, 'Kildare');
  assert.equal(p.countyCode, 'KE');
  assert.equal(p.needsReview, false);
});

test('parsePlate: 08-G-4819 → irish_87_12, 2008, Galway', () => {
  const p = parsePlate('08-G-4819');
  assert.equal(p.format, 'irish_87_12');
  assert.equal(p.year, 2008);
  assert.equal(p.county, 'Galway');
  assert.equal(p.countyCode, 'G');
  assert.equal(p.needsReview, false);
});

test('parsePlate: 99-C-12345 → irish_87_12, 1999, Cork', () => {
  const p = parsePlate('99-C-12345');
  assert.equal(p.format, 'irish_87_12');
  assert.equal(p.year, 1999);
  assert.equal(p.county, 'Cork');
  assert.equal(p.countyCode, 'C');
  assert.equal(p.needsReview, false);
});

test('parsePlate: 99-C-1 (1-digit serial) → irish_87_12, 1999, Cork', () => {
  const p = parsePlate('99-C-1');
  assert.equal(p.format, 'irish_87_12');
  assert.equal(p.year, 1999);
  assert.equal(p.county, 'Cork');
  assert.equal(p.needsReview, false);
});

test('parsePlate: ZV 12345 → irish_pre87, Kerry, needsReview', () => {
  const p = parsePlate('ZV 12345');
  assert.equal(p.format, 'irish_pre87');
  assert.equal(p.county, 'Kerry');
  assert.equal(p.countyCode, 'ZV');
  assert.equal(p.registration, 'ZV12345');
  assert.equal(p.needsReview, true);
});

test('parsePlate: AB51CDE → uk_current, 2001 half 2, needsReview', () => {
  const p = parsePlate('AB51CDE');
  assert.equal(p.format, 'uk_current');
  assert.equal(p.year, 2001);
  assert.equal(p.half, 2);
  assert.equal(p.needsReview, true);
});

test('parsePlate: K123ABC → uk_prefix, 1992', () => {
  const p = parsePlate('K123ABC');
  assert.equal(p.format, 'uk_prefix');
  assert.equal(p.year, 1992);
  assert.equal(p.needsReview, true);
});

test('parsePlate: garbage XYZ!! → unknown, needsReview', () => {
  const p = parsePlate('XYZ!!');
  assert.equal(p.format, 'unknown');
  assert.equal(p.registration, 'XYZ');
  assert.equal(p.needsReview, true);
});

test('parsePlate: empty input → unknown, needsReview', () => {
  const p = parsePlate('');
  assert.equal(p.format, 'unknown');
  assert.equal(p.needsReview, true);
});

/* ------------------------------- formatPlate -------------------------------- */

test('formatPlate pretty-prints each supported format', () => {
  assert.equal(formatPlate('241D12345'), '241-D-12345');
  assert.equal(formatPlate('132KE999'), '132-KE-999');
  assert.equal(formatPlate('08G4819'), '08-G-4819');
  assert.equal(formatPlate('99C12345'), '99-C-12345');
  assert.equal(formatPlate('AB51CDE'), 'AB51 CDE');
  assert.equal(formatPlate('K123ABC'), 'K123 ABC');
  // pre-87 and unknown plates come back normalized, without extra separators
  assert.equal(formatPlate('ZV 12345'), 'ZV12345');
  assert.equal(formatPlate('XYZ!!'), 'XYZ');
});

test('formatPlate round-trips: formatting a formatted plate is a no-op', () => {
  const cases = [
    '241-D-12345',
    '132-KE-999',
    '08-G-4819',
    '99-C-12345',
    'ZV12345',
    'AB51 CDE',
    'K123 ABC'
  ];
  for (const c of cases) {
    const once = formatPlate(c);
    assert.equal(formatPlate(once), once, `round-trip failed for ${c}`);
  }
});
