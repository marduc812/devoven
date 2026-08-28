// IPv4/IPv6 Mapping — pure TypeScript, no browser APIs
// Given an IPv4 address, shows various IPv6 representations

export interface IPv4Parts {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface IpMappingResult {
  ipv4: string;
  decimal: number;
  hexStr: string;
  ipv4MappedIPv6: string;
  ipv4CompatibleIPv6: string;
  sixToFour: string;
  teredo: string;
  binary: string;
}

export function parseIPv4(ip: string): IPv4Parts {
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4: must have 4 octets');
  const nums = parts.map(p => {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255 || p.trim() === '') {
      throw new Error('Invalid octet: ' + p);
    }
    return n;
  });
  return { a: nums[0], b: nums[1], c: nums[2], d: nums[3] };
}

function toHex(n: number, width: number): string {
  return n.toString(16).padStart(width, '0');
}

function toBinary8(n: number): string {
  return n.toString(2).padStart(8, '0');
}

export function computeIpMappings(ip: string): IpMappingResult {
  const { a, b, c, d } = parseIPv4(ip);

  // Decimal representation
  const decimal = ((a * 256 + b) * 256 + c) * 256 + d;

  // Hex representation
  const hexStr = '0x' + toHex(a, 2) + toHex(b, 2) + toHex(c, 2) + toHex(d, 2);

  // IPv4-mapped IPv6: ::ffff:a.b.c.d
  // Format: 0000:0000:0000:0000:0000:ffff:aabb:ccdd
  const ab = toHex(a, 2) + toHex(b, 2);
  const cd = toHex(c, 2) + toHex(d, 2);
  const ipv4MappedIPv6 = '::ffff:' + a + '.' + b + '.' + c + '.' + d;
  const ipv4MappedExpanded = '0000:0000:0000:0000:0000:ffff:' + ab + ':' + cd;

  // IPv4-compatible IPv6 (deprecated): ::a.b.c.d
  const ipv4CompatibleIPv6 = '::' + a + '.' + b + '.' + c + '.' + d + ' (full: 0000:0000:0000:0000:0000:0000:' + ab + ':' + cd + ')';

  // 6to4: 2002:aabb:ccdd::/48
  const sixToFour = '2002:' + ab + ':' + cd + '::/48 (host: 2002:' + ab + ':' + cd + '::1)';

  // Teredo: 2001:0000::/32
  // Teredo encodes: server IPv4 in bits 32-63, client IPv4 XOR 0xffffffff in bits 96-127
  // For display, show the template:
  const aInv = (a ^ 0xff).toString(16).padStart(2, '0');
  const bInv = (b ^ 0xff).toString(16).padStart(2, '0');
  const cInv = (c ^ 0xff).toString(16).padStart(2, '0');
  const dInv = (d ^ 0xff).toString(16).padStart(2, '0');
  const teredo = '2001:0000:[server]:[flags+port]:' + aInv + bInv + ':' + cInv + dInv;
  const teredoFull = '2001:0000:0000:0000:0000:0000:' + aInv + bInv + ':' + cInv + dInv + ' (client bits, no server)';

  // Binary
  const binary = toBinary8(a) + '.' + toBinary8(b) + '.' + toBinary8(c) + '.' + toBinary8(d);

  return {
    ipv4: ip.trim(),
    decimal,
    hexStr,
    ipv4MappedIPv6: ipv4MappedIPv6 + '\n  Full: ' + ipv4MappedExpanded,
    ipv4CompatibleIPv6,
    sixToFour,
    teredo: teredo + '\n  (simplified, no server): ' + teredoFull,
    binary,
  };
}

export function formatIpMappings(ip: string): string {
  if (!ip.trim()) return '';
  try {
    const result = computeIpMappings(ip);
    const lines: string[] = [
      '=== IPv4 Address Info ===',
      '',
      'IPv4 Address:     ' + result.ipv4,
      'Decimal:          ' + result.decimal,
      'Hexadecimal:      ' + result.hexStr,
      'Binary:           ' + result.binary,
      '',
      '=== IPv6 Representations ===',
      '',
      'IPv4-Mapped IPv6 (RFC 4291):',
      '  ' + result.ipv4MappedIPv6,
      '',
      'IPv4-Compatible IPv6 (deprecated, RFC 4291):',
      '  ' + result.ipv4CompatibleIPv6,
      '',
      '6to4 Address (RFC 3056):',
      '  ' + result.sixToFour,
      '',
      'Teredo (RFC 4380) — client bits:',
      '  ' + result.teredo,
    ];
    return lines.join('\n');
  } catch (e) {
    return 'Error: ' + (e instanceof Error ? e.message : 'Invalid input');
  }
}
