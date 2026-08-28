import { resultContrastRatio, calculateRelLuminance } from '../Components/Functions/Utils';

// --- Password Generator ---
// Logic extracted from Tools.tsx makePass
// Same default as Tools.tsx useState initial value
const DEFAULT_SPECIAL_CHARS = `\`~!@#$%^&*()'";:/?.,[]\\}{-_=+`;

const makePass = (
  length: number,
  upperCase: boolean,
  numbers: boolean,
  specialChars: boolean,
  allowedSpecialChars = DEFAULT_SPECIAL_CHARS,
): string => {
  let characters = 'abcdefghijklmnopqrstuvwxyz';
  if (upperCase) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) characters += '1234567890';
  if (specialChars) characters += allowedSpecialChars;

  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

describe('Password Generator', () => {
  it('generates a password of the requested length', () => {
    expect(makePass(15, true, true, true)).toHaveLength(15);
    expect(makePass(8, true, true, true)).toHaveLength(8);
  });
  it('only uses lowercase when all options are off', () => {
    const pass = makePass(100, false, false, false);
    expect(pass).toMatch(/^[a-z]+$/);
  });
  it('includes uppercase letters when enabled', () => {
    // Run enough times to almost certainly hit an uppercase character
    const pass = makePass(200, true, false, false);
    expect(pass).toMatch(/[A-Z]/);
  });
  it('includes digits when enabled', () => {
    const pass = makePass(200, false, true, false);
    expect(pass).toMatch(/[0-9]/);
  });
  it('produces different passwords on successive calls', () => {
    const a = makePass(20, true, true, true);
    const b = makePass(20, true, true, true);
    // Astronomically unlikely to be equal
    expect(a).not.toBe(b);
  });
});

// --- WiFi QR Code ---
// Logic extracted from Tools.tsx WiFiQRCodeGenerator
const buildQrString = (
  ssid: string,
  encryption: string,
  password: string,
  hidden: boolean,
): string =>
  `WIFI:S:${ssid};T:${encryption};P:${password};H:${hidden ? 'true' : 'false'};`;

describe('WiFi QR Code Generator', () => {
  it('builds the correct string (from tool description)', () => {
    expect(buildQrString('Test', 'WEP', '12341234', true)).toBe(
      'WIFI:S:Test;T:WEP;P:12341234;H:true;',
    );
  });
  it('marks a visible network as H:false', () => {
    expect(buildQrString('MyNet', 'WPA', 'secret', false)).toBe(
      'WIFI:S:MyNet;T:WPA;P:secret;H:false;',
    );
  });
  it('handles an empty SSID and password', () => {
    expect(buildQrString('', 'WPA', '', false)).toBe('WIFI:S:;T:WPA;P:;H:false;');
  });
});

// --- Color Contrast Calculator ---
describe('Color Contrast Calculator', () => {
  it('returns ~5.14 for #FC0000 on #000000', () => {
    expect(resultContrastRatio('#FC0000', '#000000')).toBeCloseTo(5.14, 1);
  });
  it('returns 21 for maximum contrast (white on black)', () => {
    expect(resultContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  });
  it('returns 1 for no contrast (same color)', () => {
    expect(resultContrastRatio('#AABBCC', '#AABBCC')).toBeCloseTo(1, 1);
  });
});

// --- Relative Luminance Calculator ---
describe('Relative Luminance Calculator', () => {
  it('returns 1 for white', () => {
    expect(calculateRelLuminance('#FFFFFF')).toBe(1);
  });
  it('returns 0 for black', () => {
    expect(calculateRelLuminance('#000000')).toBe(0);
  });
  it('returns ~0.11 for #AB3030 (from tool description)', () => {
    expect(calculateRelLuminance('#AB3030')).toBeCloseTo(0.109, 2);
  });
});
