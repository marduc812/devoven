import {
  compassPoint,
  initialBearing,
  latError,
  lonError,
  parseCoord,
  parseCoordPair,
  toDms,
} from '@/Components/Functions/HaversineTools/logic';

describe('initialBearing', () => {
  it('heads due north for a point directly above', () => {
    expect(initialBearing(0, 0, 10, 0)).toBeCloseTo(0, 6);
  });
  it('heads due south for a point directly below', () => {
    expect(initialBearing(10, 0, 0, 0)).toBeCloseTo(180, 6);
  });
  it('heads due east along the equator', () => {
    expect(initialBearing(0, 0, 0, 10)).toBeCloseTo(90, 6);
  });
  it('heads due west along the equator', () => {
    expect(initialBearing(0, 0, 0, -10)).toBeCloseTo(270, 6);
  });
  it('London to Paris is roughly south-east', () => {
    const b = initialBearing(51.5074, -0.1278, 48.8566, 2.3522);
    expect(b).toBeGreaterThan(140);
    expect(b).toBeLessThan(160);
  });
  it('always returns a bearing in [0, 360)', () => {
    const b = initialBearing(-33.8688, 151.2093, -33.9249, 18.4241);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('compassPoint', () => {
  it('maps the cardinals', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(180)).toBe('S');
    expect(compassPoint(270)).toBe('W');
  });
  it('maps the intercardinals', () => {
    expect(compassPoint(45)).toBe('NE');
    expect(compassPoint(225)).toBe('SW');
  });
  it('wraps 360 back to north', () => {
    expect(compassPoint(360)).toBe('N');
    expect(compassPoint(359)).toBe('N');
  });
});

describe('parseCoord', () => {
  it('parses a comma-separated pair', () => {
    expect(parseCoord('51.5074,-0.1278')).toEqual({ lat: 51.5074, lon: -0.1278 });
  });
  it('parses a space-separated pair', () => {
    expect(parseCoord('  51.5074   -0.1278 ')).toEqual({ lat: 51.5074, lon: -0.1278 });
  });
  it('returns null for junk', () => {
    expect(parseCoord('somewhere near London')).toBeNull();
    expect(parseCoord('51.5074')).toBeNull();
    expect(parseCoord('')).toBeNull();
  });
});

describe('parseCoordPair', () => {
  it('reads two lines', () => {
    expect(parseCoordPair('51.5074,-0.1278\n48.8566,2.3522')).toEqual([
      { lat: 51.5074, lon: -0.1278 },
      { lat: 48.8566, lon: 2.3522 },
    ]);
  });
  it('skips blank lines between the points', () => {
    expect(parseCoordPair('0,0\n\n\n1,1')).toEqual([{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }]);
  });
  it('returns null with fewer than two points', () => {
    expect(parseCoordPair('51.5074,-0.1278')).toBeNull();
    expect(parseCoordPair('')).toBeNull();
  });
  it('returns null when a line does not parse', () => {
    expect(parseCoordPair('51.5074,-0.1278\nnot a coordinate')).toBeNull();
  });
});

describe('coordinate validation', () => {
  it('accepts in-range values', () => {
    expect(latError(51.5)).toBe('');
    expect(latError(-90)).toBe('');
    expect(lonError(-180)).toBe('');
    expect(lonError(180)).toBe('');
  });
  it('rejects out-of-range latitude', () => {
    expect(latError(91)).not.toBe('');
    expect(latError(-91)).not.toBe('');
  });
  it('rejects out-of-range longitude', () => {
    expect(lonError(181)).not.toBe('');
    expect(lonError(-181)).not.toBe('');
  });
  it('rejects NaN', () => {
    expect(latError(NaN)).not.toBe('');
    expect(lonError(NaN)).not.toBe('');
  });
});

describe('toDms', () => {
  it('formats a northern latitude', () => {
    expect(toDms(51.5074, 'lat')).toBe(`51°30'26.6"N`);
  });
  it('formats a western longitude', () => {
    expect(toDms(-0.1278, 'lon')).toBe(`0°7'40.1"W`);
  });
  it('uses S and E on the other hemispheres', () => {
    expect(toDms(-33.8688, 'lat')).toContain('S');
    expect(toDms(151.2093, 'lon')).toContain('E');
  });
  it('treats zero as the positive hemisphere', () => {
    expect(toDms(0, 'lat')).toBe(`0°0'0.0"N`);
    expect(toDms(0, 'lon')).toBe(`0°0'0.0"E`);
  });
});
