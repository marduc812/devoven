import { parseIPv4, computeIpMappings, formatIpMappings } from '@/Components/Functions/IpMappingTools/logic';

describe('parseIPv4', () => {
  it('parses a valid IPv4 address', () => {
    expect(parseIPv4('192.168.1.1')).toEqual({ a: 192, b: 168, c: 1, d: 1 });
  });

  it('parses 8.8.8.8', () => {
    expect(parseIPv4('8.8.8.8')).toEqual({ a: 8, b: 8, c: 8, d: 8 });
  });

  it('parses 0.0.0.0', () => {
    expect(parseIPv4('0.0.0.0')).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });

  it('throws for wrong number of octets', () => {
    expect(() => parseIPv4('192.168.1')).toThrow();
    expect(() => parseIPv4('192.168.1.1.1')).toThrow();
  });

  it('throws for out-of-range octet', () => {
    expect(() => parseIPv4('256.0.0.1')).toThrow();
    expect(() => parseIPv4('192.168.1.-1')).toThrow();
  });

  it('throws for non-numeric octet', () => {
    expect(() => parseIPv4('192.168.1.x')).toThrow();
  });
});

describe('computeIpMappings', () => {
  it('computes decimal for 8.8.8.8', () => {
    const result = computeIpMappings('8.8.8.8');
    expect(result.decimal).toBe(134744072); // 8*16777216 + 8*65536 + 8*256 + 8
  });

  it('computes decimal for 192.168.1.1', () => {
    const result = computeIpMappings('192.168.1.1');
    expect(result.decimal).toBe(3232235777);
  });

  it('generates IPv4-mapped IPv6 with ::ffff: prefix', () => {
    const result = computeIpMappings('192.168.1.1');
    expect(result.ipv4MappedIPv6).toContain('::ffff:192.168.1.1');
  });

  it('generates binary with correct format', () => {
    const result = computeIpMappings('8.8.8.8');
    expect(result.binary).toBe('00001000.00001000.00001000.00001000');
  });

  it('hexStr is correct for 192.168.1.1', () => {
    const result = computeIpMappings('192.168.1.1');
    expect(result.hexStr.toLowerCase()).toBe('0xc0a80101');
  });

  it('6to4 address starts with 2002:', () => {
    const result = computeIpMappings('192.168.1.1');
    expect(result.sixToFour).toContain('2002:');
  });

  it('Teredo starts with 2001:', () => {
    const result = computeIpMappings('192.168.1.1');
    expect(result.teredo).toContain('2001:');
  });
});

describe('formatIpMappings', () => {
  it('returns empty string for empty input', () => {
    expect(formatIpMappings('')).toBe('');
    expect(formatIpMappings('   ')).toBe('');
  });

  it('returns error for invalid IP', () => {
    const result = formatIpMappings('999.0.0.1');
    expect(result).toContain('Error');
  });

  it('includes all section headers for valid input', () => {
    const result = formatIpMappings('8.8.8.8');
    expect(result).toContain('IPv4 Address Info');
    expect(result).toContain('IPv6 Representations');
    expect(result).toContain('IPv4-Mapped IPv6');
    expect(result).toContain('6to4');
    expect(result).toContain('Teredo');
  });
});
