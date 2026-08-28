export type PemKeyType =
  | 'RSA PUBLIC KEY'
  | 'RSA PRIVATE KEY'
  | 'PUBLIC KEY'
  | 'PRIVATE KEY'
  | 'CERTIFICATE'
  | 'EC PRIVATE KEY'
  | 'CERTIFICATE REQUEST'
  | 'UNKNOWN';

export type RsaKeyInfo = {
  keyType: PemKeyType;
  label: string;
  base64Body: string;
  derBytes: number;
  estimatedBits: number | null;
  modulusHex: string | null;
  exponentHex: string | null;
  exponentDecimal: number | null;
  structure: string[];
  notes: string[];
};

/** Decode a Base64 string to a byte array (no browser APIs). */
function base64ToBytes(b64: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = chars.indexOf(clean[i++]);
    const b = chars.indexOf(clean[i++]);
    const c = chars.indexOf(clean[i++]);
    const d = chars.indexOf(clean[i++]);
    if (a < 0 || b < 0) break;
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0 && clean[i - 2] !== '=') bytes.push(((b & 0xf) << 4) | (c >> 2));
    if (d >= 0 && clean[i - 1] !== '=') bytes.push(((c & 0x3) << 6) | d);
  }
  return bytes;
}

function toHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Read ASN.1 DER length at offset, returns [length, bytesConsumed] */
function readDerLength(bytes: number[], offset: number): [number, number] {
  const first = bytes[offset];
  if (first < 0x80) return [first, 1];
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) {
    len = (len << 8) | bytes[offset + 1 + i];
  }
  return [len, 1 + numBytes];
}

/** Walk top-level ASN.1 SEQUENCE and collect structure info */
function describeAsn1(bytes: number[]): string[] {
  const lines: string[] = [];
  let offset = 0;

  function walk(depth: number, limit: number): void {
    if (offset >= bytes.length || offset >= limit) return;
    const tag = bytes[offset++];
    if (offset >= bytes.length) return;
    const [len, consumed] = readDerLength(bytes, offset);
    offset += consumed;
    const end = offset + len;
    const tagHex = '0x' + tag.toString(16).toUpperCase().padStart(2, '0');
    const indent = '  '.repeat(depth);
    const tagName = describeTag(tag);
    lines.push(`${indent}${tagName} (tag=${tagHex}, len=${len})`);
    if ((tag & 0x20) !== 0 && depth < 3) {
      // constructed — recurse
      walk(depth + 1, end);
    }
    offset = end;
  }

  // walk top-level only (don't recurse more than 3 levels)
  while (offset < bytes.length && lines.length < 20) {
    walk(0, bytes.length);
  }
  return lines;
}

function describeTag(tag: number): string {
  const constructed = (tag & 0x20) !== 0;
  const cls = (tag >> 6) & 0x3;
  const num = tag & 0x1f;
  if (cls === 0) {
    const names: Record<number, string> = {
      1: 'BOOLEAN', 2: 'INTEGER', 3: 'BIT STRING', 4: 'OCTET STRING',
      5: 'NULL', 6: 'OID', 12: 'UTF8String', 16: 'SEQUENCE', 17: 'SET',
      19: 'PrintableString', 20: 'T61String', 22: 'IA5String',
      23: 'UTCTime', 24: 'GeneralizedTime',
    };
    return names[num] || (constructed ? `SEQUENCE[${num}]` : `PRIMITIVE[${num}]`);
  }
  if (cls === 2) return `[${num}]${constructed ? ' (constructed)' : ''}`;
  return `tag=0x${tag.toString(16)}`;
}

/**
 * Estimate RSA key size from DER modulus.
 * In an RSA public key (PKCS#1), the outer SEQUENCE contains:
 *   INTEGER (modulus), INTEGER (exponent)
 * We find the first large INTEGER and use its bit length.
 */
function extractRsaPublicComponents(bytes: number[], isWrapped: boolean): {
  modulusHex: string | null;
  exponentHex: string | null;
  exponentDecimal: number | null;
  bits: number | null;
} {
  let offset = 0;
  const integers: number[][] = [];

  function skipTag(): boolean {
    if (offset >= bytes.length) return false;
    const tag = bytes[offset++];
    if (offset >= bytes.length) return false;
    const [len, consumed] = readDerLength(bytes, offset);
    offset += consumed;
    if ((tag & 0x20) !== 0) {
      // constructed — skip inside
      return true;
    }
    const raw = bytes.slice(offset, offset + len);
    if ((tag & 0x1f) === 2) integers.push(raw); // INTEGER
    offset += len;
    return true;
  }

  // For SubjectPublicKeyInfo (PUBLIC KEY), skip outer SEQUENCE + AlgorithmIdentifier SEQUENCE + BIT STRING
  // then parse inner PKCS#1 block
  // For simplicity, just scan for all INTEGERs
  function scan(limit: number): void {
    while (offset < limit && integers.length < 10) {
      if (offset >= bytes.length) break;
      const tag = bytes[offset];
      if (tag === 0x30 || tag === 0xa0 || tag === 0xa3) {
        // SEQUENCE or context — recurse
        offset++;
        const [len, consumed] = readDerLength(bytes, offset);
        offset += consumed;
        const prev = offset;
        scan(prev + len);
        offset = prev + len;
      } else if (tag === 0x03) {
        // BIT STRING — skip first byte (unused bits) then recurse
        offset++;
        const [len, consumed] = readDerLength(bytes, offset);
        offset += consumed;
        if (len > 1) {
          offset++; // skip unused bits byte
          const inner = bytes.slice(offset, offset + len - 1);
          const savedOffset = offset;
          offset = 0;
          const savedBytes = bytes.splice(0);
          bytes.length = 0;
          inner.forEach(b => bytes.push(b));
          scan(inner.length);
          bytes.length = 0;
          savedBytes.forEach(b => bytes.push(b));
          offset = savedOffset + len - 1;
        } else {
          offset += len;
        }
      } else {
        skipTag();
      }
    }
  }

  // simpler flat scan
  const flatIntegers: number[][] = [];
  let pos = 0;
  function flatScan(): void {
    while (pos < bytes.length && flatIntegers.length < 10) {
      const tag = bytes[pos++];
      if (pos >= bytes.length) break;
      const [len, consumed] = readDerLength(bytes, pos);
      pos += consumed;
      if (len > bytes.length - pos + consumed) break;
      if (tag === 0x02) {
        // INTEGER
        flatIntegers.push(bytes.slice(pos, pos + len));
      }
      pos += len;
    }
  }
  flatScan();

  if (flatIntegers.length === 0) return { modulusHex: null, exponentHex: null, exponentDecimal: null, bits: null };

  // Find largest INTEGER — that's likely the modulus
  let modIdx = 0;
  for (let i = 1; i < flatIntegers.length; i++) {
    if (flatIntegers[i].length > flatIntegers[modIdx].length) modIdx = i;
  }
  const modBytes = flatIntegers[modIdx];
  // Remove leading zero byte (sign byte in DER)
  const significantBytes = modBytes[0] === 0 ? modBytes.slice(1) : modBytes;
  const bits = significantBytes.length > 0 ? (significantBytes.length - 1) * 8 + Math.ceil(Math.log2((significantBytes[0] || 1) + 1)) : 0;
  const modulusHex = toHex(Array.from(modBytes));

  // Exponent is typically the last small INTEGER after modulus
  let expBytes: number[] | null = null;
  for (let i = modIdx + 1; i < flatIntegers.length; i++) {
    if (flatIntegers[i].length <= 4) { expBytes = flatIntegers[i]; break; }
  }
  if (!expBytes && modIdx > 0 && flatIntegers[flatIntegers.length - 1].length <= 4) {
    expBytes = flatIntegers[flatIntegers.length - 1];
  }

  let exponentDecimal: number | null = null;
  let exponentHex: string | null = null;
  if (expBytes) {
    exponentHex = toHex(Array.from(expBytes));
    exponentDecimal = expBytes.reduce((acc, b) => acc * 256 + b, 0);
  }

  // Round bits to nearest standard key size
  const standardSizes = [512, 768, 1024, 1536, 2048, 3072, 4096, 8192];
  const estimatedBits = standardSizes.reduce((prev, curr) =>
    Math.abs(curr - bits) < Math.abs(prev - bits) ? curr : prev
  );

  return { modulusHex, exponentHex, exponentDecimal, bits: estimatedBits };
}

export function parseRsaKeyInfo(pem: string): RsaKeyInfo {
  const trimmed = pem.trim();

  // Extract header type
  const headerMatch = trimmed.match(/-----BEGIN ([^-]+)-----/);
  const rawLabel = headerMatch ? headerMatch[1] : 'UNKNOWN';

  const keyTypeMap: Record<string, PemKeyType> = {
    'RSA PUBLIC KEY': 'RSA PUBLIC KEY',
    'RSA PRIVATE KEY': 'RSA PRIVATE KEY',
    'PUBLIC KEY': 'PUBLIC KEY',
    'PRIVATE KEY': 'PRIVATE KEY',
    'CERTIFICATE': 'CERTIFICATE',
    'EC PRIVATE KEY': 'EC PRIVATE KEY',
    'CERTIFICATE REQUEST': 'CERTIFICATE REQUEST',
  };
  const keyType: PemKeyType = keyTypeMap[rawLabel] || 'UNKNOWN';

  // Extract base64 body
  const body = trimmed
    .replace(/-----BEGIN[^-]*-----/, '')
    .replace(/-----END[^-]*-----/, '')
    .replace(/\s+/g, '');

  if (!body) {
    return {
      keyType, label: rawLabel, base64Body: '', derBytes: 0,
      estimatedBits: null, modulusHex: null, exponentHex: null,
      exponentDecimal: null, structure: ['No base64 body found'],
      notes: ['Input appears to be empty or malformed'],
    };
  }

  const bytes = base64ToBytes(body);
  const structure = describeAsn1([...bytes]);

  const notes: string[] = [];
  let estimatedBits: number | null = null;
  let modulusHex: string | null = null;
  let exponentHex: string | null = null;
  let exponentDecimal: number | null = null;

  const isRsaKey = keyType === 'RSA PUBLIC KEY' || keyType === 'RSA PRIVATE KEY' ||
    keyType === 'PUBLIC KEY' || keyType === 'PRIVATE KEY';

  if (isRsaKey) {
    const components = extractRsaPublicComponents([...bytes], keyType === 'PUBLIC KEY' || keyType === 'PRIVATE KEY');
    estimatedBits = components.bits;
    modulusHex = components.modulusHex ? components.modulusHex.slice(0, 64) + (components.modulusHex.length > 64 ? '...' : '') : null;
    exponentHex = components.exponentHex;
    exponentDecimal = components.exponentDecimal;

    if (keyType === 'RSA PUBLIC KEY') notes.push('PKCS#1 format (no AlgorithmIdentifier wrapper)');
    if (keyType === 'PUBLIC KEY') notes.push('PKCS#8 SubjectPublicKeyInfo format (X.509 wrapper)');
    if (keyType === 'RSA PRIVATE KEY') notes.push('PKCS#1 private key — contains all CRT parameters');
    if (keyType === 'PRIVATE KEY') notes.push('PKCS#8 PrivateKeyInfo format');
    if (exponentDecimal === 65537) notes.push('Public exponent is 65537 (0x10001) — standard Fermat prime');
    if (exponentDecimal === 3) notes.push('Public exponent is 3 — fast but potentially weak for textbook RSA');
    if (estimatedBits && estimatedBits < 2048) notes.push('Key size < 2048 bits — considered insecure by modern standards');
    if (estimatedBits && estimatedBits >= 4096) notes.push('Key size >= 4096 bits — strong security margin');
  } else if (keyType === 'EC PRIVATE KEY') {
    notes.push('Elliptic Curve private key (SEC1 format)');
    notes.push('Use PEM Viewer or openssl ec -text to see curve OID');
  } else if (keyType === 'CERTIFICATE') {
    notes.push('X.509 certificate — use PEM Viewer for full field breakdown');
  } else if (keyType === 'CERTIFICATE REQUEST') {
    notes.push('PKCS#10 Certificate Signing Request (CSR)');
  } else {
    notes.push('Unknown PEM type — cannot perform RSA-specific analysis');
  }

  return {
    keyType, label: rawLabel, base64Body: body.slice(0, 40) + '...',
    derBytes: bytes.length, estimatedBits, modulusHex,
    exponentHex, exponentDecimal, structure, notes,
  };
}

export function formatRsaKeyInfo(info: RsaKeyInfo): string {
  const lines: string[] = [
    `PEM Type:    ${info.label}`,
    `DER Size:    ${info.derBytes} bytes`,
  ];
  if (info.estimatedBits !== null) {
    lines.push(`Key Size:    ~${info.estimatedBits} bits`);
  }
  if (info.exponentDecimal !== null) {
    lines.push(`Public Exp:  ${info.exponentDecimal} (0x${info.exponentHex})`);
  }
  if (info.modulusHex) {
    lines.push(`Modulus:     ${info.modulusHex}`);
  }
  lines.push('', 'ASN.1 Structure:', ...info.structure);
  if (info.notes.length > 0) {
    lines.push('', 'Notes:');
    info.notes.forEach(n => lines.push(`  • ${n}`));
  }
  return lines.join('\n');
}
