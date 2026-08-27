import { hexToRgb, rgbToHex } from '../Components/Functions/Utils';
import { keccak_256 } from 'js-sha3';

// --- Hex to RGB / RGB to Hex (covered in utils.test.ts — one cross-check here) ---

describe('Hex ↔ RGB roundtrip', () => {
  it('converts #1A2B3C → rgb → back to #1A2B3C', () => {
    const rgb = hexToRgb('#1A2B3C')!;
    expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe('#1A2B3C');
  });
});

// --- RGB to CMYK ---
// Logic extracted from Converters.tsx rgbToCmyk
const rgbToCmyk = (r: number, g: number, b: number) => {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  c = isNaN(c) ? 0 : Math.round(c * 10000) / 100;
  m = isNaN(m) ? 0 : Math.round(m * 10000) / 100;
  y = isNaN(y) ? 0 : Math.round(y * 10000) / 100;
  k = isNaN(k) ? 0 : Math.round(k * 10000) / 100;
  return { c: Math.round(c), m: Math.round(m), y: Math.round(y), k: Math.round(k) };
};

describe('RGB to CMYK', () => {
  it('converts rgb(164,55,55) to cmyk(0,66,66,36) (from tool description)', () => {
    expect(rgbToCmyk(164, 55, 55)).toEqual({ c: 0, m: 66, y: 66, k: 36 });
  });
  it('converts black rgb(0,0,0) to cmyk(0,0,0,100)', () => {
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
  it('converts white rgb(255,255,255) to cmyk(0,0,0,0)', () => {
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });
});

// --- CMYK to RGB ---
// Logic extracted from Converters.tsx cmyk2rgb
const cmykToRgb = (c: number, m: number, y: number, k: number) => {
  c = c / 100;
  m = m / 100;
  y = y / 100;
  k = k / 100;
  c = c * (1 - k) + k;
  m = m * (1 - k) + k;
  y = y * (1 - k) + k;
  return {
    r: Math.round((1 - c) * 255),
    g: Math.round((1 - m) * 255),
    b: Math.round((1 - y) * 255),
  };
};

describe('CMYK to RGB', () => {
  it('converts cmyk(85,0,75,14) to rgb(33,219,55) (from tool description)', () => {
    expect(cmykToRgb(85, 0, 75, 14)).toEqual({ r: 33, g: 219, b: 55 });
  });
  it('converts cmyk(0,0,0,0) to white rgb(255,255,255)', () => {
    expect(cmykToRgb(0, 0, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('converts cmyk(0,0,0,100) to black rgb(0,0,0)', () => {
    expect(cmykToRgb(0, 0, 0, 100)).toEqual({ r: 0, g: 0, b: 0 });
  });
});

// --- ETH Public Key to Address ---
// Logic extracted from Converters.tsx ETHPubToAddr
const ethPubToAddr = (pubKey: string): string => {
  const { hexToBytes } = require('web3-utils');
  const userInput = pubKey.replace('0x', '');
  let formatted = userInput.replace(/^04/, '');
  if (formatted.length % 2 !== 0) {
    formatted = '0' + formatted;
  }
  return '0x' + keccak_256(hexToBytes('0x' + formatted)).toUpperCase().slice(-40);
};

describe('ETH Public Key to Address', () => {
  it('converts "DEADBEEF" to the expected address (from tool description)', () => {
    expect(ethPubToAddr('DEADBEEF')).toBe('0xE11198C739161B4C0116A9A2DCCDFA1C492006F1');
  });
  it('strips a 0x prefix before processing', () => {
    expect(ethPubToAddr('0xDEADBEEF')).toBe(ethPubToAddr('DEADBEEF'));
  });
});

// --- Text Replace ---
// Logic extracted from Converters.tsx TextReplace
describe('Text Replace', () => {
  it('replaces a simple string (from tool description)', () => {
    expect('hello world'.replaceAll('hello', 'hi')).toBe('hi world');
  });
  it('replaces all occurrences', () => {
    expect('abc abc abc'.replaceAll('abc', 'xyz')).toBe('xyz xyz xyz');
  });
  it('replaces nothing when find string is absent', () => {
    expect('hello'.replaceAll('xyz', 'abc')).toBe('hello');
  });
  it('replaces using a regex pattern', () => {
    const result = 'foo123bar456'.replace(new RegExp('\\d+', 'g'), 'N');
    expect(result).toBe('fooNbarN');
  });
  it('throws on an invalid regex', () => {
    expect(() => new RegExp('[invalid', 'g')).toThrow();
  });
});
