// ─── ASN.1 DER ───────────────────────────────────────────────────────────────
// A reader and a writer for the subset of DER that certificates, CSRs and keys
// are made of. Everything else in the crypto group is built on this.

export type Asn1Node = {
  /** The raw identifier octet. */
  tag: number;
  tagClass: 'universal' | 'application' | 'context' | 'private';
  constructed: boolean;
  /** Tag number within its class: 0x10 for SEQUENCE, 0 for a `[0]` context tag. */
  tagNumber: number;
  /** Human name for a universal tag, or `[n]` for a context-specific one. */
  name: string;
  /** Offset of the identifier octet in the input. */
  start: number;
  /** Offset of the first content octet. */
  contentStart: number;
  length: number;
  /** Identifier plus length plus content. */
  totalLength: number;
  content: Uint8Array;
  children: Asn1Node[] | null;
  /** The value rendered for display: an OID string, an integer, text. */
  value: string;
};

const UNIVERSAL_TAGS: Record<number, string> = {
  0x00: 'EOC',
  0x01: 'BOOLEAN',
  0x02: 'INTEGER',
  0x03: 'BIT STRING',
  0x04: 'OCTET STRING',
  0x05: 'NULL',
  0x06: 'OBJECT IDENTIFIER',
  0x07: 'ObjectDescriptor',
  0x0a: 'ENUMERATED',
  0x0c: 'UTF8String',
  0x10: 'SEQUENCE',
  0x11: 'SET',
  0x12: 'NumericString',
  0x13: 'PrintableString',
  0x14: 'T61String',
  0x16: 'IA5String',
  0x17: 'UTCTime',
  0x18: 'GeneralizedTime',
  0x1a: 'VisibleString',
  0x1b: 'GeneralString',
  0x1e: 'BMPString',
};

const TEXT_TAGS = new Set([0x0c, 0x12, 0x13, 0x14, 0x16, 0x1a, 0x1b]);

// ─── Bytes, hex, base64, PEM ──────────────────────────────────────────────────

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/(?:0x)|[\s:,-]/gi, '');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('That is not hex');
  if (clean.length % 2 !== 0) throw new Error('Hex needs an even number of digits');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Strips the armour off a PEM block, whatever its label. */
export function pemToDer(pem: string): Uint8Array {
  const match = pem.match(/-----BEGIN [^-]+-----([\s\S]*?)-----END [^-]+-----/);
  if (!match) throw new Error('No PEM block found');
  return base64ToBytes(match[1]);
}

export function derToPem(der: Uint8Array, label: string): string {
  const base64 = bytesToBase64(der);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join('\n');
}

export function pemLabel(pem: string): string | null {
  return pem.match(/-----BEGIN ([^-]+)-----/)?.[1] ?? null;
}

/** PEM, base64 or hex, whichever the text looks like. */
export function readAnyEncoding(input: string): Uint8Array {
  const text = input.trim();
  if (!text) throw new Error('Paste a PEM block, Base64 or hex');
  if (text.includes('-----BEGIN')) return pemToDer(text);
  const clean = text.replace(/[\s:,-]/g, '');
  if (/^(?:0x)?[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) return hexToBytes(text);
  try {
    return base64ToBytes(text);
  } catch {
    throw new Error('Cannot read that as PEM, Base64 or hex');
  }
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function readLength(bytes: Uint8Array, offset: number): { length: number; read: number } {
  if (offset >= bytes.length) throw new Error(`The data ends where a length was expected, at byte ${offset}`);
  const first = bytes[offset];
  if ((first & 0x80) === 0) return { length: first, read: 1 };
  const count = first & 0x7f;
  if (count === 0) throw new Error(`Indefinite lengths are not valid DER, at byte ${offset}`);
  if (count > 4) throw new Error(`A length of ${count} bytes is longer than this reads, at byte ${offset}`);
  if (offset + count >= bytes.length + 1 && offset + 1 + count > bytes.length) {
    throw new Error(`The data ends inside a length, at byte ${offset}`);
  }
  let length = 0;
  for (let i = 0; i < count; i++) length = length * 256 + bytes[offset + 1 + i];
  return { length, read: 1 + count };
}

function readTagNumber(bytes: Uint8Array, offset: number): { tagNumber: number; read: number } {
  const low = bytes[offset] & 0x1f;
  if (low !== 0x1f) return { tagNumber: low, read: 1 };
  // High tag number form: base-128, high bit set on all but the last byte.
  let tagNumber = 0;
  let i = offset + 1;
  for (;;) {
    if (i >= bytes.length) throw new Error(`The data ends inside a tag, at byte ${offset}`);
    tagNumber = tagNumber * 128 + (bytes[i] & 0x7f);
    const more = (bytes[i] & 0x80) !== 0;
    i++;
    if (!more) break;
  }
  return { tagNumber, read: i - offset };
}

const CLASSES = ['universal', 'application', 'context', 'private'] as const;

function tagName(tagClass: string, tagNumber: number, constructed: boolean): string {
  if (tagClass === 'universal') return UNIVERSAL_TAGS[tagNumber] ?? `[UNIVERSAL ${tagNumber}]`;
  if (tagClass === 'context') return `[${tagNumber}]${constructed ? '' : ' (primitive)'}`;
  return `[${tagClass.toUpperCase()} ${tagNumber}]`;
}

/** The dotted form of an OID's content octets. */
export function decodeOid(content: Uint8Array): string {
  if (content.length === 0) throw new Error('An OID cannot be empty');

  // Every arc is base-128 with the continuation bit set on all but its last
  // byte. The first two arcs share one *value*, not one byte: with a first arc
  // of 2 the second is unbounded, so 2.100.3 starts 0x81 0x34, not 0xb4.
  const values: bigint[] = [];
  let value = 0n;
  let started = false;
  for (const byte of content) {
    value = (value << 7n) | BigInt(byte & 0x7f);
    started = true;
    if ((byte & 0x80) === 0) {
      values.push(value);
      value = 0n;
      started = false;
    }
  }
  if (started) throw new Error('The OID ends mid-arc');

  const first = values[0];
  const arc0 = first < 40n ? 0n : first < 80n ? 1n : 2n;
  const show = (n: bigint) => (n <= BigInt(Number.MAX_SAFE_INTEGER) ? String(n) : n.toString());
  return [show(arc0), show(first - arc0 * 40n), ...values.slice(1).map(show)].join('.');
}

/** DER content octets for a dotted OID. */
export function encodeOid(dotted: string): Uint8Array {
  const parts = dotted.trim().split('.');
  if (parts.length < 2) throw new Error('An OID needs at least two arcs');
  const arcs = parts.map((part) => {
    if (!/^\d+$/.test(part)) throw new Error(`"${part}" is not a valid arc`);
    return BigInt(part);
  });
  if (arcs[0] > 2n) throw new Error('The first arc must be 0, 1 or 2');
  if (arcs[0] < 2n && arcs[1] > 39n) throw new Error('With a first arc of 0 or 1, the second must be under 40');

  const out: number[] = [];
  const push = (value: bigint) => {
    const chunks: number[] = [];
    let n = value;
    do {
      chunks.unshift(Number(n & 0x7fn));
      n >>= 7n;
    } while (n > 0n);
    for (let i = 0; i < chunks.length - 1; i++) chunks[i] |= 0x80;
    out.push(...chunks);
  };

  push(arcs[0] * 40n + arcs[1]);
  for (const arc of arcs.slice(2)) push(arc);
  return new Uint8Array(out);
}

function decodeInteger(content: Uint8Array): string {
  if (content.length === 0) return '0';
  let value = 0n;
  for (const byte of content) value = (value << 8n) | BigInt(byte);
  // Two's complement: a set top bit means negative.
  if ((content[0] & 0x80) !== 0) value -= 1n << BigInt(content.length * 8);
  const decimal = value.toString();
  return content.length > 8 ? `${decimal} (0x${bytesToHex(content)})` : decimal;
}

function decodeText(content: Uint8Array, tagNumber: number): string {
  if (tagNumber === 0x1e) {
    // BMPString is UTF-16BE.
    let text = '';
    for (let i = 0; i + 1 < content.length; i += 2) {
      text += String.fromCharCode((content[i] << 8) | content[i + 1]);
    }
    return text;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(content);
}

function nodeValue(node: Asn1Node): string {
  const { tagClass, tagNumber, content } = node;
  if (tagClass !== 'universal') return content.length ? bytesToHex(content) : '';

  switch (tagNumber) {
    case 0x01: return content[0] === 0 ? 'false' : 'true';
    case 0x02:
    case 0x0a: return decodeInteger(content);
    case 0x05: return '';
    case 0x06: {
      const oid = decodeOid(content);
      const name = OID_NAMES[oid];
      return name ? `${oid} (${name})` : oid;
    }
    case 0x03: {
      if (content.length === 0) return '';
      const unused = content[0];
      return `${unused} unused bit(s), ${bytesToHex(content.subarray(1))}`;
    }
    case 0x17:
    case 0x18: return decodeText(content, tagNumber);
    default:
      if (TEXT_TAGS.has(tagNumber)) return decodeText(content, tagNumber);
      return bytesToHex(content);
  }
}

/**
 * A constructed node's children are parsed; so are the contents of an OCTET
 * STRING or BIT STRING that turn out to hold DER, which is how keys and
 * extensions nest.
 *
 * Everything works on the original buffer with absolute offsets, so the
 * positions a node reports point at real bytes of the input at any depth.
 */
function parseNode(bytes: Uint8Array, offset: number, depth: number): Asn1Node {
  if (depth > 60) throw new Error('Nested too deeply to parse');
  if (offset >= bytes.length) throw new Error(`The data ends where a value was expected, at byte ${offset}`);

  const identifier = bytes[offset];
  const { tagNumber, read: tagRead } = readTagNumber(bytes, offset);
  const tagClass = CLASSES[(identifier & 0xc0) >> 6];
  const constructed = (identifier & 0x20) !== 0;

  const { length, read: lengthRead } = readLength(bytes, offset + tagRead);
  const contentStart = offset + tagRead + lengthRead;
  if (contentStart + length > bytes.length) {
    throw new Error(
      `A ${tagName(tagClass, tagNumber, constructed)} at byte ${offset} claims ${length} bytes ` +
      `but only ${bytes.length - contentStart} remain`,
    );
  }

  const node: Asn1Node = {
    tag: identifier,
    tagClass,
    constructed,
    tagNumber,
    name: tagName(tagClass, tagNumber, constructed),
    start: offset,
    contentStart,
    length,
    totalLength: tagRead + lengthRead + length,
    content: bytes.subarray(contentStart, contentStart + length),
    children: null,
    value: '',
  };

  if (constructed) {
    node.children = parseRange(bytes, contentStart, contentStart + length, depth + 1);
  } else if (tagClass === 'universal' && (tagNumber === 0x04 || tagNumber === 0x03) && length > 1) {
    // Try the wrapped bytes; a plain octet string simply fails and stays raw.
    // A BIT STRING's first content octet is the unused-bit count, not DER.
    const innerStart = tagNumber === 0x03 ? contentStart + 1 : contentStart;
    node.children = tryParse(bytes, innerStart, contentStart + length, depth + 1);
  }

  node.value = node.children ? '' : nodeValue(node);
  return node;
}

function parseRange(bytes: Uint8Array, start: number, end: number, depth: number): Asn1Node[] {
  const out: Asn1Node[] = [];
  let offset = start;
  while (offset < end) {
    const node = parseNode(bytes, offset, depth);
    if (node.start + node.totalLength > end) {
      throw new Error(`A ${node.name} at byte ${node.start} runs past the value that contains it`);
    }
    out.push(node);
    offset += node.totalLength;
  }
  return out;
}

function tryParse(bytes: Uint8Array, start: number, end: number, depth: number): Asn1Node[] | null {
  if (start >= end) return null;
  try {
    const nodes = parseRange(bytes, start, end, depth);
    // One clean run that consumed everything is a real nesting; anything that
    // only half-parses is more likely to be a coincidence.
    const consumed = nodes.reduce((sum, n) => sum + n.totalLength, 0);
    if (nodes.length === 0 || consumed !== end - start) return null;
    return nodes;
  } catch {
    return null;
  }
}

/** Parses one or more top-level DER values. */
export function parseDer(bytes: Uint8Array): Asn1Node[] {
  if (bytes.length === 0) throw new Error('No bytes to parse');
  return parseRange(bytes, 0, bytes.length, 0);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

export type Asn1RenderOptions = {
  /** Show the byte offset and length of every node. */
  offsets?: boolean;
  /** Cut a rendered value to this many characters. 0 means no limit. */
  maxValue?: number;
};

export function renderAsn1(nodes: Asn1Node[], options: Asn1RenderOptions = {}): string {
  const { offsets = true, maxValue = 120 } = options;
  const lines: string[] = [];

  const walk = (node: Asn1Node, depth: number) => {
    const indent = '  '.repeat(depth);
    const position = offsets ? `${String(node.start).padStart(5)} ${String(node.length).padStart(5)}  ` : '';
    let value = node.value;
    if (maxValue > 0 && value.length > maxValue) value = `${value.slice(0, maxValue)}...`;
    lines.push(`${position}${indent}${node.name}${value ? `: ${value}` : ''}`);
    for (const child of node.children ?? []) walk(child, depth + 1);
  };

  if (offsets) lines.push('  off   len  value');
  for (const node of nodes) walk(node, 0);
  return lines.join('\n');
}

/** The tool's entry point: any encoding in, a rendered tree out. */
export function parseAsn1Text(input: string, options: Asn1RenderOptions = {}): string {
  return renderAsn1(parseDer(readAnyEncoding(input)), options);
}

// ─── Node helpers for the tools built on this ────────────────────────────────

export function findOid(node: Asn1Node): string | null {
  if (node.tagClass === 'universal' && node.tagNumber === 0x06) return decodeOid(node.content);
  for (const child of node.children ?? []) {
    const found = findOid(child);
    if (found) return found;
  }
  return null;
}

/** The DER for a node, identifier and length included, cut from the source. */
export function nodeBytes(node: Asn1Node, source: Uint8Array): Uint8Array {
  return source.subarray(node.start, node.start + node.totalLength);
}

// ─── Writing ──────────────────────────────────────────────────────────────────

function encodeLength(length: number): number[] {
  if (length < 0x80) return [length];
  const bytes: number[] = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value = Math.floor(value / 256);
  }
  return [0x80 | bytes.length, ...bytes];
}

export function writeTlv(tag: number, content: Uint8Array | number[]): Uint8Array {
  const body = content instanceof Uint8Array ? content : new Uint8Array(content);
  return new Uint8Array([tag, ...encodeLength(body.length), ...body]);
}

export function writeSequence(...parts: Uint8Array[]): Uint8Array {
  return writeTlv(0x30, concat(...parts));
}

export function writeSet(...parts: Uint8Array[]): Uint8Array {
  return writeTlv(0x31, concat(...parts));
}

export function writeOid(dotted: string): Uint8Array {
  return writeTlv(0x06, encodeOid(dotted));
}

export function writeNull(): Uint8Array {
  return new Uint8Array([0x05, 0x00]);
}

export function writeOctetString(bytes: Uint8Array): Uint8Array {
  return writeTlv(0x04, bytes);
}

export function writeBitString(bytes: Uint8Array, unusedBits = 0): Uint8Array {
  return writeTlv(0x03, new Uint8Array([unusedBits, ...bytes]));
}

/** A non-negative INTEGER from big-endian bytes, with the DER padding rules. */
export function writeIntegerFromBytes(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const trimmed = bytes.subarray(start);
  // A leading bit of 1 would read as negative, so DER prefixes a zero byte.
  const body = trimmed[0] & 0x80 ? new Uint8Array([0, ...trimmed]) : trimmed;
  return writeTlv(0x02, body);
}

export function writeInteger(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0) throw new Error('Only non-negative integers are written here');
  if (value === 0) return new Uint8Array([0x02, 0x01, 0x00]);
  const bytes: number[] = [];
  let n = value;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  return writeIntegerFromBytes(new Uint8Array(bytes));
}

export function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

// ─── OID names ────────────────────────────────────────────────────────────────

export const OID_NAMES: Record<string, string> = {
  // Distinguished name attributes
  '2.5.4.3': 'commonName',
  '2.5.4.4': 'surname',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'countryName',
  '2.5.4.7': 'localityName',
  '2.5.4.8': 'stateOrProvinceName',
  '2.5.4.9': 'streetAddress',
  '2.5.4.10': 'organizationName',
  '2.5.4.11': 'organizationalUnitName',
  '2.5.4.12': 'title',
  '2.5.4.15': 'businessCategory',
  '2.5.4.17': 'postalCode',
  '2.5.4.42': 'givenName',
  '2.5.4.97': 'organizationIdentifier',
  '0.9.2342.19200300.100.1.1': 'userId',
  '0.9.2342.19200300.100.1.25': 'domainComponent',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '1.2.840.113549.1.9.7': 'challengePassword',
  '1.2.840.113549.1.9.14': 'extensionRequest',

  // Algorithms
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.7': 'RSAES-OAEP',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.2.1': 'id-ecPublicKey',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  '1.3.101.110': 'X25519',
  '1.3.14.3.2.26': 'sha1',
  '2.16.840.1.101.3.4.2.1': 'sha256',
  '2.16.840.1.101.3.4.2.2': 'sha384',
  '2.16.840.1.101.3.4.2.3': 'sha512',

  // Named curves
  '1.2.840.10045.3.1.7': 'prime256v1 (P-256)',
  '1.3.132.0.34': 'secp384r1 (P-384)',
  '1.3.132.0.35': 'secp521r1 (P-521)',
  '1.3.132.0.10': 'secp256k1',

  // Certificate extensions
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.32': 'certificatePolicies',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.37': 'extKeyUsage',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
  '1.3.6.1.5.5.7.3.1': 'serverAuth',
  '1.3.6.1.5.5.7.3.2': 'clientAuth',
  '1.3.6.1.5.5.7.3.3': 'codeSigning',
  '1.3.6.1.5.5.7.3.4': 'emailProtection',
  '1.3.6.1.4.1.11129.2.4.2': 'signedCertificateTimestampList',
};

/** The short label used in a distinguished name, where there is one. */
export const DN_SHORT_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'STREET',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.5': 'serialNumber',
  '0.9.2342.19200300.100.1.25': 'DC',
  '0.9.2342.19200300.100.1.1': 'UID',
  '1.2.840.113549.1.9.1': 'emailAddress',
};

export type OidLookup = { oid: string; name: string | null; hexContent: string; derHex: string };

/** Both directions of the OID tool: a dotted OID or its DER, in either order. */
export function lookupOid(input: string): OidLookup {
  const text = input.trim();
  if (!text) throw new Error('Enter an OID or its DER bytes');

  if (/^\d+$/.test(text)) throw new Error('An OID needs at least two arcs');

  if (/^\d+(?:\.\d+)+$/.test(text)) {
    const content = encodeOid(text);
    return {
      oid: text,
      name: OID_NAMES[text] ?? null,
      hexContent: bytesToHex(content),
      derHex: bytesToHex(writeTlv(0x06, content)),
    };
  }

  const bytes = readAnyEncoding(text);
  // Accept both the bare content octets and a complete OBJECT IDENTIFIER TLV.
  const content = bytes[0] === 0x06 && bytes.length > 2 && bytes[1] === bytes.length - 2
    ? bytes.subarray(2)
    : bytes;
  const oid = decodeOid(content);
  return {
    oid,
    name: OID_NAMES[oid] ?? null,
    hexContent: bytesToHex(content),
    derHex: bytesToHex(writeTlv(0x06, content)),
  };
}

export function formatOidLookup(result: OidLookup): string {
  return [
    `OID:          ${result.oid}`,
    `Name:         ${result.name ?? 'not in the table'}`,
    `Content hex:  ${result.hexContent}`,
    `Full DER:     ${result.derHex}`,
  ].join('\n');
}

export const ASN1_SAMPLE = '30 13 06 07 2a 86 48 ce 3d 02 01 06 08 2a 86 48 ce 3d 03 01 07';
