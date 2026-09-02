import {
  blake2bHash,
  blake2sHash,
  blake3Hash,
  encodeDigest,
} from '../Components/Functions/BlakeHashTools/logic';

// ─── BLAKE2b ─────────────────────────────────────────────────────────────────

describe('blake2bHash', () => {
  it('matches the RFC 7693 appendix A vector for "abc"', () => {
    expect(blake2bHash('abc')).toBe(
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1' +
        '7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    );
  });

  it('hashes the empty string', () => {
    expect(blake2bHash('')).toBe(
      '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419' +
        'd25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce',
    );
  });

  it('honours the digest size', () => {
    expect(blake2bHash('abc', { bits: 256 })).toHaveLength(64);
    expect(blake2bHash('abc', { bits: 160 })).toHaveLength(40);
  });

  it('produces a different digest when keyed', () => {
    expect(blake2bHash('abc', { key: 'secret' })).not.toBe(blake2bHash('abc'));
  });

  it('rejects a key longer than 64 bytes', () => {
    expect(() => blake2bHash('abc', { key: 'k'.repeat(65) })).toThrow(/at most 64 bytes/);
  });

  it('rejects a digest larger than the algorithm can produce', () => {
    expect(() => blake2bHash('abc', { bits: 1024 })).toThrow(/at most 512 bits/);
  });

  it('rejects a size that is not a whole number of bytes', () => {
    expect(() => blake2bHash('abc', { bits: 100 })).toThrow(/whole number of bytes/);
  });

  it('can return base64', () => {
    const hex = blake2bHash('abc', { bits: 256 });
    const b64 = blake2bHash('abc', { bits: 256, output: 'base64' });
    expect(Buffer.from(b64, 'base64').toString('hex')).toBe(hex);
  });
});

// ─── BLAKE2s ─────────────────────────────────────────────────────────────────

describe('blake2sHash', () => {
  it('matches the RFC 7693 appendix B vector for "abc"', () => {
    expect(blake2sHash('abc')).toBe(
      '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
    );
  });

  it('hashes the empty string', () => {
    expect(blake2sHash('')).toBe(
      '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9',
    );
  });

  it('caps digests at 256 bits', () => {
    expect(() => blake2sHash('abc', { bits: 512 })).toThrow(/at most 256 bits/);
  });

  it('rejects a key longer than 32 bytes', () => {
    expect(() => blake2sHash('abc', { key: 'k'.repeat(33) })).toThrow(/at most 32 bytes/);
  });
});

// ─── BLAKE3 ──────────────────────────────────────────────────────────────────

describe('blake3Hash', () => {
  it('matches the official vector for "abc"', () => {
    expect(blake3Hash('abc')).toBe(
      '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85',
    );
  });

  it('hashes the empty string', () => {
    expect(blake3Hash('')).toBe(
      'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
    );
  });

  it('extends output as an XOF, keeping the 256-bit prefix', () => {
    const long = blake3Hash('abc', { bits: 512 });
    expect(long).toHaveLength(128);
    expect(long.slice(0, 64)).toBe(blake3Hash('abc'));
  });

  it('requires exactly 32 key bytes in keyed mode', () => {
    expect(() => blake3Hash('abc', { key: 'short' })).toThrow(/exactly 32 bytes \(got 5\)/);
    expect(blake3Hash('abc', { key: 'x'.repeat(32) })).toHaveLength(64);
  });

  it('refuses a key and a context together', () => {
    expect(() => blake3Hash('abc', { key: 'x'.repeat(32), context: 'ctx' })).toThrow(
      /either a key or a derivation context/,
    );
  });

  it('derives a different key per context string', () => {
    expect(blake3Hash('abc', { context: 'app v1' })).not.toBe(
      blake3Hash('abc', { context: 'app v2' }),
    );
  });
});

describe('encodeDigest', () => {
  it('round-trips through base64', () => {
    const bytes = new Uint8Array([0, 1, 254, 255]);
    expect(encodeDigest(bytes, 'hex')).toBe('0001feff');
    expect(encodeDigest(bytes, 'base64')).toBe(Buffer.from(bytes).toString('base64'));
  });
});
