import { julianDay, computeSolar, moonPhase, parseAstroInput, computeAstronomy } from '@/Components/Functions/AstronomyTools/logic';

describe('julianDay', () => {
  it('returns correct JD for J2000.0 epoch (Jan 1.5, 2000)', () => {
    // JD of Jan 1, 2000 noon = 2451545.0
    const jd = julianDay(2000, 1, 1);
    // Our function returns the JD for start of day (midnight), so 2451544.5
    expect(jd).toBeCloseTo(2451544.5, 0);
  });

  it('returns increasing JD for consecutive days', () => {
    const jd1 = julianDay(2025, 6, 21);
    const jd2 = julianDay(2025, 6, 22);
    expect(jd2 - jd1).toBeCloseTo(1, 5);
  });
});

describe('computeSolar', () => {
  it('London summer solstice has long day', () => {
    const r = computeSolar(2025, 6, 21, 51.5, -0.1);
    expect(r.sunrise).not.toBe('—');
    expect(r.sunset).not.toBe('—');
    // Day length should be > 16 hours
    const [h] = r.dayLength.split('h').map(Number);
    expect(h).toBeGreaterThanOrEqual(16);
  });

  it('London winter solstice has short day', () => {
    const r = computeSolar(2025, 12, 21, 51.5, -0.1);
    const [h] = r.dayLength.split('h').map(Number);
    expect(h).toBeLessThan(9);
  });

  it('equinox near equator has ~12h day', () => {
    const r = computeSolar(2025, 3, 20, 0, 0);
    const [h] = r.dayLength.split('h').map(Number);
    expect(h).toBeGreaterThanOrEqual(11);
    expect(h).toBeLessThanOrEqual(13);
  });

  it('polar day returns polar condition string', () => {
    // Arctic summer: lat=89, summer solstice
    const r = computeSolar(2025, 6, 21, 89, 0);
    expect(r.polarCondition).not.toBeNull();
    expect(r.polarCondition).toContain('sun');
  });
});

describe('moonPhase', () => {
  it('returns age between 0 and 29.53', () => {
    const r = moonPhase(2025, 1, 1);
    expect(r.age).toBeGreaterThanOrEqual(0);
    expect(r.age).toBeLessThan(29.54);
  });

  it('returns illumination between 0 and 100', () => {
    const r = moonPhase(2025, 6, 11); // known full moon
    expect(r.illumination).toBeGreaterThanOrEqual(0);
    expect(r.illumination).toBeLessThanOrEqual(100);
  });

  it('returns a non-empty phase name', () => {
    const r = moonPhase(2025, 3, 15);
    expect(r.phaseName.length).toBeGreaterThan(0);
  });

  it('full moon has high illumination', () => {
    // Jan 13, 2025 is a full moon
    const r = moonPhase(2025, 1, 13);
    expect(r.illumination).toBeGreaterThan(85);
  });
});

describe('parseAstroInput', () => {
  it('parses valid input', () => {
    const r = parseAstroInput('2025-06-21 51.5, -0.1');
    expect(r.year).toBe(2025);
    expect(r.month).toBe(6);
    expect(r.day).toBe(21);
    expect(r.lat).toBeCloseTo(51.5, 2);
    expect(r.lon).toBeCloseTo(-0.1, 2);
  });

  it('throws for bad format', () => {
    expect(() => parseAstroInput('21-06-2025 London')).toThrow();
  });

  it('throws for out-of-range lat', () => {
    expect(() => parseAstroInput('2025-06-21 95.0, 0.0')).toThrow();
  });
});

describe('computeAstronomy', () => {
  it('returns solar and moon sections', () => {
    const r = computeAstronomy('2025-06-21 51.5, -0.1');
    expect(r).toContain('Solar');
    expect(r).toContain('Moon');
    expect(r).toContain('Sunrise');
  });

  it('returns empty for empty input', () => {
    expect(computeAstronomy('')).toBe('');
  });
});
