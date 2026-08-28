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
