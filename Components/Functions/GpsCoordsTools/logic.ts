// GPS Coordinate Converter — pure logic, no browser APIs.
// Supports: Decimal Degrees (DD), Degrees Minutes Seconds (DMS),
//           Degrees Decimal Minutes (DDM), and simplified UTM zone info.

export interface ParsedCoord {
  lat: number;
  lon: number;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseDMS(s: string): number | null {
  // e.g. 48°51'24"N  or  48° 51' 24" N  or  48d51m24sN
  const m = s.trim().match(
    /^(\d+)[°d]\s*(\d+)[''′m]\s*([\d.]+)[""″s]?\s*([NSEW])$/i
  );
  if (!m) return null;
  const deg = parseFloat(m[1]);
  const min = parseFloat(m[2]);
  const sec = parseFloat(m[3]);
  const dir = m[4].toUpperCase();
  const dd = deg + min / 60 + sec / 3600;
  return (dir === 'S' || dir === 'W') ? -dd : dd;
}

function parseDDM(s: string): number | null {
  // e.g. 48°51.4'N
  const m = s.trim().match(/^(\d+)[°d]\s*([\d.]+)[''′m]?\s*([NSEW])$/i);
  if (!m) return null;
  const deg = parseFloat(m[1]);
  const min = parseFloat(m[2]);
  const dir = m[3].toUpperCase();
  const dd = deg + min / 60;
  return (dir === 'S' || dir === 'W') ? -dd : dd;
}

function parseDD(s: string): number | null {
  // e.g. 48.8566°N or -48.8566 or 48.8566 N
  const m = s.trim().match(/^(-?[\d.]+)[°]?\s*([NSEW])?$/i);
  if (!m) return null;
  let val = parseFloat(m[1]);
  if (isNaN(val)) return null;
  const dir = (m[2] || '').toUpperCase();
  if (dir === 'S' || dir === 'W') val = -val;
  return val;
}

// Try to parse a single coordinate component string
function parseComponent(s: string): number | null {
  return parseDMS(s) ?? parseDDM(s) ?? parseDD(s);
}

export function parseGpsInput(input: string): ParsedCoord {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Input is empty');

  // Split on comma or common separators between lat/lon
  // Handle cases like:  "48.8566°N, 2.3522°E"  or  "48°51'24\"N 2°21'8\"E"
  // Strategy: split on comma first; if that gives 2 pieces, use them.
  // Otherwise split on whitespace boundary between a direction char and a digit.

  let parts: string[] = [];

  if (trimmed.includes(',')) {
    parts = trimmed.split(',').map(s => s.trim());
  } else {
    // Try splitting on whitespace before a signed number or hemisphere letter transition
    // e.g. "48°51'24\"N 2°21'8\"E"
    const m = trimmed.match(/^(.*?[NSEW])\s+(-?[\d°].*)$/i);
    if (m) {
      parts = [m[1].trim(), m[2].trim()];
    } else {
      // plain "lat lon"
      const ws = trimmed.split(/\s+/);
      if (ws.length === 2) parts = ws;
    }
  }

  if (parts.length < 2) throw new Error('Could not split input into latitude and longitude');

  const lat = parseComponent(parts[0]);
  const lon = parseComponent(parts[1]);
  if (lat === null || isNaN(lat)) throw new Error(`Cannot parse latitude: "${parts[0]}"`);
  if (lon === null || isNaN(lon)) throw new Error(`Cannot parse longitude: "${parts[1]}"`);
  if (lat < -90 || lat > 90) throw new Error('Latitude out of range (-90 to 90)');
  if (lon < -180 || lon > 180) throw new Error('Longitude out of range (-180 to 180)');
  return { lat, lon };
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function absDD(v: number) { return Math.abs(v); }

export function toDD(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${absDD(lat).toFixed(6)}°${latDir}, ${absDD(lon).toFixed(6)}°${lonDir}`;
}

export function toDMS(lat: number, lon: number): string {
  function fmt(val: number, posDir: string, negDir: string): string {
    const dir = val >= 0 ? posDir : negDir;
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const minFull = (abs - deg) * 60;
    const min = Math.floor(minFull);
    const sec = (minFull - min) * 60;
    return `${deg}°${min}'${sec.toFixed(2)}"${dir}`;
  }
  return `${fmt(lat, 'N', 'S')}, ${fmt(lon, 'E', 'W')}`;
}

export function toDDM(lat: number, lon: number): string {
  function fmt(val: number, posDir: string, negDir: string): string {
    const dir = val >= 0 ? posDir : negDir;
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const min = (abs - deg) * 60;
    return `${deg}°${min.toFixed(4)}'${dir}`;
  }
  return `${fmt(lat, 'N', 'S')}, ${fmt(lon, 'E', 'W')}`;
}

export function toUTMZone(lat: number, lon: number): string {
  // Simplified UTM zone number (no full projection)
  const zone = Math.floor((lon + 180) / 6) + 1;
  const band = lat >= 0 ? 'N' : 'S';
  return `UTM Zone ${zone}${band} (zone number only — full projection requires library)`;
}

export function toMGRSDescription(lat: number, lon: number): string {
  // MGRS band letter
  const bands = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx = Math.max(0, Math.min(19, Math.floor((lat + 80) / 8)));
  const band = bands[bandIdx];
  const zone = Math.floor((lon + 180) / 6) + 1;
  return `MGRS Grid Zone: ${zone}${band} (simplified — no 100km square or easting/northing)`;
}

export function convertGpsCoords(input: string): string {
  const { lat, lon } = parseGpsInput(input);
  const lines = [
    `Parsed:  lat=${lat.toFixed(8)}, lon=${lon.toFixed(8)}`,
    '',
    'Decimal Degrees (DD):',
    `  ${toDD(lat, lon)}`,
    '',
    'Degrees Minutes Seconds (DMS):',
    `  ${toDMS(lat, lon)}`,
    '',
    'Degrees Decimal Minutes (DDM):',
    `  ${toDDM(lat, lon)}`,
    '',
    toUTMZone(lat, lon),
    toMGRSDescription(lat, lon),
  ];
  return lines.join('\n');
}
