import { hmacSm3, sm3, sm3Bytes } from '../Components/Functions/Sm3Tools/logic';
import { createHash, createHmac } from 'crypto';

describe('sm3', () => {
  it('matches the GB/T 32905-2016 vector for "abc"', () => {
    expect(sm3('abc')).toBe(
      '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0',
    );
  });

  it('matches the standard two-block vector', () => {
    // "abcd" x 16 = 64 bytes, so padding pushes it into a second block.
    expect(sm3('abcd'.repeat(16))).toBe(
      'debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732',
    );
  });

  it('hashes the empty string', () => {
    expect(sm3('')).toBe(
      '1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b',
    );
  });

  it('agrees with OpenSSL across a block boundary', () => {
    for (let length = 0; length <= 130; length++) {
      const input = 'a'.repeat(length);
      expect(sm3(input)).toBe(createHash('sm3').update(input).digest('hex'));
    }
  });

  it('produces 32 bytes', () => {
    expect(sm3Bytes(new Uint8Array(0))).toHaveLength(32);
  });
});

describe('hmacSm3', () => {
  it('agrees with OpenSSL for a short key', () => {
    expect(hmacSm3('hello world', 'key')).toBe(
      createHmac('sm3', 'key').update('hello world').digest('hex'),
    );
  });

  it('agrees with OpenSSL for a key longer than the 64-byte block', () => {
    const key = 'k'.repeat(100);
    expect(hmacSm3('hello world', key)).toBe(
      createHmac('sm3', key).update('hello world').digest('hex'),
    );
  });

  it('differs from a plain digest', () => {
    expect(hmacSm3('abc', 'key')).not.toBe(sm3('abc'));
  });
});
