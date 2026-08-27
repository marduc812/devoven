// Julian Day Number Calculator — pure logic, no browser APIs

/** Convert a Gregorian calendar date to Julian Day Number (JDN).
 *  Uses the standard astronomical algorithm (valid for all proleptic Gregorian dates).
 *  Note: JDN starts at noon UT; this returns the integer JDN for the given date.
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  // Algorithm from Jean Meeus, "Astronomical Algorithms"
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524;
}

/** Convert a Julian Day Number (JDN) to Gregorian calendar date. */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const Z = Math.floor(jdn + 0.5);
  const alpha = Math.floor((Z - 1867216.25) / 36524.25);
  const A = Z + 1 + alpha - Math.floor(alpha / 4);
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  return { year, month, day };
}

/** Compute Modified Julian Date (MJD = JDN - 2400000.5). */
export function jdnToMJD(jdn: number): number {
  return jdn - 2400000.5;
}

/** Day of week from JDN: 0 = Monday, 6 = Sunday (ISO). */
export function jdnDayOfWeek(jdn: number): number {
  return ((jdn + 1) % 7 + 6) % 7;
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Compute Easter Sunday for a given year using the Meeus/Jones/Butcher algorithm. */
export function easterForYear(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export type JulianDayResult = {
  jdn: number;
  mjd: number;
  dayOfWeek: string;
  dateFormatted: string;
  easter: { month: number; day: number; formatted: string };
};

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

/** Parse user input (ISO date string "YYYY-MM-DD") and return full result. */
export function parseGregorianToJDN(input: string): JulianDayResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a date in YYYY-MM-DD format');

  const parts = trimmed.split('-');
  if (parts.length !== 3) throw new Error('Date must be in YYYY-MM-DD format');

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error('Invalid date values');
  if (month < 1 || month > 12) throw new Error('Month must be 1–12');
  if (day < 1 || day > 31) throw new Error('Day must be 1–31');

  const jdn = gregorianToJDN(year, month, day);
  const mjd = jdnToMJD(jdn);
  const dow = jdnDayOfWeek(jdn);
  const easterDate = easterForYear(year);

  return {
    jdn,
    mjd,
    dayOfWeek: DAY_NAMES[dow],
    dateFormatted: `${MONTH_NAMES[month]} ${day}, ${year}`,
    easter: {
      month: easterDate.month,
      day: easterDate.day,
      formatted: `${MONTH_NAMES[easterDate.month]} ${pad2(easterDate.day)}, ${year}`,
    },
  };
}

/** Parse a JDN (integer string) and return Gregorian date + metadata. */
export function parseJDNToGregorian(input: string): JulianDayResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a Julian Day Number');

  const jdn = parseInt(trimmed, 10);
  if (isNaN(jdn)) throw new Error('Invalid Julian Day Number — enter an integer');

  const { year, month, day } = jdnToGregorian(jdn);
  const mjd = jdnToMJD(jdn);
  const dow = jdnDayOfWeek(jdn);
  const easterDate = easterForYear(year);

  return {
    jdn,
    mjd,
    dayOfWeek: DAY_NAMES[dow],
    dateFormatted: `${MONTH_NAMES[month]} ${day}, ${year}`,
    easter: {
      month: easterDate.month,
      day: easterDate.day,
      formatted: `${MONTH_NAMES[easterDate.month]} ${pad2(easterDate.day)}, ${year}`,
    },
  };
}
