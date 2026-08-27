import { inspectJwk, describeKeyUse, describeAlgorithm } from '../Components/Functions/JwkInspectorTools/logic';

const RSA_JWK = JSON.stringify({
  kty: 'RSA',
  n: 'sIAEgACAHgBMAIA', // short for test — 12 bytes = 96 bits
  e: 'AQAB',
  alg: 'RS256',
  use: 'sig',
  kid: 'my-rsa-key',
});

const EC_JWK = JSON.stringify({
  kty: 'EC',
  crv: 'P-256',
  x: 'abc',
  y: 'def',
  alg: 'ES256',
  use: 'sig',
});

const OCT_JWK = JSON.stringify({
  kty: 'oct',
  k: 'AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow', // 64 bytes = 512 bits
  alg: 'HS256',
});

const JWKS = JSON.stringify({
  keys: [
    { kty: 'EC', crv: 'P-384', x: 'x', y: 'y', alg: 'ES384', use: 'sig', kid: 'k1' },
    { kty: 'RSA', n: 'AAAAAAAA', e: 'AQAB', kid: 'k2' },
  ],
});

describe('inspectJwk - RSA', () => {
  it('parses RSA JWK correctly', () => {
    const result = inspectJwk(RSA_JWK);
    expect(result.error).toBe('');
    expect(result.isJwks).toBe(false);
    expect(result.keys).toHaveLength(1);
    const key = result.keys[0];
    expect(key.keyType).toBe('RSA');
    expect(key.algorithm).toBe('RS256');
    expect(key.use).toBe('sig');
    expect(key.keyId).toBe('my-rsa-key');
    expect(key.modulusBits).toBeGreaterThan(0);
  });
});

describe('inspectJwk - EC', () => {
  it('parses EC JWK correctly', () => {
    const result = inspectJwk(EC_JWK);
    expect(result.error).toBe('');
    const key = result.keys[0];
    expect(key.keyType).toBe('EC');
    expect(key.curve).toBe('P-256');
    expect(key.algorithm).toBe('ES256');
  });
});

describe('inspectJwk - oct', () => {
  it('parses symmetric JWK', () => {
    const result = inspectJwk(OCT_JWK);
    expect(result.error).toBe('');
    const key = result.keys[0];
    expect(key.keyType).toBe('oct');
    expect(key.octKeyBits).toBeGreaterThan(0);
  });
});

describe('inspectJwk - JWKS', () => {
  it('parses JWKS with multiple keys', () => {
    const result = inspectJwk(JWKS);
    expect(result.error).toBe('');
    expect(result.isJwks).toBe(true);
    expect(result.keys).toHaveLength(2);
    expect(result.keys[0].curve).toBe('P-384');
    expect(result.keys[1].keyType).toBe('RSA');
  });
});

describe('inspectJwk - errors', () => {
  it('returns error for empty input', () => {
    const result = inspectJwk('');
    expect(result.error).not.toBe('');
  });

  it('returns error for invalid JSON', () => {
    const result = inspectJwk('{not json}');
    expect(result.error).not.toBe('');
  });

  it('returns error for missing kty', () => {
    const result = inspectJwk('{"alg":"RS256"}');
    expect(result.error).not.toBe('');
  });

  it('returns error for non-object', () => {
    const result = inspectJwk('"hello"');
    expect(result.error).not.toBe('');
  });
});

describe('describeKeyUse', () => {
  it('describes sig', () => {
    expect(describeKeyUse('sig')).toContain('Signature');
  });
  it('describes enc', () => {
    expect(describeKeyUse('enc')).toContain('Encryption');
  });
  it('handles unknown', () => {
    expect(describeKeyUse('')).toBe('Not specified');
  });
});

describe('describeAlgorithm', () => {
  it('describes RS256', () => {
    expect(describeAlgorithm('RS256')).toContain('RSA');
  });
  it('describes ES256', () => {
    expect(describeAlgorithm('ES256')).toContain('ECDSA');
  });
  it('returns unknown alg as-is', () => {
    expect(describeAlgorithm('XS999')).toBe('XS999');
  });
  it('handles empty', () => {
    expect(describeAlgorithm('')).toBe('Not specified');
  });
});
