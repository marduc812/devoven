import {
  hexToHsl,
  hslToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsv,
  hsvToHex,
  colorNameToHex,
  hexToColorName,
  generateLinearGradientCss,
  quantizeColor,
  getTopColors,
} from '../Components/Functions/ColorTools/logic';

// ─── HEX ↔ HSL ───────────────────────────────────────────────────────────────

describe('hexToHsl', () => {
  it('converts red #FF0000 to hsl(0, 100%, 50%)', () => {
    expect(hexToHsl('#FF0000')).toBe('hsl(0, 100%, 50%)');
  });
  it('converts white #FFFFFF to hsl(0, 0%, 100%)', () => {
    expect(hexToHsl('#FFFFFF')).toBe('hsl(0, 0%, 100%)');
  });
  it('converts black #000000 to hsl(0, 0%, 0%)', () => {
    expect(hexToHsl('#000000')).toBe('hsl(0, 0%, 0%)');
  });
  it('converts #0000FF (blue) to hsl(240, 100%, 50%)', () => {
    expect(hexToHsl('#0000FF')).toBe('hsl(240, 100%, 50%)');
  });
  it('converts #00FF00 (lime) to hsl(120, 100%, 50%)', () => {
    expect(hexToHsl('#00FF00')).toBe('hsl(120, 100%, 50%)');
  });
  it('throws on invalid hex', () => {
    expect(() => hexToHsl('not-a-color')).toThrow();
  });
  it('returns empty string for empty input', () => {
    expect(hexToHsl('')).toBe('');
  });
});

describe('hslToHex', () => {
  it('converts hsl(0, 100%, 50%) to #FF0000', () => {
    expect(hslToHex('hsl(0, 100%, 50%)')).toBe('#FF0000');
  });
  it('converts hsl(240, 100%, 50%) to #0000FF', () => {
    expect(hslToHex('hsl(240, 100%, 50%)')).toBe('#0000FF');
  });
  it('converts hsl(120, 100%, 50%) to #00FF00', () => {
    expect(hslToHex('hsl(120, 100%, 50%)')).toBe('#00FF00');
  });
  it('accepts bare "0, 100, 50" format (no hsl() wrapper, no % signs)', () => {
    expect(hslToHex('0, 100, 50')).toBe('#FF0000');
  });
  it('round-trips with hexToHsl for a mid-tone', () => {
    const original = '#1A8F3C';
    const hsl = hexToHsl(original);
    const roundTripped = hslToHex(hsl);
    // Allow ±1 per channel due to rounding
    const origR = parseInt(original.slice(1, 3), 16);
    const origG = parseInt(original.slice(3, 5), 16);
    const origB = parseInt(original.slice(5, 7), 16);
    const rtR = parseInt(roundTripped.slice(1, 3), 16);
    const rtG = parseInt(roundTripped.slice(3, 5), 16);
    const rtB = parseInt(roundTripped.slice(5, 7), 16);
    expect(Math.abs(origR - rtR)).toBeLessThanOrEqual(1);
    expect(Math.abs(origG - rtG)).toBeLessThanOrEqual(1);
    expect(Math.abs(origB - rtB)).toBeLessThanOrEqual(1);
  });
  it('returns empty string for empty input', () => {
    expect(hslToHex('')).toBe('');
  });
  it('throws on invalid input', () => {
    expect(() => hslToHex('not-hsl')).toThrow();
  });
});

// ─── RGB ↔ HSL ───────────────────────────────────────────────────────────────

describe('rgbToHsl', () => {
  it('converts "rgb(255, 0, 0)" to hsl(0, 100%, 50%)', () => {
    expect(rgbToHsl('rgb(255, 0, 0)')).toBe('hsl(0, 100%, 50%)');
  });
  it('converts "255,0,0" (bare format) to hsl(0, 100%, 50%)', () => {
    expect(rgbToHsl('255,0,0')).toBe('hsl(0, 100%, 50%)');
  });
  it('converts "rgb(0, 0, 255)" to hsl(240, 100%, 50%)', () => {
    expect(rgbToHsl('rgb(0, 0, 255)')).toBe('hsl(240, 100%, 50%)');
  });
  it('converts "rgb(255, 255, 255)" to hsl(0, 0%, 100%)', () => {
    expect(rgbToHsl('rgb(255, 255, 255)')).toBe('hsl(0, 0%, 100%)');
  });
  it('converts "rgb(0, 0, 0)" to hsl(0, 0%, 0%)', () => {
    expect(rgbToHsl('rgb(0, 0, 0)')).toBe('hsl(0, 0%, 0%)');
  });
  it('returns empty string for empty input', () => {
    expect(rgbToHsl('')).toBe('');
  });
  it('throws on invalid input', () => {
    expect(() => rgbToHsl('not-rgb')).toThrow();
  });
});

describe('hslToRgb', () => {
  it('converts "hsl(0, 100%, 50%)" to rgb(255, 0, 0)', () => {
    expect(hslToRgb('hsl(0, 100%, 50%)')).toBe('rgb(255, 0, 0)');
  });
  it('converts "hsl(240, 100%, 50%)" to rgb(0, 0, 255)', () => {
    expect(hslToRgb('hsl(240, 100%, 50%)')).toBe('rgb(0, 0, 255)');
  });
  it('converts "hsl(120, 100%, 50%)" to rgb(0, 255, 0)', () => {
    expect(hslToRgb('hsl(120, 100%, 50%)')).toBe('rgb(0, 255, 0)');
  });
  it('accepts bare "0, 100, 50" format', () => {
    expect(hslToRgb('0, 100, 50')).toBe('rgb(255, 0, 0)');
  });
  it('round-trips with rgbToHsl', () => {
    const original = 'rgb(128, 64, 200)';
    const hsl = rgbToHsl(original);
    const roundTripped = hslToRgb(hsl);
    // Parse both and compare channel by channel with ±1 tolerance
    const parse = (s: string) => {
      const m = s.match(/(\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const [r1, g1, b1] = parse(original);
    const [r2, g2, b2] = parse(roundTripped);
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1);
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(1);
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(1);
  });
  it('returns empty string for empty input', () => {
    expect(hslToRgb('')).toBe('');
  });
  it('throws on invalid input', () => {
    expect(() => hslToRgb('not-hsl')).toThrow();
  });
});

// ─── HEX ↔ HSV ───────────────────────────────────────────────────────────────

describe('hexToHsv', () => {
  it('converts red #FF0000 to hsv(0, 100%, 100%)', () => {
    expect(hexToHsv('#FF0000')).toBe('hsv(0, 100%, 100%)');
  });
  it('converts white #FFFFFF to hsv(0, 0%, 100%)', () => {
    expect(hexToHsv('#FFFFFF')).toBe('hsv(0, 0%, 100%)');
  });
  it('converts black #000000 to hsv(0, 0%, 0%)', () => {
    expect(hexToHsv('#000000')).toBe('hsv(0, 0%, 0%)');
  });
  it('converts #0000FF (blue) to hsv(240, 100%, 100%)', () => {
    expect(hexToHsv('#0000FF')).toBe('hsv(240, 100%, 100%)');
  });
  it('returns empty string for empty input', () => {
    expect(hexToHsv('')).toBe('');
  });
  it('throws on invalid hex', () => {
    expect(() => hexToHsv('not-a-color')).toThrow();
  });
});

describe('hsvToHex', () => {
  it('converts hsv(0, 100%, 100%) to #FF0000', () => {
    expect(hsvToHex('hsv(0, 100%, 100%)')).toBe('#FF0000');
  });
  it('converts hsv(240, 100%, 100%) to #0000FF', () => {
    expect(hsvToHex('hsv(240, 100%, 100%)')).toBe('#0000FF');
  });
  it('converts hsv(0, 0%, 100%) to #FFFFFF', () => {
    expect(hsvToHex('hsv(0, 0%, 100%)')).toBe('#FFFFFF');
  });
  it('converts hsv(0, 0%, 0%) to #000000', () => {
    expect(hsvToHex('hsv(0, 0%, 0%)')).toBe('#000000');
  });
  it('accepts bare "0, 100, 100" format (no hsv() wrapper)', () => {
    expect(hsvToHex('0, 100, 100')).toBe('#FF0000');
  });
  it('round-trips with hexToHsv', () => {
    const original = '#3A7BC8';
    const hsv = hexToHsv(original);
    const roundTripped = hsvToHex(hsv);
    const origR = parseInt(original.slice(1, 3), 16);
    const origG = parseInt(original.slice(3, 5), 16);
    const origB = parseInt(original.slice(5, 7), 16);
    const rtR = parseInt(roundTripped.slice(1, 3), 16);
    const rtG = parseInt(roundTripped.slice(3, 5), 16);
    const rtB = parseInt(roundTripped.slice(5, 7), 16);
    expect(Math.abs(origR - rtR)).toBeLessThanOrEqual(1);
    expect(Math.abs(origG - rtG)).toBeLessThanOrEqual(1);
    expect(Math.abs(origB - rtB)).toBeLessThanOrEqual(1);
  });
  it('returns empty string for empty input', () => {
    expect(hsvToHex('')).toBe('');
  });
  it('throws on invalid input', () => {
    expect(() => hsvToHex('not-hsv')).toThrow();
  });
});

// ─── Color Name ↔ HEX ────────────────────────────────────────────────────────

describe('colorNameToHex', () => {
  it('converts "red" to #FF0000', () => {
    expect(colorNameToHex('red')).toBe('#FF0000');
  });
  it('converts "blue" to #0000FF', () => {
    expect(colorNameToHex('blue')).toBe('#0000FF');
  });
  it('converts "white" to #FFFFFF', () => {
    expect(colorNameToHex('white')).toBe('#FFFFFF');
  });
  it('converts "black" to #000000', () => {
    expect(colorNameToHex('black')).toBe('#000000');
  });
  it('is case-insensitive ("Red" == "red")', () => {
    expect(colorNameToHex('Red')).toBe('#FF0000');
    expect(colorNameToHex('RED')).toBe('#FF0000');
  });
  it('converts "cornflowerblue"', () => {
    expect(colorNameToHex('cornflowerblue')).toBe('#6495ED');
  });
  it('converts "tomato"', () => {
    expect(colorNameToHex('tomato')).toBe('#FF6347');
  });
  it('throws on unknown color name', () => {
    expect(() => colorNameToHex('notacolor')).toThrow();
  });
  it('returns empty string for empty input', () => {
    expect(colorNameToHex('')).toBe('');
  });
});

describe('hexToColorName', () => {
  it('converts #FF0000 to "red"', () => {
    expect(hexToColorName('#FF0000')).toBe('red');
  });
  it('converts #0000FF to "blue"', () => {
    expect(hexToColorName('#0000FF')).toBe('blue');
  });
  it('converts #FFFFFF to "white"', () => {
    expect(hexToColorName('#FFFFFF')).toBe('white');
  });
  it('converts #000000 to "black"', () => {
    expect(hexToColorName('#000000')).toBe('black');
  });
  it('is case-insensitive for input hex', () => {
    expect(hexToColorName('#ff0000')).toBe('red');
  });
  it('throws when no named color matches', () => {
    expect(() => hexToColorName('#123456')).toThrow();
  });
  it('returns empty string for empty input', () => {
    expect(hexToColorName('')).toBe('');
  });
});

// ─── Gradient Generator ───────────────────────────────────────────────────────

describe('generateLinearGradientCss', () => {
  it('generates correct CSS for "to right" direction', () => {
    expect(generateLinearGradientCss('#FF0000', '#0000FF', 'to right')).toBe(
      'linear-gradient(to right, #FF0000, #0000FF)',
    );
  });
  it('generates correct CSS for "to bottom" direction', () => {
    expect(generateLinearGradientCss('#FFFFFF', '#000000', 'to bottom')).toBe(
      'linear-gradient(to bottom, #FFFFFF, #000000)',
    );
  });
  it('generates correct CSS for "135deg" diagonal', () => {
    expect(generateLinearGradientCss('#AABBCC', '#112233', '135deg')).toBe(
      'linear-gradient(135deg, #AABBCC, #112233)',
    );
  });
});

// ─── Color Palette Extractor helpers ─────────────────────────────────────────

describe('quantizeColor', () => {
  it('rounds each channel to the nearest step (step=32)', () => {
    // r=10 → rounds to 0, g=20 → rounds to 32 (nearest 32), b=100 → rounds to 96 (nearest 32)
    expect(quantizeColor(10, 20, 100, 32)).toBe('#002060');
  });
  it('rounds 255,255,255 to #FFFFFF with step=32', () => {
    expect(quantizeColor(255, 255, 255, 32)).toBe('#FFFFFF');
  });
  it('rounds 0,0,0 to #000000 with step=32', () => {
    expect(quantizeColor(0, 0, 0, 32)).toBe('#000000');
  });
  it('rounds 128,128,128 to the nearest 32 multiple', () => {
    // 128 / 32 = 4, so rounds to 128 exactly
    expect(quantizeColor(128, 128, 128, 32)).toBe('#808080');
  });
  it('clamps output to 255 maximum per channel', () => {
    expect(quantizeColor(250, 250, 250, 32)).toBe('#FFFFFF');
  });
});

describe('getTopColors', () => {
  it('returns top N colors by frequency', () => {
    const counts = new Map([
      ['#FF0000', 100],
      ['#00FF00', 50],
      ['#0000FF', 200],
      ['#FFFFFF', 10],
    ]);
    expect(getTopColors(counts, 2)).toEqual(['#0000FF', '#FF0000']);
  });
  it('returns all colors if count > map size', () => {
    const counts = new Map([['#FF0000', 5], ['#00FF00', 3]]);
    expect(getTopColors(counts, 10)).toEqual(['#FF0000', '#00FF00']);
  });
  it('returns empty array for empty map', () => {
    expect(getTopColors(new Map(), 5)).toEqual([]);
  });
  it('returns exactly N colors when map is larger', () => {
    const counts = new Map([
      ['#AA0000', 10],
      ['#BB0000', 20],
      ['#CC0000', 30],
      ['#DD0000', 40],
      ['#EE0000', 50],
    ]);
    expect(getTopColors(counts, 3)).toHaveLength(3);
    expect(getTopColors(counts, 3)[0]).toBe('#EE0000');
  });
});
