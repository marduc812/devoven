// ─── Public keys, CSRs and JWKs ──────────────────────────────────────────────
// The plumbing around a key: pulling the public half out of a certificate, a
// CSR or a private key, reading a PKCS#10 request, and moving a key between
// JWK and PEM. All of it sits on the DER reader and writer in Asn1Tools.

import {
  Asn1Node,
  DN_SHORT_NAMES,
  OID_NAMES,
  bytesToHex,
  concat,
  decodeOid,
  derToPem,
  parseDer,
  pemLabel,
  readAnyEncoding,
  writeBitString,
  writeInteger,
  writeIntegerFromBytes,
  writeNull,
  writeOctetString,
  writeOid,
  writeSequence,
  writeTlv,
} from '@/Components/Functions/Asn1Tools/logic';

// ─── base64url ────────────────────────────────────────────────────────────────

export function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) throw new Error('A JWK field is not valid base64url');
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Curves ───────────────────────────────────────────────────────────────────

type CurveInfo = { jwk: string; oid: string; size: number };

const CURVES: CurveInfo[] = [
  { jwk: 'P-256', oid: '1.2.840.10045.3.1.7', size: 32 },
  { jwk: 'P-384', oid: '1.3.132.0.34', size: 48 },
  { jwk: 'P-521', oid: '1.3.132.0.35', size: 66 },
  { jwk: 'secp256k1', oid: '1.3.132.0.10', size: 32 },
];

const EC_PUBLIC_KEY_OID = '1.2.840.10045.2.1';
const RSA_OID = '1.2.840.113549.1.1.1';
const ED25519_OID = '1.3.101.112';
const ED448_OID = '1.3.101.113';

function curveByJwk(name: string): CurveInfo {
  const found = CURVES.find((c) => c.jwk === name);
  if (!found) throw new Error(`"${name}" is not a curve this supports (${CURVES.map((c) => c.jwk).join(', ')})`);
  return found;
}

function curveByOid(oid: string): CurveInfo {
  const found = CURVES.find((c) => c.oid === oid);
  if (!found) throw new Error(`Curve ${oid} is not one this supports`);
  return found;
}

// ─── Small node helpers ───────────────────────────────────────────────────────

const isSequence = (node: Asn1Node) => node.tagClass === 'universal' && node.tagNumber === 0x10;
const isInteger = (node: Asn1Node) => node.tagClass === 'universal' && node.tagNumber === 0x02;
const isBitString = (node: Asn1Node) => node.tagClass === 'universal' && node.tagNumber === 0x03;
const isOctetString = (node: Asn1Node) => node.tagClass === 'universal' && node.tagNumber === 0x04;

function children(node: Asn1Node, what: string): Asn1Node[] {
  if (!node.children) throw new Error(`Expected a structure for the ${what}`);
  return node.children;
}

/** An INTEGER's content with any DER sign padding removed. */
function integerBytes(node: Asn1Node): Uint8Array {
  let start = 0;
  while (start < node.content.length - 1 && node.content[start] === 0) start++;
  return node.content.subarray(start);
}

function bitStringBytes(node: Asn1Node): Uint8Array {
  if (node.content.length === 0) throw new Error('An empty BIT STRING');
  return node.content.subarray(1);
}

/** Re-serializes a node exactly as it was read. */
function nodeDer(node: Asn1Node, source: Uint8Array): Uint8Array {
  return source.subarray(node.start, node.start + node.totalLength);
}

// ─── SubjectPublicKeyInfo ─────────────────────────────────────────────────────

export type PublicKeyInfo = {
  /** The SPKI DER, ready to be armoured as a PUBLIC KEY. */
  der: Uint8Array;
  algorithm: string;
  algorithmOid: string;
  /** Set for RSA. */
  modulusBits?: number;
  exponent?: string;
  /** Set for EC. */
  curve?: string;
};

function describeSpki(spki: Asn1Node): PublicKeyInfo {
  const parts = children(spki, 'public key');
  if (parts.length < 2) throw new Error('A SubjectPublicKeyInfo needs an algorithm and a key');
  const algorithm = children(parts[0], 'algorithm');
  const oid = decodeOid(algorithm[0].content);

  const info: PublicKeyInfo = {
    der: new Uint8Array(),
    algorithm: OID_NAMES[oid] ?? oid,
    algorithmOid: oid,
  };

  if (oid === RSA_OID) {
    // The BIT STRING wraps RSAPublicKey ::= SEQUENCE { modulus, exponent }.
    const inner = parts[1].children?.[0];
    if (inner?.children && inner.children.length >= 2) {
      const modulus = integerBytes(inner.children[0]);
      info.modulusBits = modulus.length * 8 - Math.clz32(modulus[0]) + 24;
      info.exponent = BigInt('0x' + (bytesToHex(integerBytes(inner.children[1])) || '0')).toString();
    }
  } else if (oid === EC_PUBLIC_KEY_OID && algorithm.length > 1) {
    const curveOid = decodeOid(algorithm[1].content);
    info.curve = OID_NAMES[curveOid] ?? curveOid;
  }

  return info;
}

/**
 * Pulls the SubjectPublicKeyInfo out of whatever was pasted: a certificate, a
 * CSR, a private key in any of the three usual containers, or a public key
 * that only needs rewrapping.
 */
export function extractPublicKey(input: string): PublicKeyInfo & { source: string } {
  const der = readAnyEncoding(input);
  const label = input.includes('-----BEGIN') ? pemLabel(input) : null;
  const nodes = parseDer(der);
  if (nodes.length === 0 || !isSequence(nodes[0])) throw new Error('That does not start with a DER SEQUENCE');
  const root = nodes[0];
  const top = children(root, 'value');

  const finish = (spki: Asn1Node, source: string, sourceDer: Uint8Array): PublicKeyInfo & { source: string } => ({
    ...describeSpki(spki),
    der: nodeDer(spki, sourceDer),
    source,
  });

  // Already a SubjectPublicKeyInfo: SEQUENCE { AlgorithmIdentifier, BIT STRING }
  if (top.length === 2 && isSequence(top[0]) && isBitString(top[1])) {
    return finish(root, 'public key', der);
  }

  // PKCS#1 RSAPublicKey: SEQUENCE { INTEGER modulus, INTEGER exponent }
  if (top.length === 2 && isInteger(top[0]) && isInteger(top[1]) && label !== 'RSA PRIVATE KEY') {
    const spkiDer = rsaSpki(integerBytes(top[0]), integerBytes(top[1]));
    const reparsed = parseDer(spkiDer)[0];
    return { ...describeSpki(reparsed), der: spkiDer, source: 'PKCS#1 RSA public key' };
  }

  // Certificate: SEQUENCE { tbsCertificate, AlgorithmIdentifier, BIT STRING }
  if (top.length === 3 && isSequence(top[0]) && isSequence(top[1]) && isBitString(top[2])) {
    const tbs = children(top[0], 'certificate body');

    // A CSR has the same outer shape; the body tells them apart.
    if (tbs.length >= 3 && isInteger(tbs[0]) && isSequence(tbs[1]) && isSequence(tbs[2]) &&
        tbs[2].children?.length === 2 && isBitString(tbs[2].children[1])) {
      return finish(tbs[2], 'certificate signing request', der);
    }

    const offset = tbs[0].tagClass === 'context' ? 1 : 0;
    const spki = tbs[offset + 5];
    if (!spki || !isSequence(spki)) throw new Error('Cannot find the public key in that certificate');
    return finish(spki, 'certificate', der);
  }

  // PKCS#8: SEQUENCE { INTEGER version, AlgorithmIdentifier, OCTET STRING key }
  if (top.length >= 3 && isInteger(top[0]) && isSequence(top[1]) && isOctetString(top[2])) {
    const algorithm = children(top[1], 'algorithm');
    const oid = decodeOid(algorithm[0].content);
    const inner = parseDer(top[2].content)[0];

    if (oid === RSA_OID) {
      const rsa = children(inner, 'RSA private key');
      const spkiDer = rsaSpki(integerBytes(rsa[1]), integerBytes(rsa[2]));
      return { ...describeSpki(parseDer(spkiDer)[0]), der: spkiDer, source: 'PKCS#8 RSA private key' };
    }
    if (oid === EC_PUBLIC_KEY_OID) {
      const curveOid = algorithm.length > 1 ? decodeOid(algorithm[1].content) : null;
      const spkiDer = ecSpkiFromPrivate(inner, curveOid);
      return { ...describeSpki(parseDer(spkiDer)[0]), der: spkiDer, source: 'PKCS#8 EC private key' };
    }
    if (oid === ED25519_OID || oid === ED448_OID) {
      throw new Error('An Ed25519 or Ed448 private key does not carry its public half in the clear');
    }
    throw new Error(`Private keys of type ${OID_NAMES[oid] ?? oid} are not supported`);
  }

  // PKCS#1 RSAPrivateKey: SEQUENCE { version, n, e, d, p, q, dp, dq, qi }
  if (top.length >= 9 && top.every(isInteger)) {
    const spkiDer = rsaSpki(integerBytes(top[1]), integerBytes(top[2]));
    return { ...describeSpki(parseDer(spkiDer)[0]), der: spkiDer, source: 'PKCS#1 RSA private key' };
  }

  // SEC1 ECPrivateKey: SEQUENCE { version, OCTET STRING, [0] curve, [1] public }
  if (top.length >= 2 && isInteger(top[0]) && isOctetString(top[1])) {
    const spkiDer = ecSpkiFromPrivate(root, null);
    return { ...describeSpki(parseDer(spkiDer)[0]), der: spkiDer, source: 'SEC1 EC private key' };
  }

  throw new Error('That is not a certificate, a CSR or a key this recognises');
}

function rsaSpki(modulus: Uint8Array, exponent: Uint8Array): Uint8Array {
  const rsaPublicKey = writeSequence(writeIntegerFromBytes(modulus), writeIntegerFromBytes(exponent));
  return writeSequence(writeSequence(writeOid(RSA_OID), writeNull()), writeBitString(rsaPublicKey));
}

function ecSpkiFromPrivate(ecPrivateKey: Asn1Node, fallbackCurveOid: string | null): Uint8Array {
  const parts = children(ecPrivateKey, 'EC private key');
  const curveNode = parts.find((p) => p.tagClass === 'context' && p.tagNumber === 0);
  const publicNode = parts.find((p) => p.tagClass === 'context' && p.tagNumber === 1);

  const curveOid = curveNode?.children?.[0]
    ? decodeOid(curveNode.children[0].content)
    : fallbackCurveOid;
  if (!curveOid) throw new Error('That EC private key does not name its curve');

  const bitString = publicNode?.children?.[0] ?? publicNode;
  if (!bitString || !isBitString(bitString)) {
    throw new Error('That EC private key does not carry its public point');
  }
  return ecSpki(curveOid, bitStringBytes(bitString));
}

function ecSpki(curveOid: string, point: Uint8Array): Uint8Array {
  return writeSequence(
    writeSequence(writeOid(EC_PUBLIC_KEY_OID), writeOid(curveOid)),
    writeBitString(point),
  );
}

export function formatPublicKey(result: PublicKeyInfo & { source: string }): string {
  const lines = [derToPem(result.der, 'PUBLIC KEY'), ''];
  lines.push(`Read from:   ${result.source}`);
  lines.push(`Algorithm:   ${result.algorithm}`);
  if (result.modulusBits) lines.push(`Key size:    ${result.modulusBits} bits`);
  if (result.exponent) lines.push(`Exponent:    ${result.exponent}`);
  if (result.curve) lines.push(`Curve:       ${result.curve}`);
  return lines.join('\n');
}

/** The pipeline form: any container in, a PUBLIC KEY PEM out. */
export function publicKeyPem(input: string): string {
  return derToPem(extractPublicKey(input).der, 'PUBLIC KEY');
}

// ─── CSR (PKCS#10) ────────────────────────────────────────────────────────────

export type CsrInfo = {
  version: number;
  subject: string;
  publicKey: PublicKeyInfo;
  publicKeyPem: string;
  signatureAlgorithm: string;
  subjectAltNames: string[];
  attributes: string[];
  challengePassword: string | null;
};

/** `CN=example.com, O=Acme`, in the order the DN was written. */
function readName(name: Asn1Node): string {
  const parts: string[] = [];
  for (const rdn of name.children ?? []) {
    for (const attribute of rdn.children ?? []) {
      const pair = attribute.children ?? [];
      if (pair.length < 2) continue;
      const oid = decodeOid(pair[0].content);
      const label = DN_SHORT_NAMES[oid] ?? OID_NAMES[oid] ?? oid;
      parts.push(`${label}=${new TextDecoder().decode(pair[1].content)}`);
    }
  }
  return parts.join(', ');
}

const GENERAL_NAME_KINDS: Record<number, string> = {
  1: 'email', 2: 'DNS', 4: 'DN', 6: 'URI', 7: 'IP', 8: 'RID',
};

function readGeneralName(node: Asn1Node): string {
  const kind = GENERAL_NAME_KINDS[node.tagNumber] ?? `[${node.tagNumber}]`;
  if (node.tagNumber === 7) {
    // An IP address is raw bytes: four for v4, sixteen for v6.
    if (node.content.length === 4) return `IP:${[...node.content].join('.')}`;
    if (node.content.length === 16) {
      const groups: string[] = [];
      for (let i = 0; i < 16; i += 2) {
        groups.push(((node.content[i] << 8) | node.content[i + 1]).toString(16));
      }
      return `IP:${groups.join(':')}`;
    }
    return `IP:${bytesToHex(node.content)}`;
  }
  return `${kind}:${new TextDecoder().decode(node.content)}`;
}

export function parseCsr(input: string): CsrInfo {
  const der = readAnyEncoding(input);
  const nodes = parseDer(der);
  if (nodes.length === 0 || !isSequence(nodes[0])) throw new Error('That does not look like a CSR');
  const top = children(nodes[0], 'request');
  if (top.length !== 3) throw new Error('A CSR has a body, an algorithm and a signature');

  const info = children(top[0], 'request body');
  if (info.length < 3) throw new Error('The request body is missing its subject or public key');

  const version = Number(info[0].content[0] ?? 0);
  const subject = readName(info[1]);
  const publicKey = { ...describeSpki(info[2]), der: nodeDer(info[2], der) };
  const signatureOid = decodeOid(children(top[1], 'signature algorithm')[0].content);

  const subjectAltNames: string[] = [];
  const attributes: string[] = [];
  let challengePassword: string | null = null;

  for (const attribute of info[3]?.children ?? []) {
    const pair = attribute.children ?? [];
    if (pair.length < 2) continue;
    const oid = decodeOid(pair[0].content);

    if (oid === '1.2.840.113549.1.9.14') {
      // extensionRequest: a SET holding a SEQUENCE of Extensions.
      for (const extension of pair[1].children?.[0]?.children ?? []) {
        const extParts = extension.children ?? [];
        if (extParts.length < 2) continue;
        const extOid = decodeOid(extParts[0].content);
        const valueNode = extParts[extParts.length - 1];
        if (extOid === '2.5.29.17') {
          for (const general of valueNode.children?.[0]?.children ?? []) {
            subjectAltNames.push(readGeneralName(general));
          }
        } else {
          attributes.push(`${OID_NAMES[extOid] ?? extOid}: ${bytesToHex(valueNode.content)}`);
        }
      }
      continue;
    }

    if (oid === '1.2.840.113549.1.9.7') {
      challengePassword = new TextDecoder().decode(pair[1].children?.[0]?.content ?? new Uint8Array());
      continue;
    }

    attributes.push(`${OID_NAMES[oid] ?? oid}: ${bytesToHex(pair[1].content)}`);
  }

  return {
    version,
    subject,
    publicKey,
    publicKeyPem: derToPem(publicKey.der, 'PUBLIC KEY'),
    signatureAlgorithm: OID_NAMES[signatureOid] ?? signatureOid,
    subjectAltNames,
    attributes,
    challengePassword,
  };
}

export function formatCsr(csr: CsrInfo): string {
  const lines = [
    `Version:      ${csr.version} (PKCS#10 v${csr.version + 1})`,
    `Subject:      ${csr.subject || '(empty)'}`,
    `Signed with:  ${csr.signatureAlgorithm}`,
    '',
    `Public key:   ${csr.publicKey.algorithm}`,
  ];
  if (csr.publicKey.modulusBits) lines.push(`Key size:     ${csr.publicKey.modulusBits} bits`);
  if (csr.publicKey.exponent) lines.push(`Exponent:     ${csr.publicKey.exponent}`);
  if (csr.publicKey.curve) lines.push(`Curve:        ${csr.publicKey.curve}`);

  if (csr.subjectAltNames.length) {
    lines.push('', 'Subject alternative names:');
    for (const name of csr.subjectAltNames) lines.push(`  ${name}`);
  }
  if (csr.challengePassword !== null) {
    lines.push('', `Challenge password: ${csr.challengePassword}`);
  }
  if (csr.attributes.length) {
    lines.push('', 'Other attributes:');
    for (const attribute of csr.attributes) lines.push(`  ${attribute}`);
  }

  lines.push('', csr.publicKeyPem);
  return lines.join('\n');
}

// ─── JWK to PEM ───────────────────────────────────────────────────────────────

type Jwk = {
  kty?: string;
  n?: string; e?: string;
  d?: string; p?: string; q?: string; dp?: string; dq?: string; qi?: string;
  crv?: string; x?: string; y?: string;
};

function required(jwk: Jwk, field: keyof Jwk, kind: string): string {
  const value = jwk[field];
  if (typeof value !== 'string' || value === '') throw new Error(`A ${kind} JWK needs "${field}"`);
  return value;
}

export function jwkToPem(json: string): string {
  const text = json.trim();
  if (!text) throw new Error('Paste a JWK');
  let jwk: Jwk;
  try {
    const parsed = JSON.parse(text) as Jwk & { keys?: Jwk[] };
    // A JWK Set is a common paste; take its first key rather than refusing.
    jwk = Array.isArray(parsed.keys) ? parsed.keys[0] : parsed;
  } catch (e: unknown) {
    throw new Error(`Not valid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
  }
  if (!jwk || typeof jwk !== 'object') throw new Error('That JSON is not a JWK');

  switch (jwk.kty) {
    case 'RSA': return rsaJwkToPem(jwk);
    case 'EC': return ecJwkToPem(jwk);
    case 'OKP': return okpJwkToPem(jwk);
    case undefined: throw new Error('A JWK needs a "kty"');
    default: throw new Error(`"kty": "${jwk.kty}" is not supported`);
  }
}

function rsaJwkToPem(jwk: Jwk): string {
  const n = base64UrlToBytes(required(jwk, 'n', 'RSA'));
  const e = base64UrlToBytes(required(jwk, 'e', 'RSA'));

  if (jwk.d === undefined) return derToPem(rsaSpki(n, e), 'PUBLIC KEY');

  for (const field of ['p', 'q', 'dp', 'dq', 'qi'] as const) {
    if (jwk[field] === undefined) {
      throw new Error(`A private RSA JWK needs "${field}" as well as "d" to become a PKCS#8 key`);
    }
  }
  const rsaPrivateKey = writeSequence(
    writeInteger(0),
    writeIntegerFromBytes(n),
    writeIntegerFromBytes(e),
    writeIntegerFromBytes(base64UrlToBytes(jwk.d)),
    writeIntegerFromBytes(base64UrlToBytes(jwk.p!)),
    writeIntegerFromBytes(base64UrlToBytes(jwk.q!)),
    writeIntegerFromBytes(base64UrlToBytes(jwk.dp!)),
    writeIntegerFromBytes(base64UrlToBytes(jwk.dq!)),
    writeIntegerFromBytes(base64UrlToBytes(jwk.qi!)),
  );
  const pkcs8 = writeSequence(
    writeInteger(0),
    writeSequence(writeOid(RSA_OID), writeNull()),
    writeOctetString(rsaPrivateKey),
  );
  return derToPem(pkcs8, 'PRIVATE KEY');
}

function ecJwkToPem(jwk: Jwk): string {
  const curve = curveByJwk(required(jwk, 'crv', 'EC'));
  const x = pad(base64UrlToBytes(required(jwk, 'x', 'EC')), curve.size);
  const y = pad(base64UrlToBytes(required(jwk, 'y', 'EC')), curve.size);
  const point = concat(new Uint8Array([0x04]), x, y);

  if (jwk.d === undefined) return derToPem(ecSpki(curve.oid, point), 'PUBLIC KEY');

  const d = pad(base64UrlToBytes(jwk.d), curve.size);
  const ecPrivateKey = writeSequence(
    writeInteger(1),
    writeOctetString(d),
    writeTlv(0xa0, writeOid(curve.oid)),
    writeTlv(0xa1, writeBitString(point)),
  );
  const pkcs8 = writeSequence(
    writeInteger(0),
    writeSequence(writeOid(EC_PUBLIC_KEY_OID), writeOid(curve.oid)),
    writeOctetString(ecPrivateKey),
  );
  return derToPem(pkcs8, 'PRIVATE KEY');
}

function okpJwkToPem(jwk: Jwk): string {
  const crv = required(jwk, 'crv', 'OKP');
  const oid = crv === 'Ed25519' ? ED25519_OID : crv === 'Ed448' ? ED448_OID : null;
  if (!oid) throw new Error(`"crv": "${crv}" is not supported`);
  const x = base64UrlToBytes(required(jwk, 'x', 'OKP'));

  if (jwk.d === undefined) {
    return derToPem(writeSequence(writeSequence(writeOid(oid)), writeBitString(x)), 'PUBLIC KEY');
  }
  const pkcs8 = writeSequence(
    writeInteger(0),
    writeSequence(writeOid(oid)),
    writeOctetString(writeOctetString(base64UrlToBytes(jwk.d))),
  );
  return derToPem(pkcs8, 'PRIVATE KEY');
}

/** JWK coordinates are fixed width for the curve; a short one is left-padded. */
function pad(bytes: Uint8Array, size: number): Uint8Array {
  if (bytes.length === size) return bytes;
  if (bytes.length > size) {
    // A stray leading zero is fine to drop; anything else is the wrong curve.
    let start = 0;
    while (start < bytes.length - size && bytes[start] === 0) start++;
    if (bytes.length - start !== size) throw new Error(`Expected ${size} bytes for this curve, got ${bytes.length}`);
    return bytes.subarray(start);
  }
  const out = new Uint8Array(size);
  out.set(bytes, size - bytes.length);
  return out;
}

// ─── PEM to JWK ───────────────────────────────────────────────────────────────

export function pemToJwk(input: string, indent = 2): string {
  const { der } = extractPublicKey(input);
  const spki = parseDer(der)[0];
  const parts = children(spki, 'public key');
  const algorithm = children(parts[0], 'algorithm');
  const oid = decodeOid(algorithm[0].content);

  if (oid === RSA_OID) {
    const inner = parts[1].children?.[0];
    if (!inner?.children || inner.children.length < 2) throw new Error('Cannot read that RSA key');
    return JSON.stringify({
      kty: 'RSA',
      n: bytesToBase64Url(integerBytes(inner.children[0])),
      e: bytesToBase64Url(integerBytes(inner.children[1])),
    }, null, indent);
  }

  if (oid === EC_PUBLIC_KEY_OID) {
    if (algorithm.length < 2) throw new Error('That EC key does not name its curve');
    const curve = curveByOid(decodeOid(algorithm[1].content));
    const point = bitStringBytes(parts[1]);
    if (point[0] !== 0x04) throw new Error('Only uncompressed EC points are supported');
    if (point.length !== 1 + curve.size * 2) throw new Error('The EC point is the wrong size for its curve');
    return JSON.stringify({
      kty: 'EC',
      crv: curve.jwk,
      x: bytesToBase64Url(point.subarray(1, 1 + curve.size)),
      y: bytesToBase64Url(point.subarray(1 + curve.size)),
    }, null, indent);
  }

  if (oid === ED25519_OID || oid === ED448_OID) {
    return JSON.stringify({
      kty: 'OKP',
      crv: oid === ED25519_OID ? 'Ed25519' : 'Ed448',
      x: bytesToBase64Url(bitStringBytes(parts[1])),
    }, null, indent);
  }

  throw new Error(`Keys of type ${OID_NAMES[oid] ?? oid} cannot be written as a JWK here`);
}
