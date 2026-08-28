import {
  decode4Band, decode5Band, decodeColorBands,
  findESeries, resistanceToBands4, BAND_DIGITS,
} from '@/Components/Functions/ResistorColorTools/logic';

describe('decode4Band', () => {
  it('decodes red red brown gold = 220Ω ±5%', () => {
    const r = decode4Band(['red', 'red', 'brown', 'gold']);
    expect(r.resistance).toBeCloseTo(220);
    expect(r.tolerance).toBe('±5%');
  });
  it('decodes brown black orange gold = 10kΩ', () => {
    const r = decode4Band(['brown', 'black', 'orange', 'gold']);
    expect(r.resistance).toBeCloseTo(10000);
  });
  it('decodes yellow violet brown gold = 470Ω', () => {
    const r = decode4Band(['yellow', 'violet', 'brown', 'gold']);
    expect(r.resistance).toBeCloseTo(470);
  });
  it('throws on wrong band count', () => {
    expect(() => decode4Band(['red', 'red', 'brown'])).toThrow();
  });
  it('throws on unknown color', () => {
    expect(() => decode4Band(['pink', 'red', 'brown', 'gold'])).toThrow();
  });
});

describe('decode5Band', () => {
  it('decodes brown black black brown brown = 1kΩ ±1%', () => {
    const r = decode5Band(['brown', 'black', 'black', 'brown', 'brown']);
    expect(r.resistance).toBeCloseTo(1000);
    expect(r.tolerance).toBe('±1%');
  });
  it('throws on wrong band count', () => {
    expect(() => decode5Band(['red', 'red', 'brown', 'gold'])).toThrow();
  });
});

describe('decodeColorBands', () => {
  it('handles comma-separated input (4 bands)', () => {
    const r = decodeColorBands('red, red, brown, gold');
    expect(r.resistance).toBeCloseTo(220);
  });
  it('handles 5 bands', () => {
    const r = decodeColorBands('brown, black, black, brown, brown');
    expect(r.resistance).toBeCloseTo(1000);
  });
  it('throws on empty input', () => {
    expect(() => decodeColorBands('')).toThrow();
  });
  it('throws on wrong count', () => {
    expect(() => decodeColorBands('red, red')).toThrow();
  });
});

describe('findESeries', () => {
  it('returns a string with E12, E24, E96', () => {
    const r = findESeries(4700);
    expect(r).toContain('E12');
    expect(r).toContain('E24');
    expect(r).toContain('E96');
  });
  it('returns N/A for 0', () => {
    expect(findESeries(0)).toBe('N/A');
  });
});

describe('resistanceToBands4', () => {
  it('returns 4 bands for 470Ω', () => {
    const bands = resistanceToBands4(470);
    expect(bands).not.toBeNull();
    expect(bands!.length).toBe(4);
    expect(bands![0]).toBe('yellow');
    expect(bands![1]).toBe('violet');
  });
  it('returns null for negative', () => {
    expect(resistanceToBands4(-10)).toBeNull();
  });
  it('last band is gold (tolerance)', () => {
    const bands = resistanceToBands4(1000);
    expect(bands).not.toBeNull();
    expect(bands![3]).toBe('gold');
  });
});

describe('BAND_DIGITS', () => {
  it('black is 0', () => expect(BAND_DIGITS['black']).toBe(0));
  it('white is 9', () => expect(BAND_DIGITS['white']).toBe(9));
});
