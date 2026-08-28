import { parseGpsInput, toDD, toDMS, toDDM, convertGpsCoords } from '@/Components/Functions/GpsCoordsTools/logic';

describe('parseGpsInput', () => {
  it('parses decimal degrees with N/E', () => {
    const r = parseGpsInput('48.8566°N, 2.3522°E');
    expect(r.lat).toBeCloseTo(48.8566, 3);
    expect(r.lon).toBeCloseTo(2.3522, 3);
  });

  it('parses plain decimal with comma', () => {
    const r = parseGpsInput('51.5074, -0.1278');
    expect(r.lat).toBeCloseTo(51.5074, 3);
    expect(r.lon).toBeCloseTo(-0.1278, 3);
  });

  it('parses DMS format', () => {
    const r = parseGpsInput("48°51'24\"N, 2°21'8\"E");
    expect(r.lat).toBeGreaterThan(48);
    expect(r.lat).toBeLessThan(49);
    expect(r.lon).toBeGreaterThan(2);
  });

  it('parses DDM format', () => {
    const r = parseGpsInput("48°51.4'N, 2°21.1'E");
    expect(r.lat).toBeGreaterThan(48);
    expect(r.lon).toBeGreaterThan(2);
  });

  it('handles southern and western hemispheres', () => {
    const r = parseGpsInput('-33.8688, 151.2093');
    expect(r.lat).toBeCloseTo(-33.8688, 3);
    expect(r.lon).toBeCloseTo(151.2093, 3);
  });

  it('throws for empty input', () => {
    expect(() => parseGpsInput('')).toThrow();
  });

  it('throws for out-of-range latitude', () => {
    expect(() => parseGpsInput('95.0, 0.0')).toThrow();
  });
});

describe('toDD', () => {
  it('formats positive lat/lon', () => {
    const s = toDD(48.8566, 2.3522);
    expect(s).toContain('N');
    expect(s).toContain('E');
    expect(s).toContain('48.856600');
  });

  it('formats negative (south/west)', () => {
    const s = toDD(-33.8688, -70.6693);
    expect(s).toContain('S');
    expect(s).toContain('W');
  });
});

describe('toDMS', () => {
  it('produces degrees, minutes, seconds', () => {
    const s = toDMS(48.8566, 2.3522);
    expect(s).toContain('°');
    expect(s).toContain("'");
    expect(s).toContain('"');
    expect(s).toContain('N');
  });
});

describe('toDDM', () => {
  it('produces degrees and decimal minutes', () => {
    const s = toDDM(48.8566, 2.3522);
    expect(s).toContain('°');
    expect(s).toContain("'");
    expect(s).toContain('N');
  });
});

describe('convertGpsCoords', () => {
  it('returns all format sections', () => {
    const r = convertGpsCoords('48.8566, 2.3522');
    expect(r).toContain('Decimal Degrees');
    expect(r).toContain('Degrees Minutes Seconds');
    expect(r).toContain('Degrees Decimal Minutes');
    expect(r).toContain('UTM');
  });
});
