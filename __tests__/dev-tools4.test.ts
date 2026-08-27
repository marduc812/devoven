import {
  validateUuid,
  formatUuidInfo,
  calculateAge,
  getZodiacSign,
  boxShadowToCSS,
  cssPropertyBoxShadow,
  parseBoxShadow,
  borderRadiusToCSS,
  borderRadiusShorthand,
  type BoxShadowLayer,
  type BorderRadius,
} from '@/Components/Functions/DevTools4/logic';

describe('validateUuid', () => {
  it('validates v4 UUID', () => {
    const r = validateUuid('550e8400-e29b-41d4-a716-446655440000');
    expect(r.valid).toBe(true);
    expect(r.version).toBe(4);
  });
  it('accepts UUID without dashes', () => {
    expect(validateUuid('550e8400e29b41d4a716446655440000').valid).toBe(true);
  });
  it('rejects invalid', () => expect(validateUuid('not-a-uuid').valid).toBe(false));
  it('strips curly braces', () => {
    expect(validateUuid('{550e8400-e29b-41d4-a716-446655440000}').valid).toBe(true);
  });
  it('detects version 1', () => {
    expect(validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8').version).toBe(1);
  });
});

describe('formatUuidInfo', () => {
  it('returns Invalid UUID for invalid input', () => {
    expect(formatUuidInfo({ valid: false })).toBe('Invalid UUID');
  });
  it('formats valid UUID info', () => {
    const info = validateUuid('550e8400-e29b-41d4-a716-446655440000');
    const result = formatUuidInfo(info);
    expect(result).toContain('Valid:     Yes');
    expect(result).toContain('Version:   4');
  });
});

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const r = calculateAge('2000-01-01', new Date('2026-04-09'));
    expect(r.years).toBe(26);
  });
  it('calculates zodiac sign', () => {
    expect(calculateAge('1990-07-15', new Date('2026-01-01')).zodiacSign).toBe('Cancer');
  });
  it('throws on invalid date', () => expect(() => calculateAge('not-a-date')).toThrow());
  it('calculates total days', () => {
    const r = calculateAge('2000-01-01', new Date('2000-01-11'));
    expect(r.totalDays).toBe(10);
  });
  it('calculates next birthday is in the future', () => {
    const r = calculateAge('1990-12-25', new Date('2026-04-09'));
    expect(r.daysUntilBirthday).toBeGreaterThan(0);
  });
});

describe('getZodiacSign', () => {
  it('returns Cancer for July 15', () => {
    expect(getZodiacSign(7, 15)).toBe('Cancer');
  });
  it('returns Capricorn for January 1', () => {
    expect(getZodiacSign(1, 1)).toBe('Capricorn');
  });
  it('returns Aries for March 21', () => {
    expect(getZodiacSign(3, 21)).toBe('Aries');
  });
});

describe('boxShadowToCSS', () => {
  it('returns none for empty layers', () => {
    expect(boxShadowToCSS([])).toBe('none');
  });
  it('generates box shadow CSS', () => {
    const layer: BoxShadowLayer = { offsetX: 2, offsetY: 4, blur: 6, spread: 0, color: '#000', inset: false };
    expect(boxShadowToCSS([layer])).toBe('2px 4px 6px 0px #000');
  });
  it('includes inset keyword', () => {
    const layer: BoxShadowLayer = { offsetX: 0, offsetY: 0, blur: 10, spread: 0, color: 'red', inset: true };
    expect(boxShadowToCSS([layer])).toContain('inset');
  });
  it('joins multiple layers with comma', () => {
    const layer1: BoxShadowLayer = { offsetX: 1, offsetY: 1, blur: 1, spread: 0, color: '#000', inset: false };
    const layer2: BoxShadowLayer = { offsetX: 2, offsetY: 2, blur: 2, spread: 0, color: '#fff', inset: false };
    expect(boxShadowToCSS([layer1, layer2])).toContain(',');
  });
  it('cssPropertyBoxShadow wraps with property name', () => {
    const layer: BoxShadowLayer = { offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: 'transparent', inset: false };
    expect(cssPropertyBoxShadow([layer])).toMatch(/^box-shadow:/);
  });
});

describe('parseBoxShadow', () => {
  it('returns empty for "none"', () => {
    expect(parseBoxShadow('none')).toHaveLength(0);
  });
  it('returns empty for empty string', () => {
    expect(parseBoxShadow('')).toHaveLength(0);
  });
  it('parses a simple shadow', () => {
    const result = parseBoxShadow('2px 4px 6px 0px #000');
    expect(result).toHaveLength(1);
    expect(result[0].offsetX).toBe(2);
    expect(result[0].offsetY).toBe(4);
  });
});

describe('borderRadiusToCSS', () => {
  it('generates shorthand for equal corners', () => {
    const r: BorderRadius = { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8, unit: 'px' };
    expect(borderRadiusToCSS(r)).toBe('border-radius: 8px;');
  });
  it('generates four-value syntax for unequal corners', () => {
    const r: BorderRadius = { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16, unit: 'px' };
    expect(borderRadiusToCSS(r)).toBe('border-radius: 4px 8px 12px 16px;');
  });
  it('supports percent units', () => {
    const r: BorderRadius = { topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50, unit: '%' };
    expect(borderRadiusToCSS(r)).toBe('border-radius: 50%;');
  });
  it('borderRadiusShorthand returns values string', () => {
    const r: BorderRadius = { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16, unit: 'px' };
    expect(borderRadiusShorthand(r)).toBe('4px 8px 12px 16px');
  });
});
