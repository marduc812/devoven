import {
  parseHex,
  rgbToHex,
  simulateColorblindness,
  simulateAll,
  formatSimulationResults,
} from '@/Components/Functions/ColorblindTools/logic';

describe('parseHex', () => {
  it('parses 6-char hex', () => {
    expect(parseHex('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-char hex', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses without hash', () => {
    expect(parseHex('3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('throws on invalid hex', () => {
    expect(() => parseHex('zzzzzz')).toThrow();
  });
});

describe('rgbToHex', () => {
  it('converts red', () => expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000'));
  it('converts white', () => expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff'));
  it('converts black', () => expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000'));
  it('clamps values above 255', () => expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000'));
  it('clamps negative values', () => expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000'));
});

describe('simulateColorblindness', () => {
  it('returns a result with correct type', () => {
    const r = simulateColorblindness('#3b82f6', 'Protanopia');
    expect(r.type).toBe('Protanopia');
    expect(r.simulatedHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('Achromatopsia produces a gray color (R=G=B)', () => {
    const r = simulateColorblindness('#3b82f6', 'Achromatopsia');
    expect(r.simulatedRgb.r).toBe(r.simulatedRgb.g);
    expect(r.simulatedRgb.g).toBe(r.simulatedRgb.b);
  });

  it('black stays black for all types', () => {
    const types = ['Protanopia', 'Deuteranopia', 'Tritanopia', 'Achromatopsia'] as const;
    for (const type of types) {
      const r = simulateColorblindness('#000000', type);
      expect(r.simulatedHex).toBe('#000000');
    }
  });

  it('includes description and affectedPopulation', () => {
    const r = simulateColorblindness('#ff0000', 'Deuteranopia');
    expect(r.description).toBeTruthy();
    expect(r.affectedPopulation).toBeTruthy();
  });
});

describe('simulateAll', () => {
  it('returns 4 results', () => {
    const results = simulateAll('#3b82f6');
    expect(results).toHaveLength(4);
  });

  it('each result has a valid hex', () => {
    const results = simulateAll('#ff6600');
    for (const r of results) {
      expect(r.simulatedHex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('formatSimulationResults', () => {
  it('contains all type names', () => {
    const output = formatSimulationResults('#3b82f6');
    expect(output).toContain('Protanopia');
    expect(output).toContain('Deuteranopia');
    expect(output).toContain('Tritanopia');
    expect(output).toContain('Achromatopsia');
  });

  it('returns error for invalid input', () => {
    const output = formatSimulationResults('notacolor');
    expect(output).toContain('Error');
  });
});
