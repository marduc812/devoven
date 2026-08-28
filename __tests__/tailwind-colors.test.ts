import {
  findClosestTailwindColors,
  formatTailwindColors,
  normalizeHex,
  familyShades,
  hexToRgb,
  TAILWIND_COLORS,
  TAILWIND_FAMILIES,
  MAX_DISTANCE,
} from '@/Components/Functions/TailwindColorTools/logic';

describe('findClosestTailwindColors', () => {
  it('finds exact match for a Tailwind color', () => {
    const results = findClosestTailwindColors('#ef4444'); // red-500
    expect(results[0].name).toBe('red-500');
    expect(results[0].distance).toBe(0);
  });
  it('returns top 5 by default', () => {
    expect(findClosestTailwindColors('#ff0000')).toHaveLength(5);
  });
  it('first result is closest to pure red', () => {
    const results = findClosestTailwindColors('#ff0000');
    expect(results[0].name).toContain('red');
  });
  it('finds white', () => {
    const results = findClosestTailwindColors('#ffffff');
    expect(results[0].name).toBe('white');
  });
  it('finds black', () => {
    const results = findClosestTailwindColors('#000000');
    expect(results[0].name).toBe('black');
  });
  it('throws for invalid hex', () => expect(() => findClosestTailwindColors('invalid')).toThrow());
});

describe('formatTailwindColors', () => {
  it('includes Closest Tailwind Colors header', () => {
    expect(formatTailwindColors('#3b82f6')).toContain('Closest Tailwind Colors');
  });
  it('includes Usage section', () => {
    expect(formatTailwindColors('#3b82f6')).toContain('Usage');
  });
  it('includes class examples', () => {
    const r = formatTailwindColors('#3b82f6');
    expect(r).toContain('bg-');
  });
});

describe('TAILWIND_COLORS', () => {
  it('covers all 22 v3 families', () => expect(TAILWIND_FAMILIES).toHaveLength(22));
  it('carries 22 families x 11 shades plus white and black', () =>
    expect(TAILWIND_COLORS).toHaveLength(22 * 11 + 2));
  it('every entry is a 6 digit hex', () => {
    for (const c of TAILWIND_COLORS) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('has no duplicate names', () => {
    const names = TAILWIND_COLORS.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
  it('finds families the old shortlist was missing', () => {
    expect(findClosestTailwindColors('#10b981')[0].name).toBe('emerald-500');
    expect(findClosestTailwindColors('#0ea5e9')[0].name).toBe('sky-500');
    expect(findClosestTailwindColors('#a855f7')[0].name).toBe('purple-500');
  });
  it('includes the 950 shades added in v3.3', () => {
    expect(findClosestTailwindColors('#020617')[0].name).toBe('slate-950');
  });
});

describe('normalizeHex', () => {
  it('accepts a bare 6 digit hex', () => expect(normalizeHex('3b82f6')).toBe('#3b82f6'));
  it('accepts a leading hash', () => expect(normalizeHex('#3B82F6')).toBe('#3b82f6'));
  it('expands 3 digit shorthand', () => expect(normalizeHex('#38f')).toBe('#3388ff'));
  it('trims surrounding space', () => expect(normalizeHex('  #fff  ')).toBe('#ffffff'));
  it('throws on a 4 digit value', () => expect(() => normalizeHex('#abcd')).toThrow());
  it('throws on non-hex characters', () => expect(() => normalizeHex('#gggggg')).toThrow());
  it('throws on an empty string', () => expect(() => normalizeHex('')).toThrow());
});

describe('familyShades', () => {
  it('returns 11 shades in palette order', () => {
    const shades = familyShades('blue');
    expect(shades).toHaveLength(11);
    expect(shades[0].name).toBe('blue-50');
    expect(shades[10].name).toBe('blue-950');
  });
  it('does not leak other families', () => {
    for (const s of familyShades('red')) expect(s.name.startsWith('red-')).toBe(true);
  });
  it('returns nothing for an unknown family', () => expect(familyShades('burgundy')).toHaveLength(0));
});

describe('hexToRgb', () => {
  it('reads a 6 digit hex', () => expect(hexToRgb('#3b82f6')).toEqual([59, 130, 246]));
  it('reads shorthand', () => expect(hexToRgb('#fff')).toEqual([255, 255, 255]));
  it('throws on a bad length', () => expect(() => hexToRgb('#12345')).toThrow());
});

describe('MAX_DISTANCE', () => {
  it('is the black to white diagonal', () => expect(MAX_DISTANCE).toBeCloseTo(441.67, 1));
  it('bounds every match distance', () => {
    for (const m of findClosestTailwindColors('#123456', 20)) {
      expect(m.distance).toBeLessThanOrEqual(MAX_DISTANCE);
    }
  });
});
