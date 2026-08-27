import { Buffer } from 'buffer';
import { textToBinary, binaryToString, hexToBinary, urlEncodeAll, urlEncodeUnicode, urlDecodeWithUnicode } from '../Components/Functions/Utils';

// --- URL Encode / Decode ---
describe('URL Encode', () => {
  it('encodes "Hello, World!" correctly', () => {
    expect(encodeURIComponent('Hello, World!')).toBe('Hello%2C%20World!');
  });
  it('leaves safe characters unchanged', () => {
    expect(encodeURIComponent('abc123')).toBe('abc123');
  });
  it('handles empty string', () => {
    expect(encodeURIComponent('')).toBe('');
  });
});

describe('URL Encode - all characters', () => {
  it('encodes characters encodeURIComponent leaves alone', () => {
    expect(urlEncodeAll('a.b')).toBe('%61%2E%62');
    expect(urlEncodeAll("-_.!~*'()")).toBe('%2D%5F%2E%21%7E%2A%27%28%29');
  });
  it('encodes multi-byte characters as UTF-8 bytes', () => {
    expect(urlEncodeAll('é')).toBe('%C3%A9');
    expect(urlEncodeAll('😀')).toBe('%F0%9F%98%80');
  });
  it('handles empty string', () => {
    expect(urlEncodeAll('')).toBe('');
  });
});

describe('URL Encode - unicode', () => {
  it('encodes every character as %uXXXX', () => {
    expect(urlEncodeUnicode('a.b')).toBe('%u0061%u002E%u0062');
  });
  it('encodes non-ASCII characters', () => {
    expect(urlEncodeUnicode('é')).toBe('%u00E9');
  });
  it('encodes astral characters as a surrogate pair', () => {
    expect(urlEncodeUnicode('😀')).toBe('%uD83D%uDE00');
  });
  it('handles empty string', () => {
    expect(urlEncodeUnicode('')).toBe('');
  });
});

describe('URL Decode', () => {
  it('decodes "Hello%2C%20World%21" correctly', () => {
    expect(decodeURIComponent('Hello%2C%20World%21')).toBe('Hello, World!');
  });
  it('handles empty string', () => {
    expect(decodeURIComponent('')).toBe('');
  });
  it('decodes %uXXXX sequences', () => {
    expect(urlDecodeWithUnicode('%u0048%u0065%u006C%u006C%u006F')).toBe('Hello');
    expect(urlDecodeWithUnicode('%uD83D%uDE00')).toBe('😀');
  });
  it('round-trips both encode modes', () => {
    const input = 'Hello, World! é😀';
    expect(urlDecodeWithUnicode(urlEncodeAll(input))).toBe(input);
    expect(urlDecodeWithUnicode(urlEncodeUnicode(input))).toBe(input);
  });
  it('mixes %XX and %uXXXX sequences with literal text', () => {
    expect(urlDecodeWithUnicode('a%2Eb%u002Ec')).toBe('a.b.c');
  });
  it('throws on a malformed sequence', () => {
    expect(() => urlDecodeWithUnicode('%zz')).toThrow();
    expect(() => urlDecodeWithUnicode('100%')).toThrow();
  });
  it('throws on invalid UTF-8 bytes', () => {
    expect(() => urlDecodeWithUnicode('%C3%28')).toThrow();
  });
});

// --- HTML Encode / Decode ---
const htmlEncode = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

describe('HTML Encode', () => {
  it('encodes <script>alert(1)</script>', () => {
    expect(htmlEncode('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('encodes ampersand', () => {
    expect(htmlEncode('a & b')).toBe('a &amp; b');
  });
  it('encodes quotes', () => {
    expect(htmlEncode('"hi" \'world\'')).toBe('&quot;hi&quot; &#039;world&#039;');
  });
  it('leaves plain text unchanged', () => {
    expect(htmlEncode('hello')).toBe('hello');
  });
});

// --- Base64 Encode / Decode ---
describe('Base64 Encode', () => {
  it('encodes "admin" to "YWRtaW4="', () => {
    expect(Buffer.from('admin', 'utf-8').toString('base64')).toBe('YWRtaW4=');
  });
  it('encodes "Hello, World!"', () => {
    expect(Buffer.from('Hello, World!', 'utf-8').toString('base64')).toBe('SGVsbG8sIFdvcmxkIQ==');
  });
  it('handles empty string', () => {
    expect(Buffer.from('', 'utf-8').toString('base64')).toBe('');
  });
});

describe('Base64 Decode', () => {
  it('decodes "YWRtaW4=" to "admin"', () => {
    expect(Buffer.from('YWRtaW4=', 'base64').toString('utf-8')).toBe('admin');
  });
  it('decodes "SGVsbG8sIFdvcmxkIQ==" to "Hello, World!"', () => {
    expect(Buffer.from('SGVsbG8sIFdvcmxkIQ==', 'base64').toString('utf-8')).toBe('Hello, World!');
  });
});

// --- String to Binary / Binary to String (via Utils) ---
describe('String to Binary', () => {
  it('converts "Admin" to binary (from tool description)', () => {
    expect(textToBinary('Admin')).toBe('01000001 01100100 01101101 01101001 01101110');
  });
});

describe('Binary to String', () => {
  it('converts binary back to "Admin"', () => {
    expect(binaryToString('01000001 01100100 01101101 01101001 01101110')).toBe('Admin');
  });
});

// --- Text to Hex ---
// Logic extracted from Encoders.tsx hexConverter
const textToHex = (input: string): string => {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    result += input.charCodeAt(i).toString(16);
  }
  return result.trim();
};

describe('Text to Hex', () => {
  it('converts "admin" to "61646d696e"', () => {
    expect(textToHex('admin')).toBe('61646d696e');
  });
  it('handles empty string', () => {
    expect(textToHex('')).toBe('');
  });
});

// --- Hex to Text ---
// Logic extracted from Encoders.tsx textConverter
const hexToText = (input: string): string => {
  const hexValues = input.match(/.{1,2}/g) || [];
  return hexValues.map(hex => String.fromCharCode(parseInt(hex, 16))).join('');
};

describe('Hex to Text', () => {
  it('converts "68656c6c6f" to "hello"', () => {
    expect(hexToText('68656c6c6f')).toBe('hello');
  });
  it('converts "61646d696e" to "admin"', () => {
    expect(hexToText('61646d696e')).toBe('admin');
  });
});

// --- Binary to Hex ---
// Logic extracted from Encoders.tsx binToHex
const binToHex = (input: string): string => {
  const groups = input.match(/.{4}/g);
  if (groups) {
    return groups.reduce((acc, i) => acc + parseInt(i, 2).toString(16), '');
  }
  return '';
};

describe('Binary to Hex', () => {
  it('converts "11011110101011011011111011101111" to "deadbeef"', () => {
    expect(binToHex('11011110101011011011111011101111')).toBe('deadbeef');
  });
  it('returns empty for empty input', () => {
    expect(binToHex('')).toBe('');
  });
});

// --- Hex to Binary ---
describe('Hex to Binary', () => {
  it('converts "deadbeef" to "11011110101011011011111011101111"', () => {
    expect(hexToBinary('deadbeef')).toBe('11011110101011011011111011101111');
  });
  it('returns empty for empty input', () => {
    expect(hexToBinary('')).toBe('');
  });
  it('rejects non-hex input', () => {
    expect(() => hexToBinary('nothex')).toThrow();
  });
  it('ignores whitespace and an 0x prefix', () => {
    expect(hexToBinary(' 0xde ad be ef ')).toBe(hexToBinary('deadbeef'));
  });

  // These are the values the tool exists to convert. The old loop counted down
  // from Math.ceil(Math.sqrt(value)) instead of a bit index, so every one of
  // them froze the tab; from 27 hex characters the decrement was lost to
  // float64 spacing and the loop had no exit at all.
  const digests: [string, string][] = [
    ['MD5', '5d41402abc4b2a76b9719d911017c592'],
    ['SHA-1', 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'],
    ['SHA-256', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'],
    ['UUID without dashes', '123e4567e89b12d3a456426614174000'],
    ['64 f characters', 'f'.repeat(64)],
  ];
  it.each(digests)('converts a %s without hanging', (_label, hex) => {
    const out = hexToBinary(hex);
    expect(out).toMatch(/^[01]+$/);
    // Leading zero nibbles are dropped, as they always were, so the width is
    // 4 bits per digit minus the leading zeros of the first digit.
    expect(out.length).toBeGreaterThan(hex.length * 4 - 4);
    expect(out.length).toBeLessThanOrEqual(hex.length * 4);
    expect(BigInt('0b' + out)).toBe(BigInt('0x' + hex));
  }, 1000);

  it('converts the 27-character input that used to never terminate', () => {
    expect(hexToBinary('f'.repeat(27))).toBe('1'.repeat(108));
  }, 1000);

  it('converts input past the float64 range without growing unbounded', () => {
    expect(hexToBinary('f'.repeat(400))).toBe('1'.repeat(1600));
  }, 1000);

  it('is exact above 2^53, where parseInt loses precision', () => {
    expect(hexToBinary('20000000000001')).toBe('10' + '0'.repeat(51) + '1');
  });
});
