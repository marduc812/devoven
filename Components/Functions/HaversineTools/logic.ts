const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number { return deg * Math.PI / 180; }

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function parseCoordsInput(input: string): string {
  const lines = input.trim().split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('Enter two coordinates, one per line: "lat,lon"');

  const parseCoord = (s: string): [number, number] => {
    const parts = s.split(/[\s,]+/).map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) throw new Error(`Invalid coordinate: "${s}"`);
    return [parts[0], parts[1]];
  };

  const [lat1, lon1] = parseCoord(lines[0]);
  const [lat2, lon2] = parseCoord(lines[1]);

  const km = haversineDistance(lat1, lon1, lat2, lon2);
  const miles = km * 0.621371;
  const nm = km * 0.539957;

  return [
    `Point 1:     ${lat1}, ${lon1}`,
    `Point 2:     ${lat2}, ${lon2}`,
    '',
    `Distance:`,
    `  Kilometers:     ${km.toFixed(3)} km`,
    `  Miles:          ${miles.toFixed(3)} mi`,
    `  Nautical miles: ${nm.toFixed(3)} nm`,
  ].join('\n');
}

export const KM_TO_MILES = 0.621371;
export const KM_TO_NAUTICAL_MILES = 0.539957;

export interface Coord { lat: number; lon: number }

/**
 * Initial bearing (forward azimuth) from point 1 to point 2, in degrees from
 * north. On a great circle this changes along the route, so it is only the
 * heading at the start.
 */
export function initialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compassPoint(bearing: number): string {
  return COMPASS[Math.round(((bearing % 360) + 360) % 360 / 22.5) % 16];
}

/** Parse one "lat,lon" or "lat lon" string. Returns null rather than throwing. */
export function parseCoord(text: string): Coord | null {
  const parts = text.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { lat: parts[0], lon: parts[1] };
}

/** Both points out of a pasted blob, one per line. Returns null if it can't. */
export function parseCoordPair(text: string): [Coord, Coord] | null {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const a = parseCoord(lines[0]);
  const b = parseCoord(lines[1]);
  return a && b ? [a, b] : null;
}

export function latError(value: number): string {
  if (isNaN(value)) return 'Enter a number.';
  if (value < -90 || value > 90) return 'Latitude runs from -90 to 90.';
  return '';
}

export function lonError(value: number): string {
  if (isNaN(value)) return 'Enter a number.';
  if (value < -180 || value > 180) return 'Longitude runs from -180 to 180.';
  return '';
}

/** Degrees to a degrees/minutes/seconds string, e.g. 51°30'26.6"N. */
export function toDms(value: number, axis: 'lat' | 'lon'): string {
  const hemisphere = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return `${deg}°${min}'${sec.toFixed(1)}"${hemisphere}`;
}
