import { CIPHER_SUITES, lookupCipher, searchCiphers, parseCipherName } from '../Components/Functions/TlsCipherTools/logic';

describe('CIPHER_SUITES', () => {
  it('contains at least 40 cipher suites', () => {
    expect(CIPHER_SUITES.length).toBeGreaterThanOrEqual(40);
  });

  it('each suite has required fields', () => {
    for (const cs of CIPHER_SUITES) {
      expect(cs.name).toBeTruthy();
      expect(cs.hexCode).toBeTruthy();
      expect(cs.keyExchange).toBeTruthy();
      expect(cs.authentication).toBeTruthy();
      expect(cs.encryption).toBeTruthy();
      expect(typeof cs.keySize).toBe('number');
      expect(cs.mode).toBeTruthy();
      expect(cs.mac).toBeTruthy();
      expect(typeof cs.forwardSecrecy).toBe('boolean');
      expect(typeof cs.aead).toBe('boolean');
    }
  });

  it('TLS 1.3 suites are present', () => {
    const tls13 = CIPHER_SUITES.filter(cs => cs.name.startsWith('TLS_AES') || cs.name.startsWith('TLS_CHACHA'));
    expect(tls13.length).toBeGreaterThan(0);
  });
});

describe('lookupCipher', () => {
  it('finds TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', () => {
    const result = lookupCipher('TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384');
    expect(result).not.toBeNull();
    expect(result!.keyExchange).toBe('ECDHE');
    expect(result!.authentication).toBe('RSA');
    expect(result!.keySize).toBe(256);
    expect(result!.forwardSecrecy).toBe(true);
    expect(result!.aead).toBe(true);
  });

  it('is case-insensitive', () => {
    const r1 = lookupCipher('TLS_AES_128_GCM_SHA256');
    const r2 = lookupCipher('tls_aes_128_gcm_sha256');
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.name).toBe(r2!.name);
  });

  it('returns null for unknown suite', () => {
    expect(lookupCipher('TLS_FAKE_WITH_NOTHING')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(lookupCipher('')).toBeNull();
  });

  it('RC4 suites are marked insecure', () => {
    const rc4 = lookupCipher('TLS_RSA_WITH_RC4_128_SHA');
    expect(rc4).not.toBeNull();
    expect(rc4!.security).toBe('insecure');
  });
});

describe('searchCiphers', () => {
  it('returns up to 20 for empty query', () => {
    const results = searchCiphers('');
    expect(results.length).toBeLessThanOrEqual(20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds ECDHE suites', () => {
    const results = searchCiphers('ECDHE');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(cs => cs.keyExchange.includes('ECDHE'))).toBe(true);
  });

  it('finds recommended suites', () => {
    const results = searchCiphers('recommended');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(cs => cs.security === 'recommended')).toBe(true);
  });

  it('returns empty for no matches', () => {
    expect(searchCiphers('xyznonexistent')).toHaveLength(0);
  });
});

describe('parseCipherName', () => {
  it('returns decoded fields for known cipher', () => {
    const fields = parseCipherName('TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256');
    expect(Object.keys(fields).length).toBeGreaterThan(0);
    expect(fields['Key Exchange']).toContain('ECDHE');
    expect(fields['Forward Secrecy']).toBe('Yes');
    expect(fields['AEAD']).toContain('Yes');
  });

  it('returns empty object for unknown cipher', () => {
    const fields = parseCipherName('FAKE_CIPHER');
    expect(Object.keys(fields).length).toBe(0);
  });
});
