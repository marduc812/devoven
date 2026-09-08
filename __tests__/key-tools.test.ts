import { createPublicKey, createPrivateKey } from 'crypto';
import {
  parseAsn1Text,
  parseDer,
  readAnyEncoding,
  encodeOid,
  decodeOid,
  lookupOid,
  formatOidLookup,
  bytesToHex,
  hexToBytes,
  derToPem,
  writeSequence,
  writeInteger,
  writeIntegerFromBytes,
  ASN1_SAMPLE,
} from '@/Components/Functions/Asn1Tools/logic';
import {
  extractPublicKey,
  publicKeyPem,
  formatPublicKey,
  parseCsr,
  formatCsr,
  jwkToPem,
  pemToJwk,
} from '@/Components/Functions/KeyTools/logic';
import {
  RSA_PUBLIC, RSA_PKCS8, RSA_PKCS1,
  CERT, CSR,
  EC_PUBLIC, EC_PKCS8, EC_SEC1,
} from './fixtures/keys';

const normalize = (pem: string) => pem.replace(/\s+/g, '');

describe('ASN.1 DER', () => {
  it('parses a nested structure with the right offsets', () => {
    const nodes = parseDer(hexToBytes('30 06 02 01 01 02 01 02'));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe('SEQUENCE');
    expect(nodes[0].start).toBe(0);
    expect(nodes[0].children).toHaveLength(2);
    expect(nodes[0].children![0].start).toBe(2);
    expect(nodes[0].children![1].start).toBe(5);
    expect(nodes[0].children![1].value).toBe('2');
  });

  it('keeps offsets absolute at any depth', () => {
    // SEQUENCE { SEQUENCE { SEQUENCE { INTEGER 7 } } }
    const nodes = parseDer(hexToBytes('30 09 30 07 30 05 30 03 02 01 07'));
    const deepest = nodes[0].children![0].children![0].children![0].children![0];
    expect(deepest.value).toBe('7');
    expect(deepest.start).toBe(8);
  });

  it('reads the value of each universal type', () => {
    expect(parseDer(hexToBytes('0101ff'))[0].value).toBe('true');
    expect(parseDer(hexToBytes('020200ff'))[0].value).toBe('255');
    expect(parseDer(hexToBytes('0201ff'))[0].value).toBe('-1');
    expect(parseDer(hexToBytes('0500'))[0].value).toBe('');
    expect(parseDer(hexToBytes('0c0568656c6c6f'))[0].value).toBe('hello');
    expect(parseDer(hexToBytes('06082a8648ce3d030107'))[0].value)
      .toBe('1.2.840.10045.3.1.7 (prime256v1 (P-256))');
  });

  it('names context-specific tags', () => {
    expect(parseDer(hexToBytes('a003020102'))[0].name).toBe('[0]');
  });

  it('parses DER hiding inside an OCTET STRING', () => {
    const nodes = parseDer(hexToBytes('0403020101'));
    expect(nodes[0].name).toBe('OCTET STRING');
    expect(nodes[0].children![0].value).toBe('1');
  });

  it('leaves an octet string of plain bytes alone', () => {
    const nodes = parseDer(hexToBytes('0403aabbcc'));
    expect(nodes[0].children).toBe(null);
    expect(nodes[0].value).toBe('aabbcc');
  });

  it('reports lengths that do not fit', () => {
    expect(() => parseDer(hexToBytes('30 08 02 01 01'))).toThrow('claims 8 bytes');
    expect(() => parseDer(hexToBytes('3080'))).toThrow('Indefinite lengths');
    expect(() => parseDer(new Uint8Array())).toThrow('No bytes to parse');
  });

  it('renders a readable tree', () => {
    const text = parseAsn1Text(ASN1_SAMPLE);
    expect(text).toContain('SEQUENCE');
    expect(text).toContain('id-ecPublicKey');
    expect(text).toContain('prime256v1');
  });

  it('reads PEM, Base64 and hex alike', () => {
    expect(bytesToHex(readAnyEncoding('30 03 02 01 07'))).toBe('3003020107');
    expect(bytesToHex(readAnyEncoding('MAMCAQc='))).toBe('3003020107');
    expect(readAnyEncoding(RSA_PUBLIC).length).toBeGreaterThan(200);
    expect(() => readAnyEncoding('  ')).toThrow('Paste a PEM block');
  });

  it('writes integers with the DER sign rules', () => {
    expect(bytesToHex(writeInteger(0))).toBe('020100');
    expect(bytesToHex(writeInteger(127))).toBe('02017f');
    expect(bytesToHex(writeInteger(128))).toBe('02020080');
    expect(bytesToHex(writeIntegerFromBytes(hexToBytes('0000ff')))).toBe('020200ff');
  });

  it('round-trips a sequence it wrote', () => {
    const der = writeSequence(writeInteger(1), writeInteger(65537));
    expect(parseDer(der)[0].children!.map((c) => c.value)).toEqual(['1', '65537']);
  });
});

describe('OIDs', () => {
  it('encodes and decodes the shared first byte', () => {
    expect(bytesToHex(encodeOid('1.2.840.113549'))).toBe('2a864886f70d');
    expect(decodeOid(hexToBytes('2a864886f70d'))).toBe('1.2.840.113549');
    expect(decodeOid(encodeOid('2.5.4.3'))).toBe('2.5.4.3');
    expect(decodeOid(encodeOid('0.9.2342.19200300.100.1.1'))).toBe('0.9.2342.19200300.100.1.1');
  });

  it('handles a second arc above 39 when the first is 2', () => {
    expect(decodeOid(encodeOid('2.100.3'))).toBe('2.100.3');
    expect(() => encodeOid('1.40.3')).toThrow('must be under 40');
    expect(() => encodeOid('3.1.1')).toThrow('must be 0, 1 or 2');
  });

  it('looks an OID up in either direction', () => {
    const byDots = lookupOid('1.2.840.10045.3.1.7');
    expect(byDots.name).toBe('prime256v1 (P-256)');
    expect(byDots.derHex).toBe('06082a8648ce3d030107');

    const byHex = lookupOid('06082a8648ce3d030107');
    expect(byHex.oid).toBe('1.2.840.10045.3.1.7');
    expect(lookupOid('2a8648ce3d030107').oid).toBe('1.2.840.10045.3.1.7');
    expect(formatOidLookup(byHex)).toContain('prime256v1');
  });

  it('says when an OID is not in the table', () => {
    expect(lookupOid('1.3.6.1.4.1.99999.1').name).toBe(null);
    expect(() => lookupOid('')).toThrow('Enter an OID');
    expect(() => lookupOid('1')).toThrow('at least two arcs');
  });
});

describe('extractPublicKey', () => {
  const expected = normalize(RSA_PUBLIC);

  it('finds the same RSA key in every container it can be in', () => {
    for (const source of [RSA_PUBLIC, RSA_PKCS8, RSA_PKCS1, CERT, CSR]) {
      expect(normalize(publicKeyPem(source))).toBe(expected);
    }
  });

  it('names where it read the key from', () => {
    expect(extractPublicKey(CERT).source).toBe('certificate');
    expect(extractPublicKey(CSR).source).toBe('certificate signing request');
    expect(extractPublicKey(RSA_PKCS8).source).toBe('PKCS#8 RSA private key');
    expect(extractPublicKey(RSA_PKCS1).source).toBe('PKCS#1 RSA private key');
    expect(extractPublicKey(EC_SEC1).source).toBe('SEC1 EC private key');
  });

  it('reports the key parameters', () => {
    const rsa = extractPublicKey(CERT);
    expect(rsa.algorithm).toBe('rsaEncryption');
    expect(rsa.modulusBits).toBe(2048);
    expect(rsa.exponent).toBe('65537');

    const ec = extractPublicKey(EC_PKCS8);
    expect(ec.algorithm).toBe('id-ecPublicKey');
    expect(ec.curve).toBe('prime256v1 (P-256)');
  });

  it('finds the same EC key in every container', () => {
    const expectedEc = normalize(EC_PUBLIC);
    for (const source of [EC_PUBLIC, EC_PKCS8, EC_SEC1]) {
      expect(normalize(publicKeyPem(source))).toBe(expectedEc);
    }
  });

  it('produces a key OpenSSL and Node agree on', () => {
    const derived = publicKeyPem(RSA_PKCS8);
    const viaNode = createPublicKey(RSA_PKCS8).export({ type: 'spki', format: 'pem' }) as string;
    expect(normalize(derived)).toBe(normalize(viaNode));
  });

  it('formats a readable report', () => {
    const text = formatPublicKey(extractPublicKey(CERT));
    expect(text).toContain('BEGIN PUBLIC KEY');
    expect(text).toContain('2048 bits');
  });

  it('refuses things that are not keys', () => {
    expect(() => extractPublicKey('30030201 07')).toThrow('not a certificate, a CSR or a key');
    expect(() => extractPublicKey('hello there')).toThrow();
  });
});

describe('parseCsr', () => {
  it('reads the subject, the algorithm and the key', () => {
    const csr = parseCsr(CSR);
    expect(csr.subject).toBe('C=GB, O=DevOven, CN=example.com');
    expect(csr.signatureAlgorithm).toBe('sha256WithRSAEncryption');
    expect(csr.version).toBe(0);
    expect(csr.publicKey.modulusBits).toBe(2048);
    expect(normalize(csr.publicKeyPem)).toBe(normalize(RSA_PUBLIC));
  });

  it('reads the subject alternative names out of the extension request', () => {
    expect(parseCsr(CSR).subjectAltNames).toEqual([
      'DNS:example.com',
      'DNS:www.example.com',
      'IP:127.0.0.1',
    ]);
  });

  it('formats a readable report', () => {
    const text = formatCsr(parseCsr(CSR));
    expect(text).toContain('CN=example.com');
    expect(text).toContain('DNS:www.example.com');
    expect(text).toContain('BEGIN PUBLIC KEY');
  });

  it('refuses something that is not a CSR', () => {
    expect(() => parseCsr(RSA_PUBLIC)).toThrow('a body, an algorithm and a signature');
  });
});

describe('JWK and PEM', () => {
  it('matches what Node exports for an RSA key', () => {
    const mine = JSON.parse(pemToJwk(RSA_PUBLIC));
    const theirs = createPublicKey(RSA_PUBLIC).export({ format: 'jwk' });
    expect(mine.kty).toBe('RSA');
    expect(mine.n).toBe(theirs.n);
    expect(mine.e).toBe(theirs.e);
  });

  it('matches what Node exports for an EC key', () => {
    const mine = JSON.parse(pemToJwk(EC_PUBLIC));
    const theirs = createPublicKey(EC_PUBLIC).export({ format: 'jwk' });
    expect(mine).toEqual({ kty: 'EC', crv: theirs.crv, x: theirs.x, y: theirs.y });
  });

  it('turns a public JWK back into the PEM it came from', () => {
    expect(normalize(jwkToPem(pemToJwk(RSA_PUBLIC)))).toBe(normalize(RSA_PUBLIC));
    expect(normalize(jwkToPem(pemToJwk(EC_PUBLIC)))).toBe(normalize(EC_PUBLIC));
  });

  it('turns a private JWK into a PKCS#8 key Node accepts', () => {
    const rsaJwk = createPrivateKey(RSA_PKCS8).export({ format: 'jwk' });
    const pem = jwkToPem(JSON.stringify(rsaJwk));
    expect(pem).toContain('BEGIN PRIVATE KEY');
    expect(normalize(createPrivateKey(pem).export({ type: 'pkcs8', format: 'pem' }) as string))
      .toBe(normalize(RSA_PKCS8));

    const ecJwk = createPrivateKey(EC_PKCS8).export({ format: 'jwk' });
    const ecPem = jwkToPem(JSON.stringify(ecJwk));
    expect(normalize(createPrivateKey(ecPem).export({ type: 'pkcs8', format: 'pem' }) as string))
      .toBe(normalize(EC_PKCS8));
  });

  it('takes the first key of a JWK Set', () => {
    const jwk = JSON.parse(pemToJwk(RSA_PUBLIC));
    expect(normalize(jwkToPem(JSON.stringify({ keys: [jwk] })))).toBe(normalize(RSA_PUBLIC));
  });

  it('handles an OKP key', () => {
    const pem = jwkToPem('{"kty":"OKP","crv":"Ed25519","x":"11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"}');
    expect(pem).toContain('BEGIN PUBLIC KEY');
    const back = JSON.parse(pemToJwk(pem));
    expect(back).toEqual({
      kty: 'OKP',
      crv: 'Ed25519',
      x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
    });
  });

  it('says what a bad JWK is missing', () => {
    expect(() => jwkToPem('{"kty":"RSA"}')).toThrow('needs "n"');
    expect(() => jwkToPem('{"kty":"EC","crv":"P-256","x":"AA"}')).toThrow('needs "y"');
    expect(() => jwkToPem('{"kty":"EC","crv":"P-999","x":"AA","y":"AA"}')).toThrow('not a curve');
    expect(() => jwkToPem('{"kty":"oct","k":"AA"}')).toThrow('not supported');
    expect(() => jwkToPem('{"n":"AA"}')).toThrow('needs a "kty"');
    expect(() => jwkToPem('{oops}')).toThrow('Not valid JSON');
    expect(() => jwkToPem('  ')).toThrow('Paste a JWK');
  });

  it('will not invent a private RSA key from d alone', () => {
    expect(() => jwkToPem('{"kty":"RSA","n":"AQAB","e":"AQAB","d":"AQAB"}')).toThrow('needs "p"');
  });
});

describe('derToPem', () => {
  it('wraps at 64 characters with the label given', () => {
    const pem = derToPem(new Uint8Array(100), 'TEST');
    expect(pem.split('\n')[0]).toBe('-----BEGIN TEST-----');
    expect(pem.split('\n')[1]).toHaveLength(64);
    expect(pem.trim().endsWith('-----END TEST-----')).toBe(true);
  });
});
