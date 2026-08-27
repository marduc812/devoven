import CryptoJS from 'crypto-js';
import {
  sha3_224,
  sha3_256,
  sha3_384,
  sha3_512,
  keccak_224,
  keccak_256,
  keccak_384,
  keccak_512,
} from 'js-sha3';

const INPUT = 'Hello, World!';

// --- CryptoJS hashers ---

describe('MD5', () => {
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(CryptoJS.MD5(INPUT).toString()).toBe('65a8e27d8879283831b664bd8b7f0ad4');
  });
  it('produces an empty-string hash', () => {
    expect(CryptoJS.MD5('').toString()).toHaveLength(32);
  });
});

describe('SHA1', () => {
  it('produces a 40-char hex hash', () => {
    expect(CryptoJS.SHA1(INPUT).toString()).toHaveLength(40);
    expect(CryptoJS.SHA1(INPUT).toString()).toMatch(/^[0-9a-f]+$/);
  });
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(CryptoJS.SHA1(INPUT).toString()).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01');
  });
});

describe('SHA224', () => {
  it('produces a 56-char hex hash', () => {
    expect(CryptoJS.SHA224(INPUT).toString()).toHaveLength(56);
    expect(CryptoJS.SHA224(INPUT).toString()).toMatch(/^[0-9a-f]+$/);
  });
});

describe('SHA256', () => {
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(CryptoJS.SHA256(INPUT).toString()).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
  });
  it('produces a 64-char hex hash', () => {
    expect(CryptoJS.SHA256(INPUT).toString()).toHaveLength(64);
  });
});

describe('SHA384', () => {
  it('produces a 96-char hex hash', () => {
    expect(CryptoJS.SHA384(INPUT).toString()).toHaveLength(96);
    expect(CryptoJS.SHA384(INPUT).toString()).toMatch(/^[0-9a-f]+$/);
  });
});

describe('SHA512', () => {
  it('produces a 128-char hex hash', () => {
    expect(CryptoJS.SHA512(INPUT).toString()).toHaveLength(128);
    expect(CryptoJS.SHA512(INPUT).toString()).toMatch(/^[0-9a-f]+$/);
  });
});

describe('RIPEMD160', () => {
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(CryptoJS.RIPEMD160(INPUT).toString()).toBe('527a6a4b9a6da75607546842e0e00105350b1aaf');
  });
  it('produces a 40-char hex hash', () => {
    expect(CryptoJS.RIPEMD160(INPUT).toString()).toHaveLength(40);
  });
});

// --- HMAC hashers ---

describe('HMAC-MD5', () => {
  it('produces a 32-char hex hash', () => {
    expect(CryptoJS.HmacMD5(INPUT, 'key').toString()).toHaveLength(32);
  });
});

describe('HMAC-SHA1', () => {
  it('produces a 40-char hex hash', () => {
    expect(CryptoJS.HmacSHA1(INPUT, 'key').toString()).toHaveLength(40);
  });
});

describe('HMAC-SHA224', () => {
  it('produces a 56-char hex hash', () => {
    expect(CryptoJS.HmacSHA224(INPUT, 'key').toString()).toHaveLength(56);
  });
});

describe('HMAC-SHA256', () => {
  it('produces the correct hash for "admin" + key "pass" (from tool description)', () => {
    expect(CryptoJS.HmacSHA256('admin', 'pass').toString()).toBe('2eee8449f2f9b728bdb01faf9db9bec46d2561fb428286548304a7db2d9d4cdc');
  });
  it('produces a 64-char hex hash', () => {
    expect(CryptoJS.HmacSHA256(INPUT, 'key').toString()).toHaveLength(64);
  });
});

describe('HMAC-SHA384', () => {
  it('produces a 96-char hex hash', () => {
    expect(CryptoJS.HmacSHA384(INPUT, 'key').toString()).toHaveLength(96);
  });
});

describe('HMAC-SHA512', () => {
  it('produces a 128-char hex hash', () => {
    expect(CryptoJS.HmacSHA512(INPUT, 'key').toString()).toHaveLength(128);
  });
});

describe('HMAC-RIPEMD160', () => {
  it('produces a 40-char hex hash', () => {
    expect(CryptoJS.HmacRIPEMD160(INPUT, 'key').toString()).toHaveLength(40);
  });
});

describe('HMAC-SHA3', () => {
  it('produces the correct hash for "admin" + key "pass" (from tool description)', () => {
    expect(CryptoJS.HmacSHA3('admin', 'pass').toString()).toBe('a288302143222abccf791927ee962de091921a0ee008f1711154766374fbcd5b17ba6b58902890f9123183215115ff11d73d2bf55dbea22e3c16c28c9ff97393');
  });
});

// --- js-sha3 hashers ---

describe('SHA3-224', () => {
  it('produces a 56-char hex hash', () => {
    expect(sha3_224(INPUT)).toHaveLength(56);
    expect(sha3_224(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});

describe('SHA3-256', () => {
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(sha3_256(INPUT)).toBe('1af17a664e3fa8e419b8ba05c2a173169df76162a5a286e0c405b460d478f7ef');
  });
  it('produces a 64-char hex hash', () => {
    expect(sha3_256(INPUT)).toHaveLength(64);
  });
});

describe('SHA3-384', () => {
  it('produces a 96-char hex hash', () => {
    expect(sha3_384(INPUT)).toHaveLength(96);
    expect(sha3_384(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});

describe('SHA3-512', () => {
  it('produces a 128-char hex hash', () => {
    expect(sha3_512(INPUT)).toHaveLength(128);
    expect(sha3_512(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});

describe('Keccak-224', () => {
  it('produces a 56-char hex hash', () => {
    expect(keccak_224(INPUT)).toHaveLength(56);
    expect(keccak_224(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});

describe('Keccak-256', () => {
  it('produces the correct hash for "Hello, World!" (from tool description)', () => {
    expect(keccak_256(INPUT)).toBe('acaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f');
  });
  it('produces a 64-char hex hash', () => {
    expect(keccak_256(INPUT)).toHaveLength(64);
  });
});

describe('Keccak-384', () => {
  it('produces a 96-char hex hash', () => {
    expect(keccak_384(INPUT)).toHaveLength(96);
    expect(keccak_384(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});

describe('Keccak-512', () => {
  it('produces a 128-char hex hash', () => {
    expect(keccak_512(INPUT)).toHaveLength(128);
    expect(keccak_512(INPUT)).toMatch(/^[0-9a-f]+$/);
  });
});
