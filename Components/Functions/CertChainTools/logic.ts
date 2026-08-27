// ─── Certificate Chain Analyzer ──────────────────────────────────────────────
// Parses multiple PEM certificates and analyzes their chain.
// No browser APIs used; uses Buffer for base64 decoding.

export interface CertInfo {
  index: number;
  pem: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  role: 'leaf' | 'intermediate' | 'root';
  chainsTo: number | null; // index of the cert this one chains to
  chainValid: boolean;
  selfSigned: boolean;
}

export interface ChainAnalysis {
  certs: CertInfo[];
  ordered: number[]; // indices in chain order leaf→root
  isComplete: boolean;
  errors: string[];
}

// ─── PEM splitting ────────────────────────────────────────────────────────────

export function splitPems(input: string): string[] {
  const results: string[] = [];
  const regex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  let match = regex.exec(input);
  while (match !== null) {
    results.push(match[0].trim());
    match = regex.exec(input);
  }
  return results;
}

// ─── Minimal ASN.1 DER parsing ───────────────────────────────────────────────

function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  const arr = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) arr[i] = buf[i];
  return arr;
}

interface AsnNode {
  tag: number;
  length: number;
  valueStart: number;
  totalLength: number;
}

function readLength(der: Uint8Array, offset: number): { length: number; bytesRead: number } {
  const first = der[offset];
  if ((first & 0x80) === 0) return { length: first, bytesRead: 1 };
  const numBytes = first & 0x7f;
  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | der[offset + 1 + i];
  }
  return { length, bytesRead: 1 + numBytes };
}

function readTlv(der: Uint8Array, offset: number): AsnNode {
  const tag = der[offset];
  const { length, bytesRead } = readLength(der, offset + 1);
  return { tag, length, valueStart: offset + 1 + bytesRead, totalLength: 1 + bytesRead + length };
}

// Read children of a SEQUENCE/SET at given offset for given length
function readChildren(der: Uint8Array, start: number, end: number): AsnNode[] {
  const children: AsnNode[] = [];
  let pos = start;
  while (pos < end) {
    const node = readTlv(der, pos);
    children.push(node);
    pos += node.totalLength;
  }
  return children;
}

// Decode a UTF8String, PrintableString, or IA5String bytes to string
function decodeString(der: Uint8Array, start: number, length: number): string {
  let result = '';
  for (let i = start; i < start + length; i++) {
    result += String.fromCharCode(der[i]);
  }
  return result;
}

// Decode a BIT STRING (skip first byte which is unused-bit-count)
// or OCTET STRING value as hex
function bytesToHex(der: Uint8Array, start: number, length: number): string {
  let hex = '';
  for (let i = start; i < start + length; i++) {
    hex += der[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Parse an OID node to dotted notation
function parseOid(der: Uint8Array, start: number, length: number): string {
  if (length === 0) return '';
  const parts: number[] = [];
  const first = der[start];
  parts.push(Math.floor(first / 40));
  parts.push(first % 40);
  let val = 0;
  for (let i = 1; i < length; i++) {
    const b = der[start + i];
    val = (val << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) {
      parts.push(val);
      val = 0;
    }
  }
  return parts.join('.');
}

// Known attribute type OIDs
const OID_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'emailAddress',
};

// Parse a Name (SEQUENCE of RDNs) and return a DN string
function parseName(der: Uint8Array, start: number, length: number): string {
  const parts: string[] = [];
  const rdns = readChildren(der, start, start + length);
  for (const rdn of rdns) {
    // Each RDN is a SET
    if ((rdn.tag & 0x1f) !== 0x11) continue; // SET = 0x31
    const atvs = readChildren(der, rdn.valueStart, rdn.valueStart + rdn.length);
    for (const atv of atvs) {
      // Each ATV is a SEQUENCE
      const seq = readChildren(der, atv.valueStart, atv.valueStart + atv.length);
      if (seq.length < 2) continue;
      const oidNode = seq[0];
      const valNode = seq[1];
      const oid = parseOid(der, oidNode.valueStart, oidNode.length);
      const name = OID_NAMES[oid] || oid;
      const val = decodeString(der, valNode.valueStart, valNode.length);
      parts.push(name + '=' + val);
    }
  }
  return parts.join(', ');
}

// Parse a GeneralizedTime or UTCTime
function parseTime(der: Uint8Array, tag: number, start: number, length: number): string {
  const raw = decodeString(der, start, length);
  if (tag === 0x17) {
    // UTCTime: YYMMDDHHMMSSZ
    const year = parseInt(raw.substring(0, 2), 10);
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    return fullYear + '-' + raw.substring(2, 4) + '-' + raw.substring(4, 6) +
      ' ' + raw.substring(6, 8) + ':' + raw.substring(8, 10) + ':' + raw.substring(10, 12) + 'Z';
  }
  // GeneralizedTime: YYYYMMDDHHMMSSZ
  return raw.substring(0, 4) + '-' + raw.substring(4, 6) + '-' + raw.substring(6, 8) +
    ' ' + raw.substring(8, 10) + ':' + raw.substring(10, 12) + ':' + raw.substring(12, 14) + 'Z';
}

export interface ParsedCert {
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
}

export function parsePemCert(pem: string): ParsedCert {
  const der = pemToDer(pem);

  // Certificate ::= SEQUENCE { tbsCertificate TBSCertificate, ... }
  const certSeq = readTlv(der, 0);
  if (certSeq.tag !== 0x30) throw new Error('Not a valid DER certificate');

  const tbsSeq = readTlv(der, certSeq.valueStart);
  if (tbsSeq.tag !== 0x30) throw new Error('Invalid TBSCertificate');

  // Walk TBSCertificate fields:
  // [0] version (optional), serialNumber INTEGER, signature AlgorithmIdentifier,
  // issuer Name, validity Validity, subject Name, ...
  let pos = tbsSeq.valueStart;
  const tbsEnd = tbsSeq.valueStart + tbsSeq.length;

  let subject = '';
  let issuer = '';
  let notBefore = '';
  let notAfter = '';

  // Field 0: optional version [0] EXPLICIT
  let node = readTlv(der, pos);
  if (node.tag === 0xa0) {
    pos += node.totalLength;
    node = readTlv(der, pos);
  }

  // serialNumber INTEGER
  pos += node.totalLength;

  // signature AlgorithmIdentifier SEQUENCE
  node = readTlv(der, pos);
  pos += node.totalLength;

  // issuer Name
  node = readTlv(der, pos);
  issuer = parseName(der, node.valueStart, node.length);
  pos += node.totalLength;

  // validity Validity SEQUENCE
  node = readTlv(der, pos);
  const validityChildren = readChildren(der, node.valueStart, node.valueStart + node.length);
  if (validityChildren.length >= 1) {
    const nbNode = validityChildren[0];
    notBefore = parseTime(der, nbNode.tag, nbNode.valueStart, nbNode.length);
  }
  if (validityChildren.length >= 2) {
    const naNode = validityChildren[1];
    notAfter = parseTime(der, naNode.tag, naNode.valueStart, naNode.length);
  }
  pos += node.totalLength;

  // subject Name
  if (pos < tbsEnd) {
    node = readTlv(der, pos);
    subject = parseName(der, node.valueStart, node.length);
  }

  return { subject, issuer, notBefore, notAfter };
}

// ─── Chain Analysis ───────────────────────────────────────────────────────────

export function analyzeChain(input: string): ChainAnalysis {
  const pems = splitPems(input);
  const errors: string[] = [];

  if (pems.length === 0) {
    return { certs: [], ordered: [], isComplete: false, errors: ['No PEM certificates found'] };
  }

  const parsed: ParsedCert[] = [];
  for (let i = 0; i < pems.length; i++) {
    try {
      parsed.push(parsePemCert(pems[i]));
    } catch (e: unknown) {
      parsed.push({ subject: 'Parse error', issuer: 'Parse error', notBefore: '', notAfter: '' });
      errors.push('Cert ' + (i + 1) + ': ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }

  // Build cert info
  const certs: CertInfo[] = parsed.map((p, i) => {
    const selfSigned = p.subject === p.issuer && p.subject !== '' && p.subject !== 'Parse error';
    return {
      index: i,
      pem: pems[i],
      subject: p.subject || '(unknown)',
      issuer: p.issuer || '(unknown)',
      notBefore: p.notBefore,
      notAfter: p.notAfter,
      role: 'leaf' as const,
      chainsTo: null,
      chainValid: false,
      selfSigned,
    };
  });

  // Determine chaining: cert A chains to cert B if A.issuer === B.subject
  for (let i = 0; i < certs.length; i++) {
    for (let j = 0; j < certs.length; j++) {
      if (i === j) continue;
      if (certs[i].issuer === certs[j].subject && certs[i].issuer !== '') {
        certs[i].chainsTo = j;
        certs[i].chainValid = true;
        break;
      }
    }
  }

  // Assign roles
  for (const cert of certs) {
    if (cert.selfSigned) {
      cert.role = 'root';
    } else if (certs.some(c => c.chainsTo === cert.index)) {
      cert.role = 'intermediate';
    } else {
      cert.role = 'leaf';
    }
  }

  // Build ordered list: start from leaf, follow chain
  const ordered: number[] = [];
  const leaves = certs.filter(c => c.role === 'leaf');
  if (leaves.length > 0) {
    let current: CertInfo | undefined = leaves[0];
    const visited = new Set<number>();
    while (current && !visited.has(current.index)) {
      ordered.push(current.index);
      visited.add(current.index);
      if (current.chainsTo !== null) {
        current = certs[current.chainsTo];
      } else {
        break;
      }
    }
  }

  // Add any unvisited certs
  for (const cert of certs) {
    if (!ordered.includes(cert.index)) ordered.push(cert.index);
  }

  const isComplete = certs.length > 0 && certs.some(c => c.role === 'root') && certs.some(c => c.role === 'leaf');

  return { certs, ordered, isComplete, errors };
}
