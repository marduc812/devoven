import { convertSiPrefix, parseSiPrefixConversion, SI_PREFIXES } from '@/Components/Functions/SiPrefixTools/logic';

describe('convertSiPrefix', () => {
  it('converts MHz to GHz', () => {
    expect(convertSiPrefix(1000, 6, 9)).toBeCloseTo(1);
  });
  it('converts km to m', () => {
    expect(convertSiPrefix(1, 3, 0)).toBeCloseTo(1000);
  });
  it('converts milli to micro', () => {
    expect(convertSiPrefix(1, -3, -6)).toBeCloseTo(1000);
  });
  it('same prefix returns same value', () => {
    expect(convertSiPrefix(5, 6, 6)).toBeCloseTo(5);
  });
  it('converts nano to pico', () => {
    expect(convertSiPrefix(1, -9, -12)).toBeCloseTo(1000);
  });
});

describe('SI_PREFIXES', () => {
  it('has 21 entries', () => {
    expect(SI_PREFIXES.length).toBe(21);
  });
  it('includes yotta and yocto', () => {
    expect(SI_PREFIXES.some(p => p.name === 'yotta')).toBe(true);
    expect(SI_PREFIXES.some(p => p.name === 'yocto')).toBe(true);
  });
});

describe('parseSiPrefixConversion', () => {
  it('parses 1000 MHz to GHz', () => {
    const r = parseSiPrefixConversion('1000 MHz to GHz');
    expect(r.outputValue).toBeCloseTo(1);
  });
  it('parses 1 km to mm', () => {
    const r = parseSiPrefixConversion('1 km to mm');
    expect(r.outputValue).toBeCloseTo(1_000_000);
  });
  it('throws on empty input', () => {
    expect(() => parseSiPrefixConversion('')).toThrow();
  });
  it('throws on bad format', () => {
    expect(() => parseSiPrefixConversion('hello world')).toThrow();
  });
  it('returns fromPrefix and toPrefix', () => {
    const r = parseSiPrefixConversion('500 mV to kV');
    expect(r.fromPrefix.symbol).toBe('m');
    expect(r.toPrefix.symbol).toBe('k');
  });
});
