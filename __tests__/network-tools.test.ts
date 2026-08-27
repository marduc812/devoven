import {
  ipv4ToInt,
  intToIpv4,
  ipv4ToBinary,
  binaryToIpv4,
  parseCidr,
  expandIpv6,
  compressIpv6,
  parseUrl,
  parseUserAgent,
  formatParsedUserAgent,
} from '../Components/Functions/NetworkTools/logic';

// ─── ipv4ToInt ────────────────────────────────────────────────────────────────

describe('ipv4ToInt', () => {
  it('converts 0.0.0.0 to 0', () => expect(ipv4ToInt('0.0.0.0')).toBe(0));
  it('converts 255.255.255.255 to 4294967295', () => expect(ipv4ToInt('255.255.255.255')).toBe(4294967295));
  it('converts 192.168.1.1 to 3232235777', () => expect(ipv4ToInt('192.168.1.1')).toBe(3232235777));
  it('converts 10.0.0.1 to 167772161', () => expect(ipv4ToInt('10.0.0.1')).toBe(167772161));
  it('throws on invalid octet 256', () => expect(() => ipv4ToInt('256.0.0.0')).toThrow());
  it('throws on wrong number of parts', () => expect(() => ipv4ToInt('192.168.1')).toThrow());
  it('throws on non-numeric octet', () => expect(() => ipv4ToInt('a.b.c.d')).toThrow());
});

// ─── intToIpv4 ────────────────────────────────────────────────────────────────

describe('intToIpv4', () => {
  it('converts 0 to 0.0.0.0', () => expect(intToIpv4(0)).toBe('0.0.0.0'));
  it('converts 4294967295 to 255.255.255.255', () => expect(intToIpv4(4294967295)).toBe('255.255.255.255'));
  it('converts 3232235777 to 192.168.1.1', () => expect(intToIpv4(3232235777)).toBe('192.168.1.1'));
  it('throws on negative number', () => expect(() => intToIpv4(-1)).toThrow());
  it('throws on number above 4294967295', () => expect(() => intToIpv4(4294967296)).toThrow());
});

// ─── ipv4ToBinary ────────────────────────────────────────────────────────────

describe('ipv4ToBinary', () => {
  it('converts 192.168.1.1 to binary', () => {
    expect(ipv4ToBinary('192.168.1.1')).toBe('11000000.10101000.00000001.00000001');
  });
  it('converts 0.0.0.0 to all zeros', () => {
    expect(ipv4ToBinary('0.0.0.0')).toBe('00000000.00000000.00000000.00000000');
  });
  it('converts 255.255.255.255 to all ones', () => {
    expect(ipv4ToBinary('255.255.255.255')).toBe('11111111.11111111.11111111.11111111');
  });
  it('throws on invalid IP', () => expect(() => ipv4ToBinary('999.0.0.0')).toThrow());
  it('throws on wrong number of parts', () => expect(() => ipv4ToBinary('192.168.1')).toThrow());
});

// ─── binaryToIpv4 ────────────────────────────────────────────────────────────

describe('binaryToIpv4', () => {
  it('converts binary to 192.168.1.1', () => {
    expect(binaryToIpv4('11000000.10101000.00000001.00000001')).toBe('192.168.1.1');
  });
  it('converts all zeros to 0.0.0.0', () => {
    expect(binaryToIpv4('00000000.00000000.00000000.00000000')).toBe('0.0.0.0');
  });
  it('converts all ones to 255.255.255.255', () => {
    expect(binaryToIpv4('11111111.11111111.11111111.11111111')).toBe('255.255.255.255');
  });
  it('throws on wrong number of octets', () => expect(() => binaryToIpv4('11000000.10101000')).toThrow());
  it('throws on octet not 8 bits', () => expect(() => binaryToIpv4('1100000.10101000.00000001.00000001')).toThrow());
});

// ─── parseCidr ────────────────────────────────────────────────────────────────

describe('parseCidr', () => {
  it('/24 gives correct network and broadcast', () => {
    const r = parseCidr('192.168.1.0/24');
    expect(r.network).toBe('192.168.1.0');
    expect(r.broadcast).toBe('192.168.1.255');
    expect(r.usableHosts).toBe(254);
    expect(r.subnetMask).toBe('255.255.255.0');
  });
  it('/16 gives correct values', () => {
    const r = parseCidr('10.0.0.0/16');
    expect(r.network).toBe('10.0.0.0');
    expect(r.broadcast).toBe('10.0.255.255');
    expect(r.totalHosts).toBe(65536);
    expect(r.usableHosts).toBe(65534);
  });
  it('/32 gives single host', () => {
    const r = parseCidr('10.0.0.1/32');
    expect(r.totalHosts).toBe(1);
    expect(r.usableHosts).toBe(0);
    expect(r.network).toBe('10.0.0.1');
  });
  it('wildcard mask is complement of subnet mask', () => {
    const r = parseCidr('192.168.1.0/24');
    expect(r.wildcardMask).toBe('0.0.0.255');
  });
  it('throws on invalid CIDR notation', () => expect(() => parseCidr('bad/24')).toThrow());
  it('throws on prefix out of range', () => expect(() => parseCidr('10.0.0.0/33')).toThrow());
});

// ─── expandIpv6 ──────────────────────────────────────────────────────────────

describe('expandIpv6', () => {
  it('expands :: loopback', () => {
    expect(expandIpv6('::1')).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
  });
  it('expands all-zeros ::', () => {
    expect(expandIpv6('::')).toBe('0000:0000:0000:0000:0000:0000:0000:0000');
  });
  it('pads short groups', () => {
    const result = expandIpv6('2001:db8::1');
    expect(result.split(':').length).toBe(8);
    expect(result.split(':').every(g => g.length === 4)).toBe(true);
  });
  it('handles full address without ::', () => {
    const full = '2001:0db8:0000:0000:0000:0000:0000:0001';
    expect(expandIpv6(full)).toBe(full);
  });
  it('is case insensitive (lowercases output)', () => {
    const result = expandIpv6('2001:DB8::1');
    expect(result).toBe(expandIpv6('2001:db8::1'));
  });
});

// ─── compressIpv6 ────────────────────────────────────────────────────────────

describe('compressIpv6', () => {
  it('compresses loopback', () => {
    expect(compressIpv6('0000:0000:0000:0000:0000:0000:0000:0001')).toBe('::1');
  });
  it('compresses all zeros', () => {
    expect(compressIpv6('0000:0000:0000:0000:0000:0000:0000:0000')).toBe('::');
  });
  it('compresses ::1 back to ::1', () => {
    expect(compressIpv6('::1')).toBe('::1');
  });
  it('removes leading zeros from groups', () => {
    const result = compressIpv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result).toContain('2001');
    expect(result).toContain('::');
  });
  it('handles address with no consecutive zeros to compress', () => {
    const addr = '2001:db8:1:2:3:4:5:6';
    const compressed = compressIpv6(addr);
    expect(compressed).not.toContain('::');
  });
});

// ─── parseUrl ────────────────────────────────────────────────────────────────

describe('parseUrl', () => {
  it('parses a full URL', () => {
    const r = parseUrl('https://user:pass@example.com:8080/path?a=1&b=2#section');
    expect(r.protocol).toBe('https:');
    expect(r.username).toBe('user');
    expect(r.password).toBe('pass');
    expect(r.hostname).toBe('example.com');
    expect(r.port).toBe('8080');
    expect(r.pathname).toBe('/path');
    expect(r.hash).toBe('#section');
    expect(r.params).toEqual([{ key: 'a', value: '1' }, { key: 'b', value: '2' }]);
  });
  it('prepends https:// when missing', () => {
    const r = parseUrl('example.com/path');
    expect(r.protocol).toBe('https:');
    expect(r.hostname).toBe('example.com');
  });
  it('parses URL with no query params', () => {
    const r = parseUrl('https://example.com/');
    expect(r.params).toEqual([]);
    expect(r.search).toBe('');
  });
  it('throws on completely invalid URL', () => {
    expect(() => parseUrl('not a url at all ://???')).toThrow();
  });
  it('parses multiple query params correctly', () => {
    const r = parseUrl('https://api.example.com?foo=bar&baz=qux');
    expect(r.params.length).toBe(2);
    expect(r.params[0]).toEqual({ key: 'foo', value: 'bar' });
  });
});

// ─── parseUserAgent ──────────────────────────────────────────────────────────

describe('parseUserAgent', () => {
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const firefoxUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:120.0) Gecko/20100101 Firefox/120.0';
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
  const botUA = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

  it('detects Chrome on Windows', () => {
    const r = parseUserAgent(chromeUA);
    expect(r.browser).toBe('Chrome');
    expect(r.os).toBe('Windows');
    expect(r.device).toBe('desktop');
    expect(r.engine).toBe('Blink');
  });
  it('detects Firefox on macOS', () => {
    const r = parseUserAgent(firefoxUA);
    expect(r.browser).toBe('Firefox');
    expect(r.os).toBe('macOS');
    expect(r.engine).toBe('Gecko');
  });
  it('detects mobile device (iPhone)', () => {
    const r = parseUserAgent(mobileUA);
    expect(r.device).toBe('mobile');
    expect(r.os).toBe('iOS');
  });
  it('detects bot', () => {
    const r = parseUserAgent(botUA);
    expect(r.device).toBe('bot');
  });
  it('throws on empty string', () => {
    expect(() => parseUserAgent('')).toThrow();
  });
  it('returns unknown for unrecognized UA', () => {
    const r = parseUserAgent('SomeWeirdAgent/1.0');
    expect(r.browser).toBe('Unknown');
    expect(r.os).toBe('Unknown');
  });
});

// ─── formatParsedUserAgent ────────────────────────────────────────────────────

describe('formatParsedUserAgent', () => {
  it('formats all fields', () => {
    const parsed = {
      browser: 'Chrome', browserVersion: '120.0.0.0',
      os: 'Windows', osVersion: '10/11',
      device: 'desktop' as const, engine: 'Blink',
    };
    const result = formatParsedUserAgent(parsed);
    expect(result).toContain('Chrome');
    expect(result).toContain('Windows');
    expect(result).toContain('desktop');
    expect(result).toContain('Blink');
  });
  it('produces 4 lines', () => {
    const parsed = {
      browser: 'Firefox', browserVersion: '120.0',
      os: 'macOS', osVersion: '14.1',
      device: 'desktop' as const, engine: 'Gecko',
    };
    expect(formatParsedUserAgent(parsed).split('\n').length).toBe(4);
  });
});
