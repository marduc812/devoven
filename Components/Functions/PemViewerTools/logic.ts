// Pure TypeScript — no browser APIs, no external libs.
// Parses PEM-encoded X.509 certificates using a minimal DER/ASN.1 parser.

// ─── Base64 decode ────────────────────────────────────────────────────────────

function base64Decode(b64: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleaned = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = chars.indexOf(cleaned[i]);
    const b = chars.indexOf(cleaned[i + 1]);
    const c = cleaned[i + 2] === '=' ? 0 : chars.indexOf(cleaned[i + 2]);
    const d = cleaned[i + 3] === '=' ? 0 : chars.indexOf(cleaned[i + 3]);
    bytes.push((a << 2) | (b >> 4));
    if (cleaned[i + 2] !== '=') bytes.push(((b & 0xf) << 4) | (c >> 2));
    if (cleaned[i + 3] !== '=') bytes.push(((c & 0x3) << 6) | d);
  }
  return bytes;
}

// ─── Minimal DER / ASN.1 parser ──────────────────────────────────────────────

interface AsnNode {
  tag: number;
  tagClass: number; // 0=universal, 1=application, 2=context, 3=private
  constructed: boolean;
  value: number[];
  children: AsnNode[];
}

function readLength(data: number[], offset: number): { len: number; nextOffset: number } {
  const first = data[offset];
  if (first < 0x80) return { len: first, nextOffset: offset + 1 };
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) {
    len = (len << 8) | data[offset + 1 + i];
  }
  return { len, nextOffset: offset + 1 + numBytes };
}

function parseNode(data: number[], offset: number): { node: AsnNode; nextOffset: number } {
  const tagByte = data[offset];
  const tagClass = (tagByte >> 6) & 0x3;
  const constructed = (tagByte & 0x20) !== 0;
  const tag = tagByte & 0x1f;
  const { len, nextOffset } = readLength(data, offset + 1);
  const value = data.slice(nextOffset, nextOffset + len);
  const children: AsnNode[] = [];
  if (constructed) {
    let childOffset = 0;
    while (childOffset < value.length) {
      const { node, nextOffset: no } = parseNode(value, childOffset);
      children.push(node);
      childOffset = no;
    }
  }
  return { node: { tag, tagClass, constructed, value, children }, nextOffset: nextOffset + len };
}

function parseAsn1(data: number[]): AsnNode {
  return parseNode(data, 0).node;
}

// ─── OID database ─────────────────────────────────────────────────────────────

const OID_MAP: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'STREET',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.12': 'TITLE',
  '2.5.4.42': 'GN',
  '2.5.4.43': 'I',
  '2.5.4.97': 'organizationIdentifier',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.15': 'keyUsage',
  '2.5.29.37': 'extKeyUsage',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.31': 'cRLDistributionPoints',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
  '1.2.840.113549.1.9.14': 'extensionRequest',
};

function decodeOid(bytes: number[]): string {
  if (bytes.length === 0) return '';
  const parts: number[] = [];
  const first = bytes[0];
  parts.push(Math.floor(first / 40));
  parts.push(first % 40);
  let val = 0;
  for (let i = 1; i < bytes.length; i++) {
    val = (val << 7) | (bytes[i] & 0x7f);
    if ((bytes[i] & 0x80) === 0) {
      parts.push(val);
      val = 0;
    }
  }
  const oidStr = parts.join('.');
  return OID_MAP[oidStr] ? OID_MAP[oidStr] + ' (' + oidStr + ')' : oidStr;
}

// ─── String decoding ──────────────────────────────────────────────────────────

function decodeUtf8(bytes: number[]): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 0x80) {
      str += String.fromCharCode(byte);
    } else if ((byte & 0xe0) === 0xc0 && i + 1 < bytes.length) {
      str += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 1;
    } else if ((byte & 0xf0) === 0xe0 && i + 2 < bytes.length) {
      str += String.fromCharCode(((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 2;
    } else {
      str += '?';
    }
  }
  return str;
}

function decodeString(node: AsnNode): string {
  // tag: 12=UTF8String, 19=PrintableString, 22=IA5String, 20=TeletexString, 28=BMPString
  if (node.tag === 30) {
    // BMPString: 2-byte chars
    let s = '';
    for (let i = 0; i + 1 < node.value.length; i += 2) {
      s += String.fromCharCode((node.value[i] << 8) | node.value[i + 1]);
    }
    return s;
  }
  return decodeUtf8(node.value);
}

function decodeUtcTime(bytes: number[]): string {
  const s = decodeUtf8(bytes);
  // Format: YYMMDDHHMMSSZ
  if (s.length >= 13) {
    const year = parseInt(s.slice(0, 2));
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${s.slice(2, 4)}-${s.slice(4, 6)} ${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)} UTC`;
  }
  return s;
}

function decodeGeneralizedTime(bytes: number[]): string {
  const s = decodeUtf8(bytes);
  // Format: YYYYMMDDHHMMSSZ
  if (s.length >= 15) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)} UTC`;
  }
  return s;
}

// ─── RDN parsing ──────────────────────────────────────────────────────────────

function parseRdn(seqNode: AsnNode): string {
  // Name ::= SEQUENCE OF RDNSequence
  const parts: string[] = [];
  for (const rdn of seqNode.children) {
    // RelativeDistinguishedName SET
    for (const atv of rdn.children) {
      // AttributeTypeAndValue SEQUENCE
      if (atv.children.length >= 2) {
        const oidNode = atv.children[0];
        const valNode = atv.children[1];
        const oidRaw = decodeOid(oidNode.value);
        const oidShort = oidRaw.split(' ')[0]; // just the short name
        const val = decodeString(valNode);
        parts.push(`${oidShort}=${val}`);
      }
    }
  }
  return parts.join(', ');
}

// ─── Hex formatting ──────────────────────────────────────────────────────────

function toHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(':');
}

// ─── Certificate fields ───────────────────────────────────────────────────────

export interface CertificateInfo {
  version: string;
  serialNumber: string;
  algorithm: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  isCA: string;
  subjectAltNames: string;
  keyUsage: string;
  raw: string;
}

export function parsePemCertificate(pem: string): CertificateInfo {
  if (!pem.trim()) {
    throw new Error('Empty input');
  }

  // Extract base64 content between PEM headers
  const beginMarker = '-----BEGIN CERTIFICATE-----';
  const endMarker = '-----END CERTIFICATE-----';
  const startIdx = pem.indexOf(beginMarker);
  const endIdx = pem.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No valid PEM certificate found. Make sure the input starts with -----BEGIN CERTIFICATE----- and ends with -----END CERTIFICATE-----');
  }

  const b64 = pem.slice(startIdx + beginMarker.length, endIdx).replace(/\s/g, '');
  const derBytes = base64Decode(b64);

  // Parse the outer SEQUENCE (Certificate)
  const certNode = parseAsn1(derBytes);
  if (certNode.tag !== 16 || !certNode.constructed) {
    throw new Error('Invalid DER: expected SEQUENCE at root');
  }

  // TBSCertificate is the first child
  const tbsCert = certNode.children[0];
  if (!tbsCert) throw new Error('Missing TBSCertificate');

  let fieldIdx = 0;

  // Version [0] EXPLICIT INTEGER (optional)
  let version = '1';
  if (tbsCert.children[fieldIdx] && tbsCert.children[fieldIdx].tagClass === 2 && tbsCert.children[fieldIdx].tag === 0) {
    const vNode = tbsCert.children[fieldIdx].children[0];
    if (vNode) version = String(vNode.value[0] + 1);
    fieldIdx++;
  }

  // Serial number
  const serialNode = tbsCert.children[fieldIdx++];
  const serial = serialNode ? toHex(serialNode.value) : 'unknown';

  // Algorithm
  const algSeq = tbsCert.children[fieldIdx++];
  let algorithm = 'unknown';
  if (algSeq && algSeq.children[0]) {
    algorithm = decodeOid(algSeq.children[0].value);
  }

  // Issuer
  const issuerNode = tbsCert.children[fieldIdx++];
  const issuer = issuerNode ? parseRdn(issuerNode) : 'unknown';

  // Validity
  const validityNode = tbsCert.children[fieldIdx++];
  let validFrom = 'unknown';
  let validTo = 'unknown';
  if (validityNode && validityNode.children.length >= 2) {
    const fromNode = validityNode.children[0];
    const toNode = validityNode.children[1];
    // tag 23 = UTCTime, tag 24 = GeneralizedTime
    validFrom = fromNode.tag === 23 ? decodeUtcTime(fromNode.value) : decodeGeneralizedTime(fromNode.value);
    validTo = toNode.tag === 23 ? decodeUtcTime(toNode.value) : decodeGeneralizedTime(toNode.value);
  }

  // Subject
  const subjectNode = tbsCert.children[fieldIdx++];
  const subject = subjectNode ? parseRdn(subjectNode) : 'unknown';

  // Extensions [3] EXPLICIT SEQUENCE OF (optional, v3 only)
  let isCA = 'No';
  let subjectAltNames = '';
  let keyUsage = '';

  for (let i = fieldIdx; i < tbsCert.children.length; i++) {
    const child = tbsCert.children[i];
    if (child.tagClass === 2 && child.tag === 3 && child.constructed) {
      // Extensions wrapper
      const extSeq = child.children[0];
      if (extSeq) {
        for (const ext of extSeq.children) {
          if (ext.children.length < 2) continue;
          const extOid = decodeOid(ext.children[0].value);

          // Basic Constraints
          if (extOid.startsWith('basicConstraints')) {
            // value is OCTET STRING containing a SEQUENCE
            const octetStr = ext.children[ext.children.length - 1];
            const innerNode = parseAsn1(octetStr.value);
            if (innerNode.children.length > 0 && innerNode.children[0].tag === 1) {
              // BOOLEAN
              isCA = innerNode.children[0].value[0] !== 0 ? 'Yes' : 'No';
            }
          }

          // Subject Alt Names
          if (extOid.startsWith('subjectAltName')) {
            const octetStr = ext.children[ext.children.length - 1];
            const innerNode = parseAsn1(octetStr.value);
            const names: string[] = [];
            for (const san of innerNode.children) {
              // tag 2 = dNSName, tag 7 = iPAddress
              if (san.tag === 2) {
                names.push('DNS:' + decodeUtf8(san.value));
              } else if (san.tag === 7 && san.value.length === 4) {
                names.push('IP:' + san.value.join('.'));
              } else if (san.tag === 1) {
                names.push('email:' + decodeUtf8(san.value));
              }
            }
            subjectAltNames = names.join(', ');
          }
        }
      }
    }
  }

  // Get outer signature algorithm
  const outerAlgSeq = certNode.children[1];
  let outerAlgorithm = algorithm;
  if (outerAlgSeq && outerAlgSeq.children[0]) {
    outerAlgorithm = decodeOid(outerAlgSeq.children[0].value);
  }

  return {
    version: `v${version}`,
    serialNumber: serial,
    algorithm: outerAlgorithm,
    issuer,
    subject,
    validFrom,
    validTo,
    isCA,
    subjectAltNames: subjectAltNames || 'None',
    keyUsage: keyUsage || 'Not specified',
    raw: `${derBytes.length} bytes`,
  };
}
