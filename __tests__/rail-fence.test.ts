import { railFenceEncode, railFenceDecode, railFenceAsciiArt, processRailFence } from '@/Components/Functions/RailFenceCipherTools/logic';

describe('railFenceEncode', () => {
  it('encodes WEAREDISCOVEREDRUNATONCE with 3 rails', () => {
    // Algorithm produces: top rail, mid rail, bottom rail concatenated
    const result = railFenceEncode('WEAREDISCOVEREDRUNATONCE', 3);
    expect(result).toHaveLength(24);
    // Verify round-trip is correct
    expect(railFenceDecode(result, 3)).toBe('WEAREDISCOVEREDRUNATONCE');
  });
  it('classic example: HELLOWORLD with 3 rails', () => {
    const result = railFenceEncode('HELLOWORLD', 3);
    expect(result).toHaveLength(10);
  });
  it('2 rails alternates chars', () => {
    const result = railFenceEncode('ABCD', 2);
    expect(result).toBe('ACBD');
  });
  it('throws for rails < 2', () => {
    expect(() => railFenceEncode('test', 1)).toThrow();
  });
  it('returns text unchanged if rails >= length', () => {
    expect(railFenceEncode('AB', 5)).toBe('AB');
  });
});

describe('railFenceDecode', () => {
  it('decodes back to original', () => {
    const original = 'HELLOWORLD';
    const encoded = railFenceEncode(original, 3);
    expect(railFenceDecode(encoded, 3)).toBe(original);
  });
  it('decodes with 2 rails', () => {
    expect(railFenceDecode('ACBD', 2)).toBe('ABCD');
  });
  it('round-trips longer text', () => {
    const text = 'WEAREDISCOVEREDRUNATONCE';
    expect(railFenceDecode(railFenceEncode(text, 3), 3)).toBe(text);
  });
});

describe('railFenceAsciiArt', () => {
  it('returns correct number of rail rows', () => {
    const art = railFenceAsciiArt('HELLO', 3);
    expect(art.split('\n')).toHaveLength(3);
  });
  it('draws the zigzag with spaces for empty cells', () => {
    expect(railFenceAsciiArt('HELLO', 3).split('\n')).toEqual([
      'H   O',
      ' E L ',
      '  L  ',
    ]);
  });
  it('rows are all the same width', () => {
    const rows = railFenceAsciiArt('WEAREDISCOVERED', 4).split('\n');
    expect(new Set(rows.map(r => r.length))).toEqual(new Set([15]));
  });
  it('caps the grid at maxColumns', () => {
    const rows = railFenceAsciiArt('A'.repeat(500), 3, 40).split('\n');
    expect(rows.every(r => r.length === 40)).toBe(true);
  });
  it('returns empty for empty text', () => {
    expect(railFenceAsciiArt('', 3)).toBe('');
  });
});

describe('processRailFence', () => {
  it('returns the ciphertext alone, with no diagram appended', () => {
    const r = processRailFence('HELLO', 3, 'encode');
    expect(r).toBe(railFenceEncode('HELLO', 3));
    expect(r).not.toContain('\n');
  });
  it('decode mode reverses encode mode', () => {
    const encoded = processRailFence('WEAREDISCOVERED', 4, 'encode');
    expect(processRailFence(encoded, 4, 'decode')).toBe('WEAREDISCOVERED');
  });
  it('returns empty for empty input', () => {
    expect(processRailFence('', 3, 'encode')).toBe('');
  });
  it('propagates the rails error', () => {
    expect(() => processRailFence('HELLO', 1, 'encode')).toThrow(/at least 2/);
  });
});
