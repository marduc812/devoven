import {
  parseHex,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  hslToRgb,
  complementaryColor,
  generateShades,
  generateTints,
  analyzeColor,
  formatColorAnalysis,
  tailwindHint,
} from '@/Components/Functions/ColorPickerTools/logic';

describe('parseHex', () => {
  it('parses 6-char hex', () => {
    expect(parseHex('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });
  it('parses 3-char hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('parses without hash', () => {
    expect(parseHex('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('throws on invalid hex', () => {
    expect(() => parseHex('zzzzzz')).toThrow();
  });
  it('throws on empty string', () => {
    expect(() => parseHex('')).toThrow();
  });
});

describe('rgbToHex', () => {
  it('converts white', () => expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff'));
  it('converts black', () => expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000'));
  it('converts red', () => expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000'));
});

describe('rgbToHsl', () => {
  it('converts red to hsl', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });
  it('converts white to hsl', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });
});

describe('rgbToHsv', () => {
  it('converts red', () => {
    const hsv = rgbToHsv({ r: 255, g: 0, b: 0 });
    expect(hsv.h).toBe(0);
    expect(hsv.s).toBe(100);
    expect(hsv.v).toBe(100);
  });
  it('converts black', () => {
    const hsv = rgbToHsv({ r: 0, g: 0, b: 0 });
    expect(hsv.v).toBe(0);
  });
});

describe('rgbToCmyk', () => {
  it('converts white', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });
  it('converts black', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
  it('converts red', () => {
    const cmyk = rgbToCmyk({ r: 255, g: 0, b: 0 });
    expect(cmyk.k).toBe(0);
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(100);
    expect(cmyk.y).toBe(100);
  });
});

describe('hslToRgb', () => {
  it('converts (0, 100%, 50%) to red', () => {
    const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });
  it('converts gray', () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(rgb.r).toBe(rgb.g);
    expect(rgb.g).toBe(rgb.b);
  });
});

describe('complementaryColor', () => {
  it('returns complementary of red as cyan', () => {
    const comp = complementaryColor('#ff0000');
    expect(comp).toBe('#00ffff');
  });
  it('result is a valid hex', () => {
    const comp = complementaryColor('#3b82f6');
    expect(comp).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('generateShades', () => {
  it('returns correct number of shades', () => {
    expect(generateShades('#3b82f6', 5).length).toBe(5);
  });
  it('shades are valid hex strings', () => {
    generateShades('#3b82f6', 3).forEach(s => expect(s).toMatch(/^#[0-9a-f]{6}$/));
  });
});

describe('generateTints', () => {
  it('returns correct number of tints', () => {
    expect(generateTints('#3b82f6', 5).length).toBe(5);
  });
});

describe('tailwindHint', () => {
  it('returns a string for blue color', () => {
    const hint = tailwindHint({ h: 217, s: 91, l: 60 });
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
  it('returns gray for low saturation', () => {
    const hint = tailwindHint({ h: 0, s: 5, l: 50 });
    expect(hint).toContain('gray');
  });
});

describe('analyzeColor', () => {
  it('returns all fields for #3b82f6', () => {
    const analysis = analyzeColor('#3b82f6');
    expect(analysis.hex).toBe('#3b82f6');
    expect(analysis.rgb).toEqual({ r: 59, g: 130, b: 246 });
    expect(analysis.complementary).toMatch(/^#[0-9a-f]{6}$/);
    expect(analysis.shades).toHaveLength(5);
    expect(analysis.tints).toHaveLength(5);
    expect(analysis.cssVariable).toContain('--color-primary');
  });
  it('throws on invalid hex', () => {
    expect(() => analyzeColor('not-a-color')).toThrow();
  });
});

describe('formatColorAnalysis', () => {
  it('contains HEX, RGB, HSL in output', () => {
    const analysis = analyzeColor('#ff0000');
    const text = formatColorAnalysis(analysis);
    expect(text).toContain('HEX:');
    expect(text).toContain('RGB:');
    expect(text).toContain('HSL:');
    expect(text).toContain('CMYK:');
    expect(text).toContain('Complementary:');
  });
});
