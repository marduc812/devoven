import { encodeGeohash, decodeGeohash, processGeohashInput } from '@/Components/Functions/GeohashTools/logic';

describe('encodeGeohash', () => {
  it('encodes Paris to a 6-char geohash starting with u09', () => {
    const gh = encodeGeohash(48.8566, 2.3522, 6);
    expect(gh.length).toBe(6);
    expect(gh).toMatch(/^u09/);
  });

  it('encodes London with precision 5', () => {
    const gh = encodeGeohash(51.5074, -0.1278, 5);
    expect(gh.length).toBe(5);
    expect(gh).toMatch(/^gcpv/);
  });

  it('encodes equator/prime meridian as 7zzzzzz prefix', () => {
    const gh = encodeGeohash(0, 0, 1);
    expect(gh).toBe('s');
  });

  it('throws for invalid latitude', () => {
    expect(() => encodeGeohash(100, 0, 5)).toThrow();
  });

  it('throws for invalid longitude', () => {
    expect(() => encodeGeohash(0, 200, 5)).toThrow();
  });

  it('throws for out-of-range precision', () => {
    expect(() => encodeGeohash(0, 0, 0)).toThrow();
    expect(() => encodeGeohash(0, 0, 13)).toThrow();
  });
});

describe('decodeGeohash', () => {
  it('decodes and returns lat near Paris', () => {
    const result = decodeGeohash('u09tvw');
    expect(result.lat).toBeGreaterThan(48);
    expect(result.lat).toBeLessThan(50);
    expect(result.lon).toBeGreaterThan(2);
    expect(result.lon).toBeLessThan(3);
  });

  it('returns a bbox with correct ordering', () => {
    const { bbox } = decodeGeohash('u09tvy');
    expect(bbox.minLat).toBeLessThan(bbox.maxLat);
    expect(bbox.minLon).toBeLessThan(bbox.maxLon);
  });

  it('throws for invalid characters', () => {
    expect(() => decodeGeohash('abcd!')).toThrow();
  });

  it('throws for empty string', () => {
    expect(() => decodeGeohash('')).toThrow();
  });

  it('round-trips encode/decode within error bounds', () => {
    const lat = 37.7749, lon = -122.4194;
    const gh = encodeGeohash(lat, lon, 7);
    const decoded = decodeGeohash(gh);
    expect(Math.abs(decoded.lat - lat)).toBeLessThan(decoded.latErr * 2);
    expect(Math.abs(decoded.lon - lon)).toBeLessThan(decoded.lonErr * 2);
  });
});

describe('processGeohashInput', () => {
  it('accepts lat/lon and returns geohash table', () => {
    const result = processGeohashInput('48.8566, 2.3522');
    expect(result).toContain('Precision');
    expect(result).toContain('Best (precision 9)');
  });

  it('accepts geohash and returns decoded info', () => {
    const result = processGeohashInput('u09tvy');
    expect(result).toContain('Decoded center');
    expect(result).toContain('Bounding box');
  });

  it('returns empty for empty input', () => {
    expect(processGeohashInput('')).toBe('');
  });

  it('throws for nonsense input', () => {
    expect(() => processGeohashInput('hello world foo bar baz')).toThrow();
  });
});
