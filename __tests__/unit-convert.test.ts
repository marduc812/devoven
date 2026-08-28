import { parseInput, convertUnit, convertUnitToText } from '@/Components/Functions/UnitConvertTools/logic';

describe('parseInput', () => {
  it('parses "100 mph"', () => {
    const r = parseInput('100 mph');
    expect(r.value).toBe(100);
    expect(r.unitRaw).toBe('mph');
  });

  it('parses "30celsius" (no space)', () => {
    const r = parseInput('30celsius');
    expect(r.value).toBe(30);
    expect(r.unitRaw).toBe('celsius');
  });

  it('parses negative value', () => {
    const r = parseInput('-40 F');
    expect(r.value).toBe(-40);
    expect(r.unitRaw).toBe('F');
  });

  it('throws for missing unit', () => {
    expect(() => parseInput('100')).toThrow();
  });

  it('throws for non-numeric', () => {
    expect(() => parseInput('abc km')).toThrow();
  });
});

describe('convertUnit - length', () => {
  it('converts km to miles', () => {
    const r = convertUnit('1 km');
    expect(r.category).toBe('length');
    const mile = r.rows.find(row => row.unit === 'mi');
    expect(mile).toBeDefined();
    expect(mile!.value).toBeCloseTo(0.621371, 4);
  });

  it('converts feet to metres', () => {
    const r = convertUnit('1 ft');
    const m = r.rows.find(row => row.unit === 'm');
    expect(m!.value).toBeCloseTo(0.3048, 4);
  });
});

describe('convertUnit - mass', () => {
  it('converts 1 kg to grams', () => {
    const r = convertUnit('1 kg');
    expect(r.category).toBe('mass');
    const g = r.rows.find(row => row.unit === 'g');
    expect(g!.value).toBeCloseTo(1000, 0);
  });

  it('converts 1 lb to kg', () => {
    const r = convertUnit('1 lb');
    const kg = r.rows.find(row => row.unit === 'kg');
    expect(kg!.value).toBeCloseTo(0.453592, 4);
  });
});

describe('convertUnit - temperature', () => {
  it('converts 100°C to Fahrenheit', () => {
    const r = convertUnit('100 C');
    expect(r.category).toBe('temperature');
    const f = r.rows.find(row => row.unit === 'F');
    expect(f!.value).toBeCloseTo(212, 1);
  });

  it('-40 C equals -40 F', () => {
    const r = convertUnit('-40 celsius');
    const f = r.rows.find(row => row.unit === 'F');
    expect(f!.value).toBeCloseTo(-40, 1);
  });

  it('0 K converts to -273.15 C', () => {
    const r = convertUnit('0 K');
    const c = r.rows.find(row => row.unit === 'C');
    expect(c!.value).toBeCloseTo(-273.15, 1);
  });
});

describe('convertUnit - speed', () => {
  it('converts 100 km/h', () => {
    const r = convertUnit('100 km/h');
    expect(r.category).toBe('speed');
    const mph = r.rows.find(row => row.unit === 'mph');
    expect(mph!.value).toBeCloseTo(62.137, 1);
  });
});

describe('convertUnit - pressure', () => {
  it('converts 1 atm to Pa', () => {
    const r = convertUnit('1 atm');
    expect(r.category).toBe('pressure');
    const pa = r.rows.find(row => row.unit === 'Pa');
    expect(pa!.value).toBeCloseTo(101325, 0);
  });
});

describe('convertUnit - energy', () => {
  it('converts 1 kWh to joules', () => {
    const r = convertUnit('1 kWh');
    expect(r.category).toBe('energy');
    const j = r.rows.find(row => row.unit === 'J');
    expect(j!.value).toBeCloseTo(3600000, 0);
  });
});

describe('convertUnit - power', () => {
  it('converts 1 hp to watts', () => {
    const r = convertUnit('1 hp');
    expect(r.category).toBe('power');
    const w = r.rows.find(row => row.unit === 'W');
    expect(w!.value).toBeCloseTo(745.7, 0);
  });
});

describe('convertUnit - errors', () => {
  it('throws for unknown unit', () => {
    expect(() => convertUnit('100 foobar')).toThrow();
  });

  it('throws for empty string', () => {
    expect(() => convertUnit('')).toThrow();
  });
});

describe('convertUnitToText', () => {
  it('returns multi-line string with category', () => {
    const s = convertUnitToText('100 mph');
    expect(s).toContain('Category: Speed');
    expect(s).toContain('Conversions:');
  });
});
