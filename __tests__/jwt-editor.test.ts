import {
  base64urlEncode,
  base64urlEncodeString,
  base64urlDecode,
  stringToBytes,
  buildJwt,
  decodeJwtParts,
  verifySignature,
  signJwt,
  verifyJwt,
  generateKeyPair,
  isAsymmetric,
  keyGroup,
  type JwtAlgorithm,
} from '@/Components/Functions/JwtEditorTools/logic';

describe('stringToBytes', () => {
  it('converts ASCII string', () => {
    expect(stringToBytes('ABC')).toEqual([65, 66, 67]);
  });

  it('converts empty string', () => {
    expect(stringToBytes('')).toEqual([]);
  });
});

describe('base64urlEncode', () => {
  it('encodes bytes without padding or url-unsafe chars', () => {
    const result = base64urlEncode([72, 101, 108, 108, 111]);
    expect(result).not.toContain('=');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });

  it('encodes known value', () => {
    // "Man" → "TWFu"
    expect(base64urlEncode([77, 97, 110])).toBe('TWFu');
  });
});

describe('base64urlDecode', () => {
  it('round-trips a JSON string', () => {
    const json = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    expect(base64urlDecode(base64urlEncodeString(json))).toBe(json);
  });
});

describe('buildJwt', () => {
  it('builds a valid JWT with 3 non-empty, unpadded parts', () => {
    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const payload = JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    const token = buildJwt(header, payload, 'secret', 'HS256');
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    parts.forEach(part => {
      expect(part.length).toBeGreaterThan(0);
      expect(part).not.toContain('=');
    });
  });

  it('matches the canonical jwt.io HS256 example', () => {
    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const payload = JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    const token = buildJwt(header, payload, 'your-256-bit-secret', 'HS256');
    expect(token).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
        '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
        '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    );
  });

  it('produces different tokens with different secrets', () => {
    const h = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const p = JSON.stringify({ sub: '1' });
    expect(buildJwt(h, p, 'secret1', 'HS256')).not.toBe(buildJwt(h, p, 'secret2', 'HS256'));
  });

  it('produces different tokens with different algorithms', () => {
    const h = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const p = JSON.stringify({ sub: '1' });
    const t256 = buildJwt(h, p, 'secret', 'HS256');
    const t384 = buildJwt(h, p, 'secret', 'HS384');
    const t512 = buildJwt(h, p, 'secret', 'HS512');
    expect(t256).not.toBe(t384);
    expect(t256).not.toBe(t512);
    expect(t384).not.toBe(t512);
  });

  it('throws on invalid header JSON', () => {
    expect(() => buildJwt('not-json', '{}', 'secret', 'HS256')).toThrow('Header JSON is invalid');
  });

  it('throws on invalid payload JSON', () => {
    expect(() => buildJwt('{}', 'not-json', 'secret', 'HS256')).toThrow('Payload JSON is invalid');
  });

  it('builds an unsigned token with an empty signature for the "none" algorithm', () => {
    const header = JSON.stringify({ alg: 'none', typ: 'JWT' });
    const payload = JSON.stringify({ sub: '1' });
    const token = buildJwt(header, payload, 'ignored', 'none');
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    expect(parts[2]).toBe('');
  });
});

describe('decodeJwtParts', () => {
  it('decodes a built JWT and detects the algorithm', () => {
    const h = JSON.stringify({ alg: 'HS512', typ: 'JWT' });
    const p = JSON.stringify({ sub: '1234567890', name: 'John Doe' });
    const token = buildJwt(h, p, 'secret', 'HS512');
    const decoded = decodeJwtParts(token);
    expect(JSON.parse(decoded.header).alg).toBe('HS512');
    expect(JSON.parse(decoded.payload).sub).toBe('1234567890');
    expect(decoded.algorithm).toBe('HS512');
    expect(decoded.signatureB64.length).toBeGreaterThan(0);
  });

  it('throws on invalid JWT format', () => {
    expect(() => decodeJwtParts('onlytwoparts.here')).toThrow();
  });
});

describe('verifySignature', () => {
  it('returns true for a token signed with the matching secret', () => {
    const h = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const p = JSON.stringify({ sub: '1' });
    const token = buildJwt(h, p, 'correct-secret', 'HS256');
    expect(verifySignature(token, 'correct-secret')).toBe(true);
  });

  it('returns false for a wrong secret', () => {
    const h = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const p = JSON.stringify({ sub: '1' });
    const token = buildJwt(h, p, 'correct-secret', 'HS256');
    expect(verifySignature(token, 'wrong-secret')).toBe(false);
  });

  it('verifies the canonical jwt.io example', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
      '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(verifySignature(token, 'your-256-bit-secret')).toBe(true);
    expect(verifySignature(token, 'nope')).toBe(false);
  });

  it('returns false for malformed tokens', () => {
    expect(verifySignature('a.b', 'secret')).toBe(false);
  });

  it('treats an unsigned "none" token as valid only with an empty signature', () => {
    const header = JSON.stringify({ alg: 'none', typ: 'JWT' });
    const payload = JSON.stringify({ sub: '1' });
    const token = buildJwt(header, payload, '', 'none');
    expect(verifySignature(token, '')).toBe(true);
    // A "none" token carrying a bogus signature is not valid.
    expect(verifySignature(token + 'tampered', '')).toBe(false);
  });
});

describe('decodeJwtParts (none)', () => {
  it('detects the "none" algorithm', () => {
    const token = buildJwt(
      JSON.stringify({ alg: 'none', typ: 'JWT' }),
      JSON.stringify({ sub: '1' }),
      '',
      'none'
    );
    expect(decodeJwtParts(token).algorithm).toBe('none');
  });

  it('detects asymmetric algorithms in the header', () => {
    const header = base64urlEncodeString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64urlEncodeString(JSON.stringify({ sub: '1' }));
    expect(decodeJwtParts(`${header}.${payload}.sig`).algorithm).toBe('RS256');
  });
});

describe('keyGroup', () => {
  it('shares one group across all RSA variants', () => {
    expect(keyGroup('RS256')).toBe('RSA');
    expect(keyGroup('PS512')).toBe('RSA');
  });

  it('gives each EC curve its own group', () => {
    expect(keyGroup('ES256')).toBe('P-256');
    expect(keyGroup('ES384')).toBe('P-384');
    expect(keyGroup('ES512')).toBe('P-521');
  });

  it('gives EdDSA the Ed25519 group', () => {
    expect(keyGroup('EdDSA')).toBe('Ed25519');
  });
});

describe('asymmetric sign/verify round-trips', () => {
  const HEADER = (alg: JwtAlgorithm) => JSON.stringify({ alg, typ: 'JWT' });
  const PAYLOAD = JSON.stringify({ sub: '1234567890', name: 'John Doe' });

  const algs: JwtAlgorithm[] = ['RS256', 'RS384', 'PS256', 'ES256', 'ES384', 'EdDSA'];

  it.each(algs)('signs and verifies %s with a generated key pair', async alg => {
    expect(isAsymmetric(alg)).toBe(true);
    const { privateKey, publicKey } = await generateKeyPair(alg);
    const token = await signJwt(HEADER(alg), PAYLOAD, privateKey, alg);
    expect(token.split('.')).toHaveLength(3);
    expect(token.split('.')[2].length).toBeGreaterThan(0);
    expect(await verifyJwt(token, publicKey, alg)).toBe(true);
  });

  it('reuses one RSA key pair across RS* and PS*', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const rsToken = await signJwt(HEADER('RS512'), PAYLOAD, privateKey, 'RS512');
    const psToken = await signJwt(HEADER('PS256'), PAYLOAD, privateKey, 'PS256');
    expect(await verifyJwt(rsToken, publicKey, 'RS512')).toBe(true);
    expect(await verifyJwt(psToken, publicKey, 'PS256')).toBe(true);
  });

  it('fails verification with a different public key', async () => {
    const a = await generateKeyPair('ES256');
    const b = await generateKeyPair('ES256');
    const token = await signJwt(HEADER('ES256'), PAYLOAD, a.privateKey, 'ES256');
    expect(await verifyJwt(token, a.publicKey, 'ES256')).toBe(true);
    expect(await verifyJwt(token, b.publicKey, 'ES256')).toBe(false);
  });

  it('accepts a public key supplied as JWK', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const token = await signJwt(HEADER('ES256'), PAYLOAD, privateKey, 'ES256');
    // Re-export the SPKI public key as a JWK to verify JWK input works.
    const subtle = (globalThis as unknown as { crypto: Crypto }).crypto.subtle;
    const der = Uint8Array.from(
      atob(publicKey.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')),
      c => c.charCodeAt(0)
    );
    const imported = await subtle.importKey('spki', der.buffer, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
    const jwk = await subtle.exportKey('jwk', imported);
    expect(await verifyJwt(token, JSON.stringify(jwk), 'ES256')).toBe(true);
  });
});
