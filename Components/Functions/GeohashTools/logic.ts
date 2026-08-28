// Pure geohash encoding/decoding — no browser APIs.
// Uses the standard base32 character set (Geohash spec).

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export interface GeohashResult {
  geohash: string;
  lat: number;
  lon: number;
  precision: number;
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  accuracyMeters: number;
}

export interface DecodedGeohash {
  lat: number;
  lon: number;
  latErr: number;
  lonErr: number;
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number };
}

// Approximate accuracy in meters for each precision level (at equator)
const PRECISION_ACCURACY: Record<number, number> = {
  1: 2500000,
  2: 630000,
  3: 78000,
  4: 20000,
  5: 2400,
  6: 610,
  7: 76,
  8: 19,
  9: 2.4,
  10: 0.6,
  11: 0.074,
  12: 0.019,
};

export function encodeGeohash(lat: number, lon: number, precision: number = 9): string {
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
  if (lon < -180 || lon > 180) throw new Error('Longitude must be between -180 and 180');
  if (precision < 1 || precision > 12) throw new Error('Precision must be between 1 and 12');

  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let isEven = true;
  let bit = 4;
  let ch = 0;
  let hash = '';

  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) { ch |= (1 << bit); minLon = mid; }
      else { maxLon = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch |= (1 << bit); minLat = mid; }
      else { maxLat = mid; }
    }
    isEven = !isEven;
    if (bit > 0) {
      bit--;
    } else {
      hash += BASE32[ch];
      bit = 4;
      ch = 0;
    }
  }
  return hash;
}

export function decodeGeohash(geohash: string): DecodedGeohash {
  const clean = geohash.trim().toLowerCase();
  if (!/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(clean)) {
    throw new Error('Invalid geohash: contains illegal characters');
  }
  if (clean.length === 0) throw new Error('Geohash cannot be empty');

  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let isEven = true;

  for (const c of clean) {
    const idx = BASE32.indexOf(c);
    if (idx === -1) throw new Error(`Invalid geohash character: ${c}`);
    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (idx >> bits) & 1;
      if (isEven) {
        const mid = (minLon + maxLon) / 2;
        if (bitN === 1) minLon = mid; else maxLon = mid;
      } else {
        const mid = (minLat + maxLat) / 2;
        if (bitN === 1) minLat = mid; else maxLat = mid;
      }
      isEven = !isEven;
    }
  }

  const lat = (minLat + maxLat) / 2;
  const lon = (minLon + maxLon) / 2;
  const latErr = (maxLat - minLat) / 2;
  const lonErr = (maxLon - minLon) / 2;

  return {
    lat,
    lon,
    latErr,
    lonErr,
    bbox: { minLat, maxLat, minLon, maxLon },
  };
}

function looksLikeGeohash(input: string): boolean {
  return /^[0-9bcdefghjkmnpqrstuvwxyz]+$/i.test(input.trim()) && input.trim().length <= 12 && input.trim().length >= 1;
}

function looksLikeLatLon(input: string): boolean {
  // Accept "lat, lon" or "lat lon" patterns
  return /^-?\d+(\.\d+)?\s*[,\s]\s*-?\d+(\.\d+)?$/.test(input.trim());
}

export function processGeohashInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Try to detect if it's a lat/lon pair
  if (looksLikeLatLon(trimmed)) {
    const parts = trimmed.split(/[\s,]+/).map(Number);
    const lat = parts[0];
    const lon = parts[1];
    if (isNaN(lat) || isNaN(lon)) throw new Error('Invalid coordinate values');

    const lines: string[] = [];
    for (let p = 1; p <= 9; p++) {
      const gh = encodeGeohash(lat, lon, p);
      const acc = PRECISION_ACCURACY[p];
      const accStr = acc >= 1000 ? `~${(acc / 1000).toFixed(0)} km` : `~${acc} m`;
      lines.push(`  Precision ${p} (${accStr}): ${gh}`);
    }

    const gh9 = encodeGeohash(lat, lon, 9);
    const decoded = decodeGeohash(gh9);

    return [
      `Input: ${lat}, ${lon}`,
      '',
      'Geohash at various precisions:',
      ...lines,
      '',
      `Best (precision 9): ${gh9}`,
      `Bounding box: ${decoded.bbox.minLat.toFixed(6)}, ${decoded.bbox.minLon.toFixed(6)} → ${decoded.bbox.maxLat.toFixed(6)}, ${decoded.bbox.maxLon.toFixed(6)}`,
    ].join('\n');
  }

  // Try as geohash
  if (looksLikeGeohash(trimmed)) {
    const decoded = decodeGeohash(trimmed.toLowerCase());
    const precision = trimmed.length;
    const acc = PRECISION_ACCURACY[precision] ?? 0;
    const accStr = acc >= 1000 ? `~${(acc / 1000).toFixed(0)} km` : `~${acc} m`;

    return [
      `Input geohash: ${trimmed.toLowerCase()}`,
      `Precision:     ${precision} characters (${accStr})`,
      '',
      `Decoded center:`,
      `  Latitude:    ${decoded.lat.toFixed(8)}`,
      `  Longitude:   ${decoded.lon.toFixed(8)}`,
      `  Lat error:   ±${decoded.latErr.toFixed(8)}°`,
      `  Lon error:   ±${decoded.lonErr.toFixed(8)}°`,
      '',
      `Bounding box:`,
      `  SW: ${decoded.bbox.minLat.toFixed(6)}, ${decoded.bbox.minLon.toFixed(6)}`,
      `  NE: ${decoded.bbox.maxLat.toFixed(6)}, ${decoded.bbox.maxLon.toFixed(6)}`,
      '',
      `Re-encoded:    ${encodeGeohash(decoded.lat, decoded.lon, precision)}`,
    ].join('\n');
  }

  throw new Error('Input must be a geohash string (e.g. "u09tvw0") or a lat/lon pair (e.g. "48.8566, 2.3522")');
}
