import {
  argon2PhcString,
  bitsToBytes,
  byteInputNote,
  decodeBytes,
  deriveArgon2,
  deriveHkdf,
  derivePbkdf2,
  deriveScrypt,
  encodeKey,
} from '../Components/Functions/KdfTools/logic';
import { pbkdf2Sync, scryptSync } from 'crypto';

const utf8 = (value: string) => decodeBytes(value, 'utf8', 'Salt');
const hex = (bytes: Uint8Array) => encodeKey(bytes, 'hex');

// ─── decodeBytes ─────────────────────────────────────────────────────────────

describe('decodeBytes', () => {
  it('reads text as UTF-8', () => {
    expect(Array.from(decodeBytes('€', 'utf8', 'Salt'))).toEqual([0xe2, 0x82, 0xac]);
  });

  it('reads hex, ignoring whitespace', () => {
    expect(Array.from(decodeBytes('de ad be ef', 'hex', 'Salt'))).toEqual([
      0xde, 0xad, 0xbe, 0xef,
    ]);
  });

  it('pads odd-length hex the way CyberChef does', () => {
    // "123" is 12 03, not 01 23: digits pair off from the left and the leftover
    // becomes the low nibble of a trailing byte.
    expect(Array.from(decodeBytes('123', 'hex', 'Salt'))).toEqual([0x12, 0x03]);
    expect(Array.from(decodeBytes('abcde', 'hex', 'Salt'))).toEqual([0xab, 0xcd, 0x0e]);
    expect(Array.from(decodeBytes('3', 'hex', 'Salt'))).toEqual([0x03]);
  });

  it('names the field when the hex is malformed', () => {
    expect(() => decodeBytes('zz', 'hex', 'Salt')).toThrow(/Salt is not valid hex/);
  });

  it('reproduces CyberChef exactly for its odd-hex salt', () => {
    // CyberChef: Derive PBKDF2 key, passphrase 123 (UTF8), salt 123 (HEX),
    // 6000 iterations, SHA256, key size 128 bits.
    const key = derivePbkdf2('123', {
      salt: decodeBytes('123', 'hex', 'Salt'),
      iterations: 6000,
      hash: 'sha256',
      dkLen: bitsToBytes(128),
    });
    expect(hex(key)).toBe('faf0cea6834c1fdd0efa3aa1e9ab8d46');
  });

  it('reads base64', () => {
    expect(Array.from(decodeBytes('3q2+7w==', 'base64', 'Salt'))).toEqual([
      0xde, 0xad, 0xbe, 0xef,
    ]);
  });
});

// ─── bitsToBytes / byteInputNote ─────────────────────────────────────────────

describe('bitsToBytes', () => {
  it('converts the sizes the UI offers', () => {
    expect(bitsToBytes(128)).toBe(16);
    expect(bitsToBytes(256)).toBe(32);
    expect(bitsToBytes(8192)).toBe(1024);
  });

  it('rejects a size that is not a whole number of bytes', () => {
    expect(() => bitsToBytes(100)).toThrow(/multiple of 8 bits/);
  });

  it('rejects a non-positive size', () => {
    expect(() => bitsToBytes(0)).toThrow(/at least 8/);
  });

  it('caps the size, naming both units', () => {
    expect(() => bitsToBytes(99992)).toThrow(/capped at 8192 bits \(1024 bytes\)/);
  });

  it('names the field it was given', () => {
    expect(() => bitsToBytes(7, 'Digest size')).toThrow(/^Digest size/);
  });
});

describe('byteInputNote', () => {
  it('explains an odd-length hex field', () => {
    expect(byteInputNote('123', 'hex')).toBe(
      'Odd number of hex digits — padded and read as 12 03.',
    );
  });

  it('stays quiet when the input was taken literally', () => {
    expect(byteInputNote('1203', 'hex')).toBeNull();
    expect(byteInputNote('', 'hex')).toBeNull();
    expect(byteInputNote('123', 'utf8')).toBeNull();
    expect(byteInputNote('zz', 'hex')).toBeNull();
  });
});

// ─── PBKDF2 ──────────────────────────────────────────────────────────────────

describe('derivePbkdf2', () => {
  it('matches the RFC 6070 SHA-1 vector', () => {
    const key = derivePbkdf2('password', {
      salt: utf8('salt'),
      iterations: 4096,
      hash: 'sha1',
      dkLen: 20,
    });
    expect(hex(key)).toBe('4b007901b765489abead49d926f721d065a429c1');
  });

  it('agrees with node for SHA-256', () => {
    const key = derivePbkdf2('password', {
      salt: utf8('salt'),
      iterations: 4096,
      hash: 'sha256',
      dkLen: 40,
    });
    expect(hex(key)).toBe(pbkdf2Sync('password', 'salt', 4096, 40, 'sha256').toString('hex'));
  });

  it('rejects a non-positive iteration count', () => {
    expect(() => derivePbkdf2('p', { salt: utf8('s'), iterations: 0 })).toThrow(
      /at least 1/,
    );
  });

  it('caps the iteration count', () => {
    expect(() =>
      derivePbkdf2('p', { salt: utf8('s'), iterations: 20_000_000 }),
    ).toThrow(/capped at/);
  });

  it('caps the derived key length', () => {
    expect(() =>
      derivePbkdf2('p', { salt: utf8('s'), iterations: 1, dkLen: 2000 }),
    ).toThrow(/capped at 8192 bits \(1024 bytes\)/);
  });
});

// ─── HKDF ────────────────────────────────────────────────────────────────────

describe('deriveHkdf', () => {
  it('matches RFC 5869 test case 1', () => {
    const ikm = String.fromCharCode(...new Array(22).fill(0x0b));
    const key = deriveHkdf(ikm, {
      salt: decodeBytes('000102030405060708090a0b0c', 'hex', 'Salt'),
      info: decodeBytes('f0f1f2f3f4f5f6f7f8f9', 'hex', 'Info'),
      hash: 'sha256',
      dkLen: 42,
    });
    expect(hex(key)).toBe(
      '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf' +
        '34007208d5b887185865',
    );
  });

  it('gives a different key for a different info string', () => {
    const base = { salt: utf8('salt'), hash: 'sha256' as const, dkLen: 32 };
    expect(hex(deriveHkdf('secret', { ...base, info: utf8('a') }))).not.toBe(
      hex(deriveHkdf('secret', { ...base, info: utf8('b') })),
    );
  });

  it('works with no salt and no info', () => {
    expect(hex(deriveHkdf('secret'))).toHaveLength(64);
  });

  it('caps the derived key length', () => {
    expect(() => deriveHkdf('secret', { hash: 'sha256', dkLen: 9000 })).toThrow(
      /capped at 8192 bits \(1024 bytes\)/,
    );
  });
});

// ─── scrypt ──────────────────────────────────────────────────────────────────

describe('deriveScrypt', () => {
  it('matches the RFC 7914 vector', () => {
    const key = deriveScrypt('password', {
      salt: utf8('NaCl'),
      N: 1024,
      r: 8,
      p: 16,
      dkLen: 64,
    });
    expect(hex(key)).toBe(
      'fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b373162' +
        '2eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640',
    );
  });

  it('agrees with node', () => {
    const key = deriveScrypt('pleaseletmein', {
      salt: utf8('SodiumChloride'),
      N: 16384,
      r: 8,
      p: 1,
      dkLen: 64,
    });
    expect(hex(key)).toBe(
      scryptSync('pleaseletmein', 'SodiumChloride', 64, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      }).toString('hex'),
    );
  });

  it('rejects an N that is not a power of two', () => {
    expect(() => deriveScrypt('p', { salt: utf8('s'), N: 1000, r: 8, p: 1 })).toThrow(
      /power of two/,
    );
  });

  it('refuses parameters that would need too much memory', () => {
    expect(() => deriveScrypt('p', { salt: utf8('s'), N: 2 ** 24, r: 8, p: 1 })).toThrow(
      /the limit here is 512 MB/,
    );
  });
});

// ─── Argon2 ──────────────────────────────────────────────────────────────────

describe('deriveArgon2', () => {
  // RFC 9106 section 5 uses t=3, m=32 KiB, p=4 with a secret and associated
  // data, which makes it both authoritative and cheap enough to run in CI.
  const rfc9106 = {
    password: new Uint8Array(32).fill(0x01),
    salt: new Uint8Array(16).fill(0x02),
    secret: new Uint8Array(8).fill(0x03),
    ad: new Uint8Array(12).fill(0x04),
    t: 3,
    m: 32,
    p: 4,
    dkLen: 32,
  };

  it('matches the RFC 9106 argon2id vector', () => {
    const { password, ...options } = rfc9106;
    expect(hex(deriveArgon2(password, { ...options, variant: 'argon2id' }))).toBe(
      '0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659',
    );
  });

  it('matches the RFC 9106 argon2i vector', () => {
    const { password, ...options } = rfc9106;
    expect(hex(deriveArgon2(password, { ...options, variant: 'argon2i' }))).toBe(
      'c814d9d1dc7f37aa13f0d77f2494bda1c8de6b016dd388d29952a4c4672b6ce8',
    );
  });

  it('matches the RFC 9106 argon2d vector', () => {
    const { password, ...options } = rfc9106;
    expect(hex(deriveArgon2(password, { ...options, variant: 'argon2d' }))).toBe(
      '512b391b6f1162975371d30919734294f868e3be3984f3c1a13a4db9fabe4acb',
    );
  });

  it('gives a different digest per variant', () => {
    const base = { salt: utf8('somesalt'), t: 2, m: 256, p: 1, dkLen: 32 };
    const id = hex(deriveArgon2('password', { ...base, variant: 'argon2id' }));
    const i = hex(deriveArgon2('password', { ...base, variant: 'argon2i' }));
    const d = hex(deriveArgon2('password', { ...base, variant: 'argon2d' }));
    expect(new Set([id, i, d]).size).toBe(3);
  });

  it('requires an 8-byte salt', () => {
    expect(() => deriveArgon2('p', { salt: utf8('short'), t: 1, m: 256, p: 1 })).toThrow(
      /at least 8 bytes/,
    );
  });

  it('requires 8 KiB of memory per lane', () => {
    expect(() => deriveArgon2('p', { salt: utf8('somesalt'), t: 1, m: 16, p: 4 })).toThrow(
      /32 KiB for p=4/,
    );
  });

  it('caps the memory cost', () => {
    expect(() =>
      deriveArgon2('p', { salt: utf8('somesalt'), t: 1, m: 2 ** 21, p: 1 }),
    ).toThrow(/capped at/);
  });
});

describe('argon2PhcString', () => {
  it('produces a verifier-ready PHC string with unpadded base64', () => {
    const options = { salt: utf8('somesalt'), t: 2, m: 4096, p: 1 };
    const key = deriveArgon2('password', { ...options, variant: 'argon2id', dkLen: 32 });
    const phc = argon2PhcString(key, options);

    expect(phc.startsWith('$argon2id$v=19$m=4096,t=2,p=1$')).toBe(true);
    const [, , , , saltField, hashField] = phc.split('$');
    expect(saltField).toBe('c29tZXNhbHQ');
    expect(saltField).not.toContain('=');
    expect(Buffer.from(hashField, 'base64').toString('hex')).toBe(hex(key));
  });

  it('names the variant it was given', () => {
    const options = { salt: utf8('somesalt'), t: 1, m: 256, p: 1, variant: 'argon2i' as const };
    const key = deriveArgon2('password', { ...options, dkLen: 32 });
    expect(argon2PhcString(key, options).startsWith('$argon2i$')).toBe(true);
  });
});

describe('encodeKey', () => {
  it('round-trips base64 back to the same bytes', () => {
    const key = derivePbkdf2('password', { salt: utf8('salt'), iterations: 1, dkLen: 32 });
    expect(Buffer.from(encodeKey(key, 'base64'), 'base64').toString('hex')).toBe(hex(key));
  });
});
