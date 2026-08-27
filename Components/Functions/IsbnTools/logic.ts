export function validateIsbn10(isbn: string): boolean {
  const digits = isbn.replace(/[-\s]/g, '');
  if (!/^\d{9}[\dX]$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(digits[i]);
  const check = digits[9] === 'X' ? 10 : parseInt(digits[9]);
  return (sum + check) % 11 === 0;
}

export function validateIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += (i % 2 === 0 ? 1 : 3) * parseInt(digits[i]);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[12]);
}

export function convertIsbn10To13(isbn10: string): string {
  const digits = isbn10.replace(/[-\s]/g, '');
  if (!validateIsbn10(isbn10)) throw new Error('Invalid ISBN-10');
  const base = '978' + digits.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? 1 : 3) * parseInt(base[i]);
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

/** ISBN-13 → ISBN-10. Only the 978 prefix has an ISBN-10 equivalent; 979 numbers
 *  were issued after the 10-digit space ran out and have none. */
export function convertIsbn13To10(isbn13: string): string {
  const digits = isbn13.replace(/[-\s]/g, '');
  if (!validateIsbn13(isbn13)) throw new Error('Invalid ISBN-13');
  if (!digits.startsWith('978')) throw new Error('Only 978-prefixed ISBN-13 numbers have an ISBN-10 form');
  const body = digits.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(body[i], 10);
  const check = (11 - (sum % 11)) % 11;
  return body + (check === 10 ? 'X' : String(check));
}

export function normalizeIsbn(input: string): string {
  return input.replace(/[-\s‐-―]/g, '').toUpperCase();
}

export function validateIsbn(input: string): string {
  const raw = input.trim();
  const digits = normalizeIsbn(raw);

  if (digits.length === 10) {
    const valid = validateIsbn10(raw);
    let result = `ISBN-10: ${raw}\nValid:   ${valid ? 'Yes ✓' : 'No ✗'}`;
    if (valid) {
      try { result += `\nISBN-13: ${convertIsbn10To13(raw)}`; } catch { /* ignore */ }
    }
    return result;
  }

  if (digits.length === 13) {
    const valid = validateIsbn13(raw);
    return `ISBN-13: ${raw}\nValid:   ${valid ? 'Yes ✓' : 'No ✗'}`;
  }

  throw new Error(`ISBN must be 10 or 13 digits (got ${digits.length})`);
}

// ─── Registration groups ─────────────────────────────────────────────────────
// The group identifier is variable-length, so it can only be split off by
// range. These are the ranges ISBN International publishes; everything after
// the group (registrant + publication) needs the full range tables to split
// further, so this stops there and says so rather than guessing.

type GroupRange = { length: number; min: number; max: number };

const GROUP_RANGES_978: GroupRange[] = [
  { length: 1, min: 0, max: 5 },
  { length: 1, min: 7, max: 7 },
  { length: 2, min: 65, max: 65 },
  { length: 2, min: 80, max: 94 },
  { length: 3, min: 600, max: 649 },
  { length: 3, min: 950, max: 989 },
  { length: 4, min: 9900, max: 9989 },
  { length: 5, min: 99900, max: 99999 },
];

const GROUP_RANGES_979: GroupRange[] = [
  { length: 1, min: 8, max: 8 },
  { length: 2, min: 10, max: 12 },
];

export const GROUP_NAMES: Record<string, string> = {
  '978-0': 'English language',
  '978-1': 'English language',
  '978-2': 'French language',
  '978-3': 'German language',
  '978-4': 'Japan',
  '978-5': 'Russian language',
  '978-7': 'China',
  '978-65': 'Brazil',
  '978-80': 'Czechia & Slovakia',
  '978-81': 'India',
  '978-82': 'Norway',
  '978-83': 'Poland',
  '978-84': 'Spain',
  '978-85': 'Brazil',
  '978-86': 'Serbia & former Yugoslavia',
  '978-87': 'Denmark',
  '978-88': 'Italian language',
  '978-89': 'Korea',
  '978-90': 'Netherlands & Belgium (Dutch)',
  '978-91': 'Sweden',
  '978-92': 'International organisations (UN, UNESCO, EU)',
  '978-93': 'India',
  '978-94': 'Netherlands & Belgium (Dutch)',
  '979-8': 'United States',
  '979-10': 'France',
  '979-11': 'Korea',
  '979-12': 'Italy',
};

/** Split the variable-length registration group off the front of `body`.
 *  Returns null when the leading digits fall in no published range. */
export function splitRegistrationGroup(prefix: string, body: string): string | null {
  const ranges = prefix === '979' ? GROUP_RANGES_979 : GROUP_RANGES_978;
  for (const { length, min, max } of ranges) {
    if (body.length < length) continue;
    const candidate = body.slice(0, length);
    const value = parseInt(candidate, 10);
    if (Number.isNaN(value)) continue;
    // Compare on the digit string's numeric value so leading zeros still match
    // the 1-digit ranges ("0" → 0) without colliding with the wider ones.
    if (candidate.length === length && value >= min && value <= max) return candidate;
  }
  return null;
}

// ─── Structured report ───────────────────────────────────────────────────────

export type IsbnKind = 'isbn10' | 'isbn13';

export interface IsbnCheckStep {
  /** 1-based position within the normalized number. */
  position: number;
  digit: string;
  value: number;
  weight: number;
  product: number;
}

export interface IsbnSegments {
  /** EAN prefix — '978'/'979' for ISBN-13, null for ISBN-10. */
  prefix: string | null;
  group: string | null;
  /** Registrant + publication. Splitting these needs the full range tables. */
  body: string;
  check: string;
}

export interface IsbnReport {
  input: string;
  normalized: string;
  kind: IsbnKind;
  valid: boolean;
  /** Empty when the input has characters that make the checksum undefined. */
  steps: IsbnCheckStep[];
  sum: number;
  modulus: number;
  checkDigit: string;
  expectedCheckDigit: string;
  /** The same number with the correct check digit — only set when invalid. */
  corrected: string | null;
  isbn10: string | null;
  isbn13: string | null;
  segments: IsbnSegments;
  groupName: string | null;
  hyphenated: string;
  issues: string[];
}

const digitValue = (c: string) => (c === 'X' ? 10 : parseInt(c, 10));

function isbn10Steps(digits: string): IsbnCheckStep[] {
  return digits.split('').map((digit, i) => {
    const weight = 10 - i;
    const value = digitValue(digit);
    return { position: i + 1, digit, value, weight, product: value * weight };
  });
}

function isbn13Steps(digits: string): IsbnCheckStep[] {
  return digits.split('').map((digit, i) => {
    const weight = i % 2 === 0 ? 1 : 3;
    const value = digitValue(digit);
    return { position: i + 1, digit, value, weight, product: value * weight };
  });
}

export function isbn10CheckDigit(first9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(first9[i], 10);
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? 'X' : String(check);
}

export function isbn13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? 1 : 3) * parseInt(first12[i], 10);
  return String((10 - (sum % 10)) % 10);
}

/** Everything the UI renders. Throws only for a length that is neither 10 nor 13. */
export function analyzeIsbn(input: string): IsbnReport {
  const raw = input.trim();
  const normalized = normalizeIsbn(raw);
  const issues: string[] = [];

  if (normalized.length !== 10 && normalized.length !== 13) {
    throw new Error(`ISBN must be 10 or 13 digits (got ${normalized.length})`);
  }

  const kind: IsbnKind = normalized.length === 10 ? 'isbn10' : 'isbn13';
  const wellFormed =
    kind === 'isbn10' ? /^\d{9}[\dX]$/.test(normalized) : /^\d{13}$/.test(normalized);

  if (!wellFormed) {
    issues.push(
      kind === 'isbn10'
        ? 'An ISBN-10 must be 9 digits followed by a digit or X.'
        : 'An ISBN-13 must be 13 digits — X is only a valid check digit on ISBN-10.'
    );
  }

  const prefix = kind === 'isbn13' ? normalized.slice(0, 3) : null;
  if (kind === 'isbn13' && wellFormed && prefix !== '978' && prefix !== '979') {
    issues.push(`${prefix} is not an ISBN prefix — books use 978 or 979.`);
  }

  const groupSource = kind === 'isbn13' ? normalized.slice(3, 12) : normalized.slice(0, 9);
  const group = wellFormed ? splitRegistrationGroup(prefix ?? '978', groupSource) : null;
  const groupKey = group === null ? null : `${prefix ?? '978'}-${group}`;

  const check = normalized.slice(-1);
  const segments: IsbnSegments = {
    prefix,
    group,
    body: groupSource.slice(group?.length ?? 0),
    check,
  };

  const hyphenated = [segments.prefix, segments.group, segments.body, segments.check]
    .filter((part): part is string => part !== null && part !== '')
    .join('-');

  if (!wellFormed) {
    return {
      input: raw, normalized, kind, valid: false, steps: [], sum: 0,
      modulus: kind === 'isbn10' ? 11 : 10,
      checkDigit: check, expectedCheckDigit: '?', corrected: null,
      isbn10: null, isbn13: null, segments, groupName: null, hyphenated, issues,
    };
  }

  const steps = kind === 'isbn10' ? isbn10Steps(normalized) : isbn13Steps(normalized);
  const sum = steps.reduce((total, s) => total + s.product, 0);
  const modulus = kind === 'isbn10' ? 11 : 10;
  const expected =
    kind === 'isbn10' ? isbn10CheckDigit(normalized.slice(0, 9)) : isbn13CheckDigit(normalized.slice(0, 12));
  const valid = check === expected;

  if (!valid) issues.push(`Check digit is ${check}; it should be ${expected}.`);

  let isbn10: string | null = null;
  let isbn13: string | null = null;
  if (valid) {
    if (kind === 'isbn10') {
      isbn10 = normalized;
      try { isbn13 = convertIsbn10To13(normalized); } catch { /* unreachable for a valid ISBN-10 */ }
    } else {
      isbn13 = normalized;
      try { isbn10 = convertIsbn13To10(normalized); } catch { isbn10 = null; }
    }
  }

  return {
    input: raw,
    normalized,
    kind,
    valid,
    steps,
    sum,
    modulus,
    checkDigit: check,
    expectedCheckDigit: expected,
    corrected: valid ? null : normalized.slice(0, -1) + expected,
    isbn10,
    isbn13,
    segments,
    groupName: groupKey ? GROUP_NAMES[groupKey] ?? null : null,
    hyphenated,
    issues,
  };
}
