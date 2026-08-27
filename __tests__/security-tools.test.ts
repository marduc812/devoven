import {
  encodeBase64Url,
  decodeBase64Url,
  formatAesOutput,
  parseAesInput,
  base32DecodeToBytes,
  totpTimeStep,
  timeStepToBytes,
  hotp,
  formatTotp,
  totpSecondsRemaining,
  extractFromText,
  formatExtractResults,
  buildJwtHeader,
  buildJwtPayload,
  parseJwtClaims,
} from '../Components/Functions/SecurityTools/logic';

// ─── encodeBase64Url ──────────────────────────────────────────────────────────

describe('encodeBase64Url', () => {
  it('encodes without padding', () => {
    const result = encodeBase64Url(new Uint8Array([72, 101, 108, 108, 111]));
    expect(result).toBe('SGVsbG8');
  });
  it('does not contain = padding', () => {
    const result = encodeBase64Url(new Uint8Array([72, 101, 108, 108, 111]));
    expect(result).not.toContain('=');
  });
  it('replaces + with -', () => {
    const result = encodeBase64Url(new Uint8Array([0xfb]));
    expect(result).not.toContain('+');
    expect(result).toContain('-');
  });
  it('replaces / with _', () => {
    // 0xff produces /w== in standard base64 → _w in base64url
    const result = encodeBase64Url(new Uint8Array([0xff]));
    expect(result).not.toContain('/');
  });
});

// ─── decodeBase64Url ──────────────────────────────────────────────────────────

describe('decodeBase64Url', () => {
  it('round-trips with encodeBase64Url', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 72, 101, 108, 108, 111]);
    expect(decodeBase64Url(encodeBase64Url(original))).toEqual(original);
  });
  it('decodes SGVsbG8 to Hello bytes', () => {
    expect(decodeBase64Url('SGVsbG8')).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });
});

// ─── formatAesOutput / parseAesInput ─────────────────────────────────────────

describe('formatAesOutput / parseAesInput', () => {
  it('round-trips salt+iv+ciphertext', () => {
    const salt = new Uint8Array(16).fill(0xaa);
    const iv = new Uint8Array(12).fill(0xbb);
    const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = formatAesOutput(salt, iv, ciphertext);
    const parsed = parseAesInput(encoded);
    expect(parsed.salt).toEqual(salt);
    expect(parsed.iv).toEqual(iv);
    expect(parsed.ciphertext).toEqual(ciphertext);
  });
  it('throws on too-short input', () => {
    expect(() => parseAesInput('dG9vc2hvcnQ')).toThrow('too short');
  });
});

// ─── extractFromText ──────────────────────────────────────────────────────────

describe('extractFromText', () => {
  it('extracts emails', () => {
    expect(extractFromText('contact foo@bar.com or baz@qux.io', 'emails')).toEqual(['foo@bar.com', 'baz@qux.io']);
  });
  it('extracts URLs', () => {
    expect(extractFromText('visit https://example.com and http://test.org', 'urls')).toHaveLength(2);
  });
  it('extracts IPs', () => {
    expect(extractFromText('server at 192.168.1.1 and 10.0.0.1', 'ips')).toEqual(['192.168.1.1', '10.0.0.1']);
  });
  it('deduplicates', () => {
    expect(extractFromText('foo@bar.com foo@bar.com', 'emails')).toHaveLength(1);
  });
  it('returns empty for no matches', () => {
    expect(extractFromText('no emails here', 'emails')).toHaveLength(0);
  });
  it('returns empty array for blank input', () => {
    expect(extractFromText('   ', 'emails')).toHaveLength(0);
  });
});

// ─── formatExtractResults ─────────────────────────────────────────────────────

describe('formatExtractResults', () => {
  it('returns no-match message for empty array', () => {
    expect(formatExtractResults([], 'emails')).toBe('No emails found.');
  });
  it('joins matches with newlines', () => {
    expect(formatExtractResults(['a@b.com', 'c@d.com'], 'emails')).toBe('a@b.com\nc@d.com');
  });
});

// ─── formatTotp ───────────────────────────────────────────────────────────────

describe('formatTotp', () => {
  it('pads to 6 digits', () => expect(formatTotp(123)).toBe('000123'));
  it('handles max 6 digits', () => expect(formatTotp(999999)).toBe('999999'));
  it('handles 0', () => expect(formatTotp(0)).toBe('000000'));
});

// ─── base32DecodeToBytes ──────────────────────────────────────────────────────

describe('base32DecodeToBytes', () => {
  it('decodes JBSWY3DP', () => {
    const bytes = base32DecodeToBytes('JBSWY3DP');
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111])); // "Hello"
  });
  it('handles lowercase input', () => {
    expect(base32DecodeToBytes('jbswy3dp')).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });
  it('throws on invalid char', () => {
    expect(() => base32DecodeToBytes('1234')).toThrow();
  });
  it('strips trailing padding', () => {
    expect(base32DecodeToBytes('JBSWY3DP==')).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });
});

// ─── totpTimeStep ─────────────────────────────────────────────────────────────

describe('totpTimeStep', () => {
  it('returns floor(seconds/30)', () => {
    expect(totpTimeStep(0)).toBe(0);
    expect(totpTimeStep(29)).toBe(0);
    expect(totpTimeStep(30)).toBe(1);
    expect(totpTimeStep(60)).toBe(2);
  });
});

// ─── timeStepToBytes ──────────────────────────────────────────────────────────

describe('timeStepToBytes', () => {
  it('produces 8 bytes', () => {
    expect(timeStepToBytes(0).length).toBe(8);
  });
  it('encodes step=1 correctly', () => {
    const bytes = timeStepToBytes(1);
    expect(bytes[7]).toBe(1);
    expect(bytes.slice(0, 7)).toEqual(new Uint8Array(7));
  });
});

// ─── totpSecondsRemaining ─────────────────────────────────────────────────────

describe('totpSecondsRemaining', () => {
  it('returns 30 when at step boundary', () => {
    expect(totpSecondsRemaining(0)).toBe(30);
    expect(totpSecondsRemaining(30)).toBe(30);
  });
  it('returns 1 when 1 second from boundary', () => {
    expect(totpSecondsRemaining(29)).toBe(1);
  });
});

// ─── hotp ─────────────────────────────────────────────────────────────────────

describe('hotp', () => {
  it('returns a number between 0 and 999999', () => {
    // create a synthetic 20-byte HMAC result
    const hmac = new Uint8Array(20).fill(0x5a);
    const result = hotp(hmac);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1000000);
  });
});

// ─── JWT helpers ─────────────────────────────────────────────────────────────

describe('parseJwtClaims', () => {
  it('parses valid JSON', () => {
    expect(parseJwtClaims('{"sub":"1234"}')).toEqual({ sub: '1234' });
  });
  it('throws on invalid JSON', () => {
    expect(() => parseJwtClaims('not json')).toThrow('Invalid JSON claims');
  });
});

describe('buildJwtHeader', () => {
  it('returns base64url string without padding', () => {
    const h = buildJwtHeader();
    expect(h).not.toContain('=');
    expect(h).not.toContain('+');
    expect(h).not.toContain('/');
  });
  it('decodes to correct header', () => {
    const h = buildJwtHeader();
    const decoded = JSON.parse(Buffer.from(h, 'base64url').toString());
    expect(decoded).toEqual({ alg: 'HS256', typ: 'JWT' });
  });
});

describe('buildJwtPayload', () => {
  it('encodes claims as base64url', () => {
    const p = buildJwtPayload({ sub: '1234', name: 'John' });
    expect(p).not.toContain('=');
    const decoded = JSON.parse(Buffer.from(p, 'base64url').toString());
    expect(decoded.sub).toBe('1234');
    expect(decoded.name).toBe('John');
  });
});
