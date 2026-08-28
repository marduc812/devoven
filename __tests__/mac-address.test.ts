import { parseMac, formatMacInfo, generateRandomMac } from '../Components/Functions/MacAddressTools/logic';

// ─── parseMac ─────────────────────────────────────────────────────────────────

describe('parseMac', () => {
  it('parses colon-separated MAC', () => {
    const info = parseMac('AA:BB:CC:DD:EE:FF');
    expect(info.valid).toBe(true);
    expect(info.formatted!.colon).toBe('AA:BB:CC:DD:EE:FF');
    expect(info.formatted!.dash).toBe('AA-BB-CC-DD-EE-FF');
    expect(info.formatted!.dot).toBe('AABB.CCDD.EEFF');
    expect(info.formatted!.plain).toBe('AABBCCDDEEFF');
    expect(info.oui).toBe('AABBCC');
  });

  it('parses dash-separated MAC', () => {
    const info = parseMac('AA-BB-CC-DD-EE-FF');
    expect(info.valid).toBe(true);
    expect(info.formatted!.colon).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('parses dot-notation MAC', () => {
    const info = parseMac('AABB.CCDD.EEFF');
    expect(info.valid).toBe(true);
    expect(info.formatted!.plain).toBe('AABBCCDDEEFF');
  });

  it('parses plain 12-char MAC', () => {
    const info = parseMac('aabbccddeeff');
    expect(info.valid).toBe(true);
    expect(info.formatted!.colon).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('detects broadcast address', () => {
    const info = parseMac('FF:FF:FF:FF:FF:FF');
    expect(info.isBroadcast).toBe(true);
    expect(info.isMulticast).toBe(true);
  });

  it('detects multicast bit', () => {
    const info = parseMac('01:00:00:00:00:00');
    expect(info.isMulticast).toBe(true);
    expect(info.isLocallyAdministered).toBe(false);
  });

  it('detects locally administered bit', () => {
    const info = parseMac('02:00:00:00:00:00');
    expect(info.isLocallyAdministered).toBe(true);
    expect(info.isMulticast).toBe(false);
  });

  it('returns invalid for too short', () => {
    expect(parseMac('AA:BB:CC').valid).toBe(false);
  });

  it('returns invalid for non-hex chars', () => {
    expect(parseMac('GG:HH:II:JJ:KK:LL').valid).toBe(false);
  });

  it('returns invalid for empty string', () => {
    expect(parseMac('').valid).toBe(false);
  });
});

// ─── formatMacInfo ────────────────────────────────────────────────────────────

describe('formatMacInfo', () => {
  it('formats valid MAC info', () => {
    const info = parseMac('AA:BB:CC:DD:EE:FF');
    const result = formatMacInfo(info);
    expect(result).toContain('AA:BB:CC:DD:EE:FF');
    expect(result).toContain('AA-BB-CC-DD-EE-FF');
    expect(result).toContain('AABB.CCDD.EEFF');
    expect(result).toContain('AABBCC');
  });

  it('returns error for invalid MAC', () => {
    expect(formatMacInfo({ valid: false })).toBe('Invalid MAC address');
  });

  it('includes Yes/No for boolean fields', () => {
    const info = parseMac('02:00:00:00:00:00');
    const result = formatMacInfo(info);
    expect(result).toContain('Yes'); // locally administered
    expect(result).toContain('No');  // not multicast, not broadcast
  });
});

// ─── generateRandomMac ────────────────────────────────────────────────────────

describe('generateRandomMac', () => {
  it('generates a valid MAC address', () => {
    const mac = generateRandomMac();
    const info = parseMac(mac);
    expect(info.valid).toBe(true);
  });

  it('generates locally administered MAC', () => {
    const mac = generateRandomMac();
    const info = parseMac(mac);
    expect(info.isLocallyAdministered).toBe(true);
  });

  it('generates unicast MAC (not multicast)', () => {
    const mac = generateRandomMac();
    const info = parseMac(mac);
    expect(info.isMulticast).toBe(false);
  });

  it('generates different MACs each time', () => {
    const macs = new Set(Array.from({ length: 10 }, () => generateRandomMac()));
    expect(macs.size).toBeGreaterThan(5);
  });

  it('generates MAC in colon format', () => {
    const mac = generateRandomMac();
    expect(mac).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/);
  });
});
