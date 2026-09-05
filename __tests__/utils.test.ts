import {
  textToBinary,
  binaryToString,
  hexToRgb,
  rgbToHex,
  calculateRelLuminance,
  resultContrastRatio,
  colorValidator,
  textStats,
  formatTextStats,
} from '../Components/Functions/Utils';

describe('textToBinary', () => {
  it('converts "Admin" to space-separated binary', () => {
    expect(textToBinary('Admin')).toBe('01000001 01100100 01101101 01101001 01101110');
  });
  it('converts a single character', () => {
    expect(textToBinary('A')).toBe('01000001');
  });
  it('returns empty string for empty input', () => {
    expect(textToBinary('')).toBe('');
  });
});

describe('binaryToString', () => {
  it('converts spaced binary back to "Admin"', () => {
    expect(binaryToString('01000001 01100100 01101101 01101001 01101110')).toBe('Admin');
  });
  it('converts continuous binary back to "Admin"', () => {
    expect(binaryToString('0100000101100100011011010110100101101110')).toBe('Admin');
  });
  it('roundtrips with textToBinary', () => {
    expect(binaryToString(textToBinary('Hello'))).toBe('Hello');
  });
});

describe('hexToRgb', () => {
  it('converts #A43737 to {r:164, g:55, b:55}', () => {
    expect(hexToRgb('#A43737')).toEqual({ r: 164, g: 55, b: 55 });
  });
  it('converts #000000 to black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('converts #FFFFFF to white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('returns null for invalid input', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts rgb(164,55,55) to #A43737', () => {
    expect(rgbToHex(164, 55, 55)).toBe('#A43737');
  });
  it('converts black to #000000', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });
  it('converts white to #FFFFFF', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });
  it('roundtrips with hexToRgb', () => {
    const rgb = hexToRgb('#1A2B3C')!;
    expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe('#1A2B3C');
  });
});

describe('calculateRelLuminance', () => {
  it('returns 1 for white', () => {
    expect(calculateRelLuminance('#FFFFFF')).toBe(1);
  });
  it('returns 0 for black', () => {
    expect(calculateRelLuminance('#000000')).toBe(0);
  });
  it('returns a value between 0 and 1 for a mid-tone', () => {
    const lum = calculateRelLuminance('#AB3030');
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });
  it('returns 0 for an invalid hex', () => {
    expect(calculateRelLuminance('invalid')).toBe(0);
  });
});

describe('resultContrastRatio', () => {
  it('returns ~21 for white on black', () => {
    expect(resultContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  });
  it('returns 1 for identical colors', () => {
    expect(resultContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 1);
  });
  it('returns ~5.14 for #FC0000 on #000000', () => {
    expect(resultContrastRatio('#FC0000', '#000000')).toBeCloseTo(5.14, 1);
  });
});

describe('colorValidator', () => {
  it('accepts valid 6-digit hex', () => {
    expect(colorValidator('#FFFFFF')).toBe(true);
    expect(colorValidator('#A43737')).toBe(true);
  });
  it('rejects hex without #', () => {
    expect(colorValidator('FFFFFF')).toBe(false);
  });
  it('rejects 3-digit shorthand', () => {
    expect(colorValidator('#FFF')).toBe(false);
  });
  it('rejects non-hex strings', () => {
    expect(colorValidator('not-a-color')).toBe(false);
  });
});


describe('textStats', () => {
  it('counts nothing in an empty box', () => {
    expect(textStats('')).toEqual({ chars: 0, words: 0, lines: 0 });
  });
  it('counts words split by any whitespace, not just spaces', () => {
    expect(textStats('one two\nthree\tfour')).toEqual({ chars: 18, words: 4, lines: 2 });
  });
  it('ignores leading and trailing whitespace', () => {
    expect(textStats('  hello  ').words).toBe(1);
  });
  it('counts CRLF as one line break', () => {
    expect(textStats('a\r\nb').lines).toBe(2);
  });
});

describe('formatTextStats', () => {
  it('reads as a sentence with singular units', () => {
    expect(formatTextStats('a')).toBe('1 char · 1 word · 1 line');
  });
  it('pluralises and groups thousands', () => {
    expect(formatTextStats('x'.repeat(1000))).toBe('1,000 chars · 1 word · 1 line');
  });
  it('shows zeroes for an empty box', () => {
    expect(formatTextStats('')).toBe('0 chars · 0 words · 0 lines');
  });
});
