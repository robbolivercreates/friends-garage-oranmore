/**
 * Irish & UK number-plate parser — pure functions, no external APIs.
 *
 * Irish formats:
 *  - 2013+:   YYY-C-NNNNN   e.g. 241-D-12345 → 2024 half 1, Dublin
 *                              132-KE-999   → 2013 half 2, Kildare
 *  - 1987–12: YY-C-NNNNN    e.g. 08-G-4819   → 2008, Galway
 *  - pre-1987: letters-then-numbers, e.g. "ZV 12345", "AZ 987"
 *                              → year unknown, county from legacy code
 * UK formats (imports):
 *  - 2001+:   AB51 CDE      → 2-letter region + 2-digit age (51 = Sep-Feb, 01 = Mar-Aug)
 *  - 1983–01: A123 BCD      → prefix year letter
 * Anything unparseable returns { format: 'unknown' } so the UI offers manual entry.
 */

export interface ParsedPlate {
  format: 'irish_current' | 'irish_87_12' | 'irish_pre87' | 'uk_current' | 'uk_prefix' | 'unknown';
  /** Normalized registration, uppercase, no spaces/dashes */
  registration: string;
  year?: number;
  /** 1 = Jan–Jun, 2 = Jul–Dec (Irish current & UK age identifiers) */
  half?: 1 | 2;
  county?: string;
  countyCode?: string;
  region?: string;
  /** True when staff should confirm/edit details manually */
  needsReview: boolean;
  note?: string;
}

/** Modern Irish county codes (1987+). */
const IRISH_COUNTIES: Record<string, string> = {
  D: 'Dublin', C: 'Cork', G: 'Galway', KY: 'Kerry', L: 'Limerick',
  LD: 'Longford', LS: 'Laois', LM: 'Leitrim', MH: 'Meath', MN: 'Monaghan',
  MO: 'Mayo', OY: 'Offaly', RN: 'Roscommon', SO: 'Sligo', T: 'Tipperary',
  W: 'Waterford', WH: 'Westmeath', WW: 'Wicklow', WX: 'Wexford',
  DL: 'Donegal', CE: 'Clare', CN: 'Cavan', CW: 'Carlow', KE: 'Kildare',
  KK: 'Kilkenny'
};

/** Legacy pre-1987 Irish county codes (letters BEFORE the numbers). */
const IRISH_PRE87_COUNTIES: Record<string, string> = {
  Z: 'Dublin', ZC: 'Dublin', ZD: 'Dublin', ZE: 'Dublin', ZF: 'Dublin',
  ZG: 'Galway', ZL: 'Limerick', ZM: 'Leitrim', ZN: 'Meath', ZO: 'Westmeath',
  ZP: 'Cork', ZR: 'Wexford', ZT: 'Tipperary', ZV: 'Kerry', ZW: 'Wicklow',
  ZY: 'Louth', ZZ: 'Mayo', ZA: 'Cork', ZB: 'Cork', ZH: 'Clare', ZJ: 'Donegal',
  ZK: 'Laois', ZS: 'Sligo', ZU: 'Longford', ZX: 'Roscommon', ZI: 'Cavan',
  C: 'Cork', G: 'Galway', D: 'Dublin', L: 'Limerick', W: 'Waterford',
  T: 'Tipperary', KK: 'Kilkenny', KE: 'Kildare', MH: 'Meath', MO: 'Mayo',
  SO: 'Sligo', RN: 'Roscommon', DL: 'Donegal', CE: 'Clare', CN: 'Cavan',
  CW: 'Carlow', LS: 'Laois', LD: 'Longford', WH: 'Westmeath', WW: 'Wicklow',
  WX: 'Wexford', MN: 'Monaghan', OY: 'Offaly', LM: 'Leitrim', KY: 'Kerry'
};

/** UK 2001+ region codes (first letter = broad region). */
const UK_REGIONS: Record<string, string> = {
  A: 'Anglia', B: 'Birmingham', C: 'Cymru (Wales)', D: 'Deeside/Shrewsbury',
  E: 'Essex', F: 'Forest & Fens (Nottingham/Lincoln)', G: 'Garden of England (Kent/Sussex)',
  H: 'Hampshire & Dorset', K: 'North London', L: 'London', M: 'Manchester & Merseyside',
  N: 'North East', O: 'Oxford', P: 'Preston', R: 'Reading', S: 'Scotland',
  V: 'Severn Valley', W: 'West of England (Bristol)', X: 'Personal export', Y: 'Yorkshire'
};

/** UK 1983–2001 prefix year letters. */
const UK_PREFIX_YEARS: Record<string, number> = {
  A: 1983, B: 1984, C: 1985, D: 1986, E: 1987, F: 1988, G: 1989, H: 1990,
  J: 1991, K: 1992, L: 1993, M: 1994, N: 1995, P: 1996, R: 1997, S: 1998,
  T: 1999, V: 1999, W: 2000, X: 2000, Y: 2001
};

export function normalizePlate(input: string): string {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parsePlate(rawInput: string): ParsedPlate {
  const reg = normalizePlate(rawInput);
  if (!reg) {
    return { format: 'unknown', registration: '', needsReview: true, note: 'No registration entered' };
  }

  // --- Irish current (2013+): YYY + county(1-2) + serial(1-6) e.g. 241D12345 ---
  let m = reg.match(/^(\d{2})([12])([A-Z]{1,2})(\d{1,6})$/);
  if (m) {
    const countyCode = m[3];
    const county = IRISH_COUNTIES[countyCode];
    if (county) {
      return {
        format: 'irish_current',
        registration: reg,
        year: 2000 + Number(m[1]),
        half: Number(m[2]) as 1 | 2,
        county,
        countyCode,
        needsReview: false
      };
    }
  }

  // --- Irish 1987–2012: YY + county + serial (1-6 digits, e.g. 99-C-1 or 08-G-4819) ---
  m = reg.match(/^(\d{2})([A-Z]{1,2})(\d{1,6})$/);
  if (m) {
    const countyCode = m[2];
    const county = IRISH_COUNTIES[countyCode];
    const yy = Number(m[1]);
    if (county && yy >= 87 && yy <= 99) {
      return { format: 'irish_87_12', registration: reg, year: 1900 + yy, county, countyCode, needsReview: false };
    }
    if (county && yy <= 12) {
      return { format: 'irish_87_12', registration: reg, year: 2000 + yy, county, countyCode, needsReview: false };
    }
  }

  // --- UK current (2001+): 2 letters + 2 age digits + 3 letters, e.g. AB51CDE ---
  m = reg.match(/^([A-Z]{2})(\d{2})([A-Z]{3})$/);
  if (m) {
    const age = Number(m[2]);
    const half: 1 | 2 = age >= 50 ? 2 : 1;
    const year = 2000 + (age % 50);
    return {
      format: 'uk_current',
      registration: reg,
      year,
      half,
      region: UK_REGIONS[m[1][0]] || 'United Kingdom',
      county: 'United Kingdom (import)',
      countyCode: m[1],
      needsReview: true,
      note: 'UK registration — please confirm vehicle details manually'
    };
  }

  // --- UK prefix (1983–2001): 1 letter + 1-3 digits + 3 letters, e.g. A123BCD ---
  m = reg.match(/^([A-Z])(\d{1,3})([A-Z]{3})$/);
  if (m && UK_PREFIX_YEARS[m[1]]) {
    return {
      format: 'uk_prefix',
      registration: reg,
      year: UK_PREFIX_YEARS[m[1]],
      region: 'United Kingdom',
      county: 'United Kingdom (import)',
      needsReview: true,
      note: 'UK registration — please confirm vehicle details manually'
    };
  }

  // --- Irish pre-1987: 1-2 letters + numbers ---
  m = reg.match(/^([A-Z]{1,3})(\d{1,6})$/);
  if (m) {
    const code = m[1];
    const county = IRISH_PRE87_COUNTIES[code];
    return {
      format: 'irish_pre87',
      registration: reg,
      county,
      countyCode: code,
      needsReview: true,
      note: county
        ? `Pre-1987 plate, likely ${county} — please confirm year manually`
        : 'Older/unusual plate — please enter year and county manually'
    };
  }

  return {
    format: 'unknown',
    registration: reg,
    needsReview: true,
    note: 'Unrecognised format — please enter vehicle details manually'
  };
}

/** Pretty display: 241D12345 → 241-D-12345, AB51CDE → AB51 CDE */
export function formatPlate(rawInput: string): string {
  const p = parsePlate(rawInput);
  const r = p.registration;
  switch (p.format) {
    case 'irish_current':
      return r.replace(/^(\d{3})([A-Z]{1,2})(\d+)$/, '$1-$2-$3');
    case 'irish_87_12':
      return r.replace(/^(\d{2})([A-Z]{1,2})(\d+)$/, '$1-$2-$3');
    case 'uk_current':
      return r.replace(/^([A-Z]{2}\d{2})([A-Z]{3})$/, '$1 $2');
    case 'uk_prefix':
      return r.replace(/^([A-Z]\d{1,3})([A-Z]{3})$/, '$1 $2');
    default: {
      // Display formatting never depends on county validation — even an
      // unrecognised plate is easier to read with its natural grouping.
      const m3 = r.match(/^(\d{3})([A-Z]{1,2})(\d+)$/);
      if (m3) return r.replace(/^(\d{3})([A-Z]{1,2})(\d+)$/, '$1-$2-$3');
      const m2 = r.match(/^(\d{2})([A-Z]{1,2})(\d+)$/);
      if (m2) return r.replace(/^(\d{2})([A-Z]{1,2})(\d+)$/, '$1-$2-$3');
      return r;
    }
  }
}
