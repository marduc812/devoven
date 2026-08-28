// Astronomical Calculator — pure math, no browser APIs.
// Uses NOAA solar position algorithm (simplified) and Julian Day approximation.

const DEG = Math.PI / 180;

// ─── Julian Day Number ────────────────────────────────────────────────────────

export function julianDay(year: number, month: number, day: number): number {
  // Algorithm from Jean Meeus "Astronomical Algorithms"
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// ─── Solar Position (NOAA) ────────────────────────────────────────────────────

function solarDeclination(jd: number): number {
  const n = jd - 2451545.0; // Days from J2000.0
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda = L + 1.915 * Math.sin(g * DEG) + 0.020 * Math.sin(2 * g * DEG);
  const epsilon = 23.439 - 0.0000004 * n;
  const decl = Math.asin(Math.sin(epsilon * DEG) * Math.sin(lambda * DEG)) / DEG;
  return decl;
}

function equationOfTime(jd: number): number {
  // Returns equation of time in minutes
  const n = jd - 2451545.0;
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360;
  const lambda = L + 1.915 * Math.sin(g * DEG) + 0.020 * Math.sin(2 * g * DEG);
  const epsilon = 23.439 - 0.0000004 * n;
  // Equation of time approximation (minutes)
  const y = Math.tan((epsilon / 2) * DEG) ** 2;
  const eot = 4 * (
    y * Math.sin(2 * L * DEG)
    - 2 * 0.016708 * Math.sin(g * DEG)
    + 4 * 0.016708 * y * Math.sin(g * DEG) * Math.cos(2 * L * DEG)
    - 0.5 * y * y * Math.sin(4 * L * DEG)
    - 1.25 * 0.016708 * 0.016708 * Math.sin(2 * g * DEG)
  ) / DEG;
  return eot; // minutes
}

function hourAngleSunrise(lat: number, decl: number): number | null {
  // Returns hour angle at sunrise in degrees, or null if no rise/set (polar day/night)
  const cosHa = (Math.cos(90.833 * DEG) - Math.sin(lat * DEG) * Math.sin(decl * DEG))
    / (Math.cos(lat * DEG) * Math.cos(decl * DEG));
  if (cosHa < -1) return null; // Midnight sun
  if (cosHa > 1) return null;  // Polar night
  return Math.acos(cosHa) / DEG;
}

export interface SolarResult {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: string;
  declination: number;
  equationOfTime: number;
  polarCondition: string | null;
}

function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, '0')}:${String(Math.abs(m)).padStart(2, '0')} UTC`;
}

function minutesToDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${m}m`;
}

export function computeSolar(year: number, month: number, day: number, lat: number, lon: number): SolarResult {
  const jd = julianDay(year, month, day);
  const decl = solarDeclination(jd);
  const eot = equationOfTime(jd);

  const solarNoonUTC = 720 - 4 * lon - eot; // minutes from midnight UTC

  const ha = hourAngleSunrise(lat, decl);
  if (ha === null) {
    const polar = decl > 0
      ? (lat > 0 ? 'Midnight sun (sun does not set)' : 'Polar night (sun does not rise)')
      : (lat < 0 ? 'Midnight sun (sun does not set)' : 'Polar night (sun does not rise)');
    return {
      sunrise: '—',
      sunset: '—',
      solarNoon: minutesToHHMM(solarNoonUTC),
      dayLength: decl * lat > 0 ? '24h 0m' : '0h 0m',
      declination: decl,
      equationOfTime: eot,
      polarCondition: polar,
    };
  }

  const sunriseUTC = solarNoonUTC - 4 * ha;
  const sunsetUTC  = solarNoonUTC + 4 * ha;
  const dayLen     = 8 * ha;

  return {
    sunrise:         minutesToHHMM(sunriseUTC),
    sunset:          minutesToHHMM(sunsetUTC),
    solarNoon:       minutesToHHMM(solarNoonUTC),
    dayLength:       minutesToDuration(dayLen),
    declination:     decl,
    equationOfTime:  eot,
    polarCondition:  null,
  };
}

// ─── Moon Phase ───────────────────────────────────────────────────────────────

export interface MoonPhase {
  age: number;        // 0–29.53 days since last new moon
  illumination: number; // 0–100 %
  phaseName: string;
}

export function moonPhase(year: number, month: number, day: number): MoonPhase {
  // Known new moon: Jan 6, 2000 (JD 2451549.5)
  const jd = julianDay(year, month, day);
  const knownNewMoon = 2451549.5;
  const synodicMonth = 29.53058770;
  const age = ((jd - knownNewMoon) % synodicMonth + synodicMonth) % synodicMonth;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * age / synodicMonth)) / 2 * 100);

  let phaseName: string;
  if (age < 1.845)        phaseName = 'New Moon';
  else if (age < 7.382)   phaseName = 'Waxing Crescent';
  else if (age < 9.228)   phaseName = 'First Quarter';
  else if (age < 14.765)  phaseName = 'Waxing Gibbous';
  else if (age < 16.611)  phaseName = 'Full Moon';
  else if (age < 22.148)  phaseName = 'Waning Gibbous';
  else if (age < 23.994)  phaseName = 'Last Quarter';
  else if (age < 29.531)  phaseName = 'Waning Crescent';
  else                    phaseName = 'New Moon';

  return { age, illumination, phaseName };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface AstroInput {
  year: number;
  month: number;
  day: number;
  lat: number;
  lon: number;
}

export function parseAstroInput(input: string): AstroInput {
  // Format: "YYYY-MM-DD lat, lon"  or  "YYYY-MM-DD lat lon"
  const trimmed = input.trim();
  const m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(-?[\d.]+)[,\s]+(-?[\d.]+)$/);
  if (!m) {
    throw new Error('Format: YYYY-MM-DD lat, lon  (e.g. "2025-06-21 51.5, -0.1")');
  }
  const year  = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day   = parseInt(m[3], 10);
  const lat   = parseFloat(m[4]);
  const lon   = parseFloat(m[5]);
  if (month < 1 || month > 12) throw new Error('Month must be 1–12');
  if (day < 1 || day > 31)     throw new Error('Day must be 1–31');
  if (lat < -90 || lat > 90)   throw new Error('Latitude must be -90 to 90');
  if (lon < -180 || lon > 180) throw new Error('Longitude must be -180 to 180');
  return { year, month, day, lat, lon };
}

export function computeAstronomy(input: string): string {
  if (!input.trim()) return '';
  const { year, month, day, lat, lon } = parseAstroInput(input);
  const solar = computeSolar(year, month, day, lat, lon);
  const moon  = moonPhase(year, month, day);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${day} ${monthNames[month - 1]} ${year}`;
  const latDir  = lat >= 0 ? 'N' : 'S';
  const lonDir  = lon >= 0 ? 'E' : 'W';

  const lines = [
    `Date:              ${dateStr}`,
    `Location:          ${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`,
    '',
    '── Solar ──────────────────────────',
    `Sunrise (UTC):     ${solar.sunrise}`,
    `Solar Noon (UTC):  ${solar.solarNoon}`,
    `Sunset (UTC):      ${solar.sunset}`,
    `Day Length:        ${solar.dayLength}`,
    `Solar Declination: ${solar.declination.toFixed(4)}°`,
    `Equation of Time:  ${solar.equationOfTime.toFixed(2)} min`,
    ...(solar.polarCondition ? [`Note:              ${solar.polarCondition}`] : []),
    '',
    '── Moon ────────────────────────────',
    `Moon Phase:        ${moon.phaseName}`,
    `Illumination:      ${moon.illumination}%`,
    `Age:               ${moon.age.toFixed(1)} / 29.5 days`,
  ];
  return lines.join('\n');
}
