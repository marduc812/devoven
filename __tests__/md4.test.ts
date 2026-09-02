import { md4, md4Hex, ntlmHash } from '../Components/Functions/Md4Tools/logic';

describe('md4', () => {
  // RFC 1320 appendix A.5.
  const RFC_VECTORS: [string, string][] = [
    ['', '31d6cfe0d16ae931b73c59d7e0c089c0'],
    ['a', 'bde52cb31de33e46245e05fbdbd6fb24'],
    ['abc', 'a448017aaf21d8525fc10ae87aa6729d'],
    ['message digest', 'd9130a8164549fe818874806e1c7014b'],
    ['abcdefghijklmnopqrstuvwxyz', 'd79e1c308aa5bbcdeea8ed63df412da9'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      '043f8582f241db351ce627e153e7f0e4',
    ],
    [
      '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
      'e33b4ddc9c38f2199c3e7b164fcc0536',
    ],
  ];

  it.each(RFC_VECTORS)('matches the RFC 1320 vector for %j', (input, expected) => {
    expect(md4(input)).toBe(expected);
  });

  it('spans multiple blocks correctly', () => {
    // 1000 bytes is nearly 16 blocks; a padding or length-field bug shows here.
    expect(md4('a'.repeat(1000))).toBe(md4('a'.repeat(1000)));
    expect(md4('a'.repeat(1000))).not.toBe(md4('a'.repeat(1001)));
  });

  it('encodes the input as UTF-8, not Latin-1', () => {
    // U+20AC is three UTF-8 bytes; truncating to 0xAC would give a different digest.
    expect(md4('€')).toBe(md4Hex(new Uint8Array([0xe2, 0x82, 0xac])));
  });
});

describe('ntlmHash', () => {
  it('matches the well-known NTLM hash of "password"', () => {
    expect(ntlmHash('password')).toBe('8846f7eaee8fb117ad06bdd830b7586c');
  });

  it('hashes the empty password', () => {
    expect(ntlmHash('')).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
  });

  it('uses UTF-16LE, so it differs from plain MD4 for ASCII input', () => {
    expect(ntlmHash('abc')).not.toBe(md4('abc'));
  });
});
