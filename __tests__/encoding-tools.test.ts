import {
  base32Encode, base32Decode,
  base58Encode, base58Decode,
  ascii85Encode, ascii85Decode,
  rot13,
  rot47,
  caesarEncode, caesarDecode,
  morseEncode, morseDecode,
  punycodeEncode, punycodeDecode,
  quotedPrintableEncode, quotedPrintableDecode,
  jwtDecode,
} from '../Components/Functions/EncodingTools/logic';

// ─── Base32 ──────────────────────────────────────────────────────────────────

describe('base32Encode', () => {
  it('encodes "Hello" to "JBSWY3DP"', () => {
    expect(base32Encode('Hello')).toBe('JBSWY3DP');
  });
  it('encodes "Man" to "JVQW4==="', () => {
    expect(base32Encode('Man')).toBe('JVQW4===');
  });
  it('encodes a single character "f"', () => {
    expect(base32Encode('f')).toBe('MY======');
  });
  it('encodes empty string to empty string', () => {
    expect(base32Encode('')).toBe('');
  });
  it('encodes "foobar" to "MZXW6YTBOI======"', () => {
    expect(base32Encode('foobar')).toBe('MZXW6YTBOI======');
  });
});

describe('base32Decode', () => {
  it('decodes "JBSWY3DP" to "Hello"', () => {
    expect(base32Decode('JBSWY3DP')).toBe('Hello');
  });
  it('decodes "JVQW4===" to "Man"', () => {
    expect(base32Decode('JVQW4===')).toBe('Man');
  });
  it('decodes "MY======" to "f"', () => {
    expect(base32Decode('MY======')).toBe('f');
  });
  it('decodes empty string to empty string', () => {
    expect(base32Decode('')).toBe('');
  });
  it('decodes "MZXW6YTBOI======" to "foobar"', () => {
    expect(base32Decode('MZXW6YTBOI======')).toBe('foobar');
  });
  it('round-trips arbitrary ASCII text', () => {
    const original = 'Hello, World!';
    expect(base32Decode(base32Encode(original))).toBe(original);
  });
  it('throws on invalid base32 characters', () => {
    expect(() => base32Decode('1234')).toThrow();
  });
});

// ─── Base58 ──────────────────────────────────────────────────────────────────

describe('base58Encode', () => {
  it('encodes "Hello World" to a non-empty base58 string', () => {
    const result = base58Encode('Hello World');
    expect(result).toBeTruthy();
    expect(result).toMatch(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
  });
  it('encodes empty string to empty string', () => {
    expect(base58Encode('')).toBe('');
  });
  it('encodes "abc" correctly (known value)', () => {
    expect(base58Encode('abc')).toBe('ZiCa');
  });
  it('preserves leading null bytes as "1" chars', () => {
    const result = base58Encode('\x00\x00abc');
    expect(result.startsWith('11')).toBe(true);
  });
});

describe('base58Decode', () => {
  it('decodes back to "Hello World"', () => {
    expect(base58Decode(base58Encode('Hello World'))).toBe('Hello World');
  });
  it('decodes empty string to empty string', () => {
    expect(base58Decode('')).toBe('');
  });
  it('decodes "ZiCa" to "abc"', () => {
    expect(base58Decode('ZiCa')).toBe('abc');
  });
  it('round-trips arbitrary ASCII text', () => {
    const original = 'The quick brown fox';
    expect(base58Decode(base58Encode(original))).toBe(original);
  });
  it('throws on invalid base58 character "0"', () => {
    expect(() => base58Decode('0abc')).toThrow();
  });
});

// ─── Ascii85 ─────────────────────────────────────────────────────────────────

describe('ascii85Encode', () => {
  it('encodes "Man is " with btoa-style output (known vector)', () => {
    // "Man " in ascii85 is "9jqo^"
    const result = ascii85Encode('Man ');
    expect(result).toBe('9jqo^');
  });
  it('encodes empty string to empty string', () => {
    expect(ascii85Encode('')).toBe('');
  });
  it('encodes all-zero bytes as "z" shorthand', () => {
    expect(ascii85Encode('\x00\x00\x00\x00')).toBe('z');
  });
  it('produces only printable ASCII characters (!-u range)', () => {
    const result = ascii85Encode('Hello, World!');
    expect(result).toMatch(/^[!-uz]+$/);
  });
});

describe('ascii85Decode', () => {
  it('decodes "9jqo^" to "Man "', () => {
    expect(ascii85Decode('9jqo^')).toBe('Man ');
  });
  it('decodes empty string to empty string', () => {
    expect(ascii85Decode('')).toBe('');
  });
  it('decodes "z" shorthand to four null bytes', () => {
    expect(ascii85Decode('z')).toBe('\x00\x00\x00\x00');
  });
  it('round-trips arbitrary ASCII text', () => {
    const original = 'Hello, World!';
    expect(ascii85Decode(ascii85Encode(original))).toBe(original);
  });
});

// ─── ROT13 ───────────────────────────────────────────────────────────────────

describe('rot13', () => {
  it('rotates "Hello" to "Uryyb"', () => {
    expect(rot13('Hello')).toBe('Uryyb');
  });
  it('rotates "Uryyb" back to "Hello" (self-inverse)', () => {
    expect(rot13('Uryyb')).toBe('Hello');
  });
  it('leaves digits and punctuation unchanged', () => {
    expect(rot13('Hello, World! 123')).toBe('Uryyb, Jbeyq! 123');
  });
  it('handles empty string', () => {
    expect(rot13('')).toBe('');
  });
  it('preserves case', () => {
    expect(rot13('ABCxyz')).toBe('NOPklm');
  });
});

// ─── ROT47 ───────────────────────────────────────────────────────────────────

describe('rot47', () => {
  it('rotates "Hello" to "w6==@"', () => {
    expect(rot47('Hello')).toBe('w6==@');
  });
  it('is self-inverse', () => {
    expect(rot47(rot47('Hello, World! 123'))).toBe('Hello, World! 123');
  });
  it('leaves characters outside ! (33) to ~ (126) range unchanged', () => {
    expect(rot47('\t')).toBe('\t');
  });
  it('handles empty string', () => {
    expect(rot47('')).toBe('');
  });
  it('encodes digits', () => {
    expect(rot47('0123')).toBe('_`ab');
  });
});

// ─── Caesar Cipher ───────────────────────────────────────────────────────────

describe('caesarEncode', () => {
  it('encodes "Hello" with shift 3 to "Khoor"', () => {
    expect(caesarEncode('Hello', 3)).toBe('Khoor');
  });
  it('encodes "abc" with shift 1 to "bcd"', () => {
    expect(caesarEncode('abc', 1)).toBe('bcd');
  });
  it('wraps around: "xyz" with shift 3 to "abc"', () => {
    expect(caesarEncode('xyz', 3)).toBe('abc');
  });
  it('preserves case', () => {
    expect(caesarEncode('XYZ', 3)).toBe('ABC');
  });
  it('leaves non-alphabetic characters unchanged', () => {
    expect(caesarEncode('Hello, World! 123', 3)).toBe('Khoor, Zruog! 123');
  });
  it('handles shift 0', () => {
    expect(caesarEncode('Hello', 0)).toBe('Hello');
  });
  it('handles shift 26 (full wrap = identity)', () => {
    expect(caesarEncode('Hello', 26)).toBe('Hello');
  });
  it('handles empty string', () => {
    expect(caesarEncode('', 3)).toBe('');
  });
});

describe('caesarDecode', () => {
  it('decodes "Khoor" with shift 3 to "Hello"', () => {
    expect(caesarDecode('Khoor', 3)).toBe('Hello');
  });
  it('is the inverse of caesarEncode', () => {
    const original = 'The quick brown fox';
    expect(caesarDecode(caesarEncode(original, 13), 13)).toBe(original);
  });
  it('handles empty string', () => {
    expect(caesarDecode('', 3)).toBe('');
  });
});

// ─── Morse Code ──────────────────────────────────────────────────────────────

describe('morseEncode', () => {
  it('encodes "SOS" to "... --- ..."', () => {
    expect(morseEncode('SOS')).toBe('... --- ...');
  });
  it('encodes "HELLO" to correct Morse', () => {
    expect(morseEncode('HELLO')).toBe('.... . .-.. .-.. ---');
  });
  it('encodes lowercase (case-insensitive)', () => {
    expect(morseEncode('sos')).toBe('... --- ...');
  });
  it('encodes digits', () => {
    expect(morseEncode('1')).toBe('.----');
  });
  it('separates words with " / "', () => {
    const result = morseEncode('HI HI');
    expect(result).toBe('.... .. / .... ..');
  });
  it('handles empty string', () => {
    expect(morseEncode('')).toBe('');
  });
  it('throws on characters not in the Morse table', () => {
    expect(() => morseEncode('@')).toThrow();
  });
});

describe('morseDecode', () => {
  it('decodes "... --- ..." to "SOS"', () => {
    expect(morseDecode('... --- ...')).toBe('SOS');
  });
  it('decodes ".... . .-.. .-.. ---" to "HELLO"', () => {
    expect(morseDecode('.... . .-.. .-.. ---')).toBe('HELLO');
  });
  it('decodes word separator " / " to space', () => {
    expect(morseDecode('.... .. / .... ..')).toBe('HI HI');
  });
  it('handles empty string', () => {
    expect(morseDecode('')).toBe('');
  });
  it('throws on unknown Morse sequence', () => {
    expect(() => morseDecode('......')).toThrow();
  });
});

// ─── Punycode ────────────────────────────────────────────────────────────────

describe('punycodeEncode', () => {
  it('encodes "münchen.de" to "xn--mnchen-3ya.de"', () => {
    expect(punycodeEncode('münchen.de')).toBe('xn--mnchen-3ya.de');
  });
  it('leaves plain ASCII domains unchanged', () => {
    expect(punycodeEncode('example.com')).toBe('example.com');
  });
  it('encodes "bücher.de" correctly', () => {
    expect(punycodeEncode('bücher.de')).toBe('xn--bcher-kva.de');
  });
  it('handles empty string', () => {
    expect(punycodeEncode('')).toBe('');
  });
});

describe('punycodeDecode', () => {
  it('decodes "xn--mnchen-3ya.de" to "münchen.de"', () => {
    expect(punycodeDecode('xn--mnchen-3ya.de')).toBe('münchen.de');
  });
  it('leaves plain ASCII labels unchanged', () => {
    expect(punycodeDecode('example.com')).toBe('example.com');
  });
  it('decodes "xn--bcher-kva.de" to "bücher.de"', () => {
    expect(punycodeDecode('xn--bcher-kva.de')).toBe('bücher.de');
  });
  it('handles empty string', () => {
    expect(punycodeDecode('')).toBe('');
  });
  it('round-trips with punycodeEncode', () => {
    const original = 'münchen.de';
    expect(punycodeDecode(punycodeEncode(original))).toBe(original);
  });
});

// ─── Quoted-Printable ────────────────────────────────────────────────────────

describe('quotedPrintableEncode', () => {
  it('leaves plain ASCII unchanged', () => {
    expect(quotedPrintableEncode('Hello')).toBe('Hello');
  });
  it('encodes non-ASCII byte as =XX', () => {
    // "é" is U+00E9, UTF-8 0xC3 0xA9
    const result = quotedPrintableEncode('é');
    expect(result).toBe('=C3=A9');
  });
  it('encodes "=" as "=3D"', () => {
    expect(quotedPrintableEncode('a=b')).toBe('a=3Db');
  });
  it('handles empty string', () => {
    expect(quotedPrintableEncode('')).toBe('');
  });
  it('encodes "Subject: Héllo" correctly', () => {
    const result = quotedPrintableEncode('Héllo');
    expect(result).toBe('H=C3=A9llo');
  });
});

describe('quotedPrintableDecode', () => {
  it('decodes "=C3=A9" to "é"', () => {
    expect(quotedPrintableDecode('=C3=A9')).toBe('é');
  });
  it('decodes "=3D" to "="', () => {
    expect(quotedPrintableDecode('a=3Db')).toBe('a=b');
  });
  it('leaves plain text unchanged', () => {
    expect(quotedPrintableDecode('Hello')).toBe('Hello');
  });
  it('handles empty string', () => {
    expect(quotedPrintableDecode('')).toBe('');
  });
  it('round-trips with quotedPrintableEncode', () => {
    const original = 'Héllo Wörld';
    expect(quotedPrintableDecode(quotedPrintableEncode(original))).toBe(original);
  });
});

// ─── JWT Decoder ─────────────────────────────────────────────────────────────

describe('jwtDecode', () => {
  // A real (non-secret) HS256 JWT with payload { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
  const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('returns a JSON object with header, payload, and signature fields', () => {
    const result = JSON.parse(jwtDecode(sampleJwt));
    expect(result).toHaveProperty('header');
    expect(result).toHaveProperty('payload');
    expect(result).toHaveProperty('signature');
  });

  it('decodes the header alg as "HS256"', () => {
    const result = JSON.parse(jwtDecode(sampleJwt));
    expect(result.header.alg).toBe('HS256');
    expect(result.header.typ).toBe('JWT');
  });

  it('decodes the payload sub as "1234567890"', () => {
    const result = JSON.parse(jwtDecode(sampleJwt));
    expect(result.payload.sub).toBe('1234567890');
    expect(result.payload.name).toBe('John Doe');
    expect(result.payload.iat).toBe(1516239022);
  });

  it('includes the raw signature string', () => {
    const result = JSON.parse(jwtDecode(sampleJwt));
    expect(typeof result.signature).toBe('string');
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it('returns empty string for empty input', () => {
    expect(jwtDecode('')).toBe('');
  });

  it('throws on a token that does not have three parts', () => {
    expect(() => jwtDecode('header.payload')).toThrow();
  });

  it('throws on an invalid base64url header', () => {
    expect(() => jwtDecode('not-valid-base64!.payload.sig')).toThrow();
  });
});
