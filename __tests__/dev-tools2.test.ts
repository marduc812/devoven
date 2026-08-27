import {
  gcd,
  simplifyRatio,
  ratioToDimensions,
  commonAspectRatios,
  generateFakeItem,
  generateFakeData,
  hexToHsl2,
  hslToHex2,
  generateShades,
  type FakeDataType,
} from '../Components/Functions/DevTools2/logic';

// ─── gcd ─────────────────────────────────────────────────────────────────────

describe('gcd', () => {
  it('gcd(12, 8) is 4', () => expect(gcd(12, 8)).toBe(4));
  it('gcd(1920, 1080) is 120', () => expect(gcd(1920, 1080)).toBe(120));
  it('gcd(7, 3) is 1 (coprime)', () => expect(gcd(7, 3)).toBe(1));
  it('gcd(0, 5) is 5', () => expect(gcd(0, 5)).toBe(5));
});

// ─── simplifyRatio ───────────────────────────────────────────────────────────

describe('simplifyRatio', () => {
  it('simplifies 1920x1080 to 16:9', () => expect(simplifyRatio(1920, 1080).ratio).toBe('16:9'));
  it('simplifies 800x600 to 4:3', () => expect(simplifyRatio(800, 600).ratio).toBe('4:3'));
  it('handles 1:1', () => expect(simplifyRatio(500, 500).ratio).toBe('1:1'));
  it('throws on zero', () => expect(() => simplifyRatio(0, 100)).toThrow());
  it('throws on negative', () => expect(() => simplifyRatio(-1, 100)).toThrow());
});

// ─── ratioToDimensions ───────────────────────────────────────────────────────

describe('ratioToDimensions', () => {
  it('calculates height from 16:9 with width 1920', () => {
    expect(ratioToDimensions(16, 9, 'width', 1920).height).toBe(1080);
  });
  it('calculates width from 4:3 with height 600', () => {
    expect(ratioToDimensions(4, 3, 'height', 600).width).toBe(800);
  });
  it('returns correct width when side is width', () => {
    expect(ratioToDimensions(1, 1, 'width', 500).width).toBe(500);
  });
});

// ─── commonAspectRatios ───────────────────────────────────────────────────────

describe('commonAspectRatios', () => {
  it('returns an array', () => expect(Array.isArray(commonAspectRatios())).toBe(true));
  it('has at least 5 entries', () => expect(commonAspectRatios().length).toBeGreaterThanOrEqual(5));
  it('contains 16:9', () => expect(commonAspectRatios().some(r => r.w === 16 && r.h === 9)).toBe(true));
});

// ─── generateFakeItem ────────────────────────────────────────────────────────

describe('generateFakeItem', () => {
  it('generates a name string', () => {
    const result = generateFakeItem('name', 1);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
  it('generates an email with @ symbol', () => {
    const result = generateFakeItem('email', 1);
    expect(result).toContain('@');
  });
  it('generates a phone starting with +1', () => {
    const result = generateFakeItem('phone', 1);
    expect(result.startsWith('+1')).toBe(true);
  });
  it('generates a valid IPv4-like string', () => {
    const result = generateFakeItem('ipv4', 1);
    expect(result.split('.').length).toBe(4);
  });
  it('generates a date in YYYY-MM-DD format', () => {
    const result = generateFakeItem('date', 1);
    expect(/^\d{4}-\d{2}-\d{2}$/.test(result)).toBe(true);
  });
  it('generates a URL starting with https://', () => {
    const result = generateFakeItem('url', 1);
    expect(result.startsWith('https://')).toBe(true);
  });
  it('generates a hex color starting with #', () => {
    const result = generateFakeItem('hex-color', 1);
    expect(result.startsWith('#')).toBe(true);
  });
});

// ─── generateFakeData ────────────────────────────────────────────────────────

describe('generateFakeData', () => {
  it('generates correct number of lines', () => {
    const result = generateFakeData('name', 5);
    expect(result.split('\n').length).toBe(5);
  });
  it('generates 1 item', () => {
    const result = generateFakeData('email', 1);
    expect(result.split('\n').length).toBe(1);
  });
  it('generates 10 addresses', () => {
    const result = generateFakeData('address', 10);
    expect(result.split('\n').length).toBe(10);
  });
});

// ─── hexToHsl2 ───────────────────────────────────────────────────────────────

describe('hexToHsl2', () => {
  it('converts white #FFFFFF to l=100', () => expect(hexToHsl2('#FFFFFF').l).toBe(100));
  it('converts black #000000 to l=0', () => expect(hexToHsl2('#000000').l).toBe(0));
  it('converts red #FF0000 to h near 0', () => {
    const {h} = hexToHsl2('#FF0000');
    expect(h).toBe(0);
  });
  it('returns h, s, l as numbers', () => {
    const result = hexToHsl2('#3B82F6');
    expect(typeof result.h).toBe('number');
    expect(typeof result.s).toBe('number');
    expect(typeof result.l).toBe('number');
  });
});

// ─── hslToHex2 ───────────────────────────────────────────────────────────────

describe('hslToHex2', () => {
  it('converts 0,0,100 to white', () => expect(hslToHex2(0, 0, 100).toUpperCase()).toBe('#FFFFFF'));
  it('converts 0,0,0 to black', () => expect(hslToHex2(0, 0, 0).toUpperCase()).toBe('#000000'));
  it('returns a 7-char hex string', () => {
    const result = hslToHex2(210, 80, 50);
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// ─── generateShades ──────────────────────────────────────────────────────────

describe('generateShades', () => {
  it('returns 10 shades by default', () => expect(generateShades('#3B82F6')).toHaveLength(10));
  it('first shade is light', () => {
    const shades = generateShades('#3B82F6');
    const {l} = hexToHsl2(shades[0].hex);
    expect(l).toBeGreaterThan(80);
  });
  it('throws on invalid hex', () => expect(() => generateShades('notahex')).toThrow());
  it('returns custom number of shades', () => expect(generateShades('#FF0000', 5)).toHaveLength(5));
  it('each shade has hex and hsl properties', () => {
    const shades = generateShades('#3B82F6');
    expect(shades[0]).toHaveProperty('hex');
    expect(shades[0]).toHaveProperty('hsl');
    expect(shades[0]).toHaveProperty('shade');
  });
});
