import {
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  generateShades,
  formatShadesOutput,
  SHADE_STEPS,
} from '@/Components/Functions/TailwindShadesTools/logic';

describe('hexToRgb', () => {
  it('converts white', () => expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 }));
  it('converts black', () => expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 }));
  it('converts a blue', () => {
    const rgb = hexToRgb('#3b82f6');
    expect(rgb.r).toBe(59);
    expect(rgb.g).toBe(130);
    expect(rgb.b).toBe(246);
  });
  it('handles without hash', () => {
    const rgb = hexToRgb('ff0000');
    expect(rgb.r).toBe(255);
  });
  it('throws on invalid hex', () => expect(() => hexToRgb('#gg0000')).toThrow());
  it('throws on short hex', () => expect(() => hexToRgb('#fff')).toThrow());
});

describe('rgbToHsl / hslToRgb roundtrip', () => {
  it('roundtrips red', () => {
    const rgb = { r: 255, g: 0, b: 0 };
    const hsl = rgbToHsl(rgb);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
    const back = hslToRgb(hsl);
    expect(back.r).toBe(255);
    expect(back.g).toBe(0);
    expect(back.b).toBe(0);
  });

  it('roundtrips gray (achromatic)', () => {
    const rgb = { r: 128, g: 128, b: 128 };
    const hsl = rgbToHsl(rgb);
    expect(hsl.s).toBe(0);
    const back = hslToRgb(hsl);
    expect(back.r).toBeCloseTo(128, -1);
  });
});

describe('rgbToHex', () => {
  it('converts white', () => expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff'));
  it('converts black', () => expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000'));
  it('clamps over 255', () => expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000'));
});

describe('generateShades', () => {
  it('returns 11 shade entries', () => {
    const shades = generateShades('#3b82f6');
    expect(shades.length).toBe(11);
  });

  it('shade steps match expected', () => {
    const shades = generateShades('#3b82f6');
    const steps = shades.map(s => s.step);
    expect(steps).toEqual(SHADE_STEPS);
  });

  it('shade 50 is lighter than shade 900', () => {
    const shades = generateShades('#3b82f6');
    const s50 = shades.find(s => s.step === 50)!;
    const s900 = shades.find(s => s.step === 900)!;
    expect(s50.hsl.l).toBeGreaterThan(s900.hsl.l);
  });

  it('preserves hue across shades', () => {
    const shades = generateShades('#3b82f6');
    const baseHue = shades[5].hsl.h; // 500 is closest to base
    for (const s of shades) {
      expect(s.hsl.h).toBe(baseHue);
    }
  });

  it('all hex values are valid 7-char strings', () => {
    const shades = generateShades('#e11d48');
    for (const s of shades) {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('throws on invalid hex', () => {
    expect(() => generateShades('#xyz')).toThrow();
  });
});

describe('formatShadesOutput', () => {
  it('includes CSS custom properties block', () => {
    const output = formatShadesOutput('blue', '#3b82f6');
    expect(output).toContain(':root {');
    expect(output).toContain('--color-blue-');
  });

  it('includes tailwind config snippet', () => {
    const output = formatShadesOutput('blue', '#3b82f6');
    expect(output).toContain("module.exports");
    expect(output).toContain("'blue'");
  });

  it('includes all 11 shade steps in output', () => {
    const output = formatShadesOutput('custom', '#3b82f6');
    for (const step of SHADE_STEPS) {
      expect(output).toContain(String(step));
    }
  });
});
