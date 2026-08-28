import {
  formatUuidsAsText,
  formatUlidsAsText,
  buildVCard,
  validateBcryptRounds,
  buildHtpasswdEntry,
  arrayBufferToPem,
} from '../Components/Functions/Generators/logic';

// ─── formatUuidsAsText ────────────────────────────────────────────────────────

describe('formatUuidsAsText', () => {
  it('joins a single UUID with no trailing newline', () => {
    const result = formatUuidsAsText(['550e8400-e29b-41d4-a716-446655440000']);
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('joins multiple UUIDs with newlines', () => {
    const uuids = [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ];
    const result = formatUuidsAsText(uuids);
    expect(result).toBe(uuids.join('\n'));
    expect(result.split('\n')).toHaveLength(2);
  });

  it('returns empty string for empty array', () => {
    expect(formatUuidsAsText([])).toBe('');
  });
});

// ─── formatUlidsAsText ────────────────────────────────────────────────────────

describe('formatUlidsAsText', () => {
  it('joins a single ULID with no trailing newline', () => {
    const result = formatUlidsAsText(['01ARZ3NDEKTSV4RRFFQ69G5FAV']);
    expect(result).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
  });

  it('joins multiple ULIDs with newlines', () => {
    const ulids = ['01ARZ3NDEKTSV4RRFFQ69G5FAV', '01BX5ZZKBKACTAV9WEVGEMMVRY'];
    const result = formatUlidsAsText(ulids);
    expect(result).toBe(ulids.join('\n'));
    expect(result.split('\n')).toHaveLength(2);
  });

  it('returns empty string for empty array', () => {
    expect(formatUlidsAsText([])).toBe('');
  });
});

// ─── buildVCard ───────────────────────────────────────────────────────────────

describe('buildVCard', () => {
  it('builds a valid vCard string with all fields', () => {
    const vc = buildVCard('John Doe', '+1234567890', 'john@example.com', 'https://example.com');
    expect(vc).toContain('BEGIN:VCARD');
    expect(vc).toContain('VERSION:3.0');
    expect(vc).toContain('FN:John Doe');
    expect(vc).toContain('TEL:+1234567890');
    expect(vc).toContain('EMAIL:john@example.com');
    expect(vc).toContain('URL:https://example.com');
    expect(vc).toContain('END:VCARD');
  });

  it('omits empty phone field', () => {
    const vc = buildVCard('Jane', '', 'jane@example.com', '');
    expect(vc).not.toContain('TEL:');
    expect(vc).toContain('FN:Jane');
    expect(vc).toContain('EMAIL:jane@example.com');
  });

  it('omits empty email field', () => {
    const vc = buildVCard('Bob', '+9876543210', '', '');
    expect(vc).not.toContain('EMAIL:');
  });

  it('omits empty url field', () => {
    const vc = buildVCard('Alice', '', '', '');
    expect(vc).not.toContain('URL:');
    expect(vc).not.toContain('TEL:');
    expect(vc).not.toContain('EMAIL:');
  });

  it('always includes BEGIN:VCARD and END:VCARD', () => {
    const vc = buildVCard('', '', '', '');
    expect(vc).toContain('BEGIN:VCARD');
    expect(vc).toContain('END:VCARD');
  });

  it('omits FN line when name is empty', () => {
    const vc = buildVCard('', '+1234567890', '', '');
    expect(vc).not.toContain('FN:');
  });
});

// ─── validateBcryptRounds ─────────────────────────────────────────────────────

describe('validateBcryptRounds', () => {
  it('returns 4 for values below minimum', () => {
    expect(validateBcryptRounds(0)).toBe(4);
    expect(validateBcryptRounds(3)).toBe(4);
    expect(validateBcryptRounds(-10)).toBe(4);
  });

  it('returns 14 for values above maximum', () => {
    expect(validateBcryptRounds(15)).toBe(14);
    expect(validateBcryptRounds(100)).toBe(14);
  });

  it('returns the value unchanged for values in range', () => {
    expect(validateBcryptRounds(4)).toBe(4);
    expect(validateBcryptRounds(10)).toBe(10);
    expect(validateBcryptRounds(14)).toBe(14);
  });

  it('floors fractional values', () => {
    expect(validateBcryptRounds(8.9)).toBe(8);
    expect(validateBcryptRounds(10.1)).toBe(10);
  });
});

// ─── buildHtpasswdEntry ───────────────────────────────────────────────────────

describe('buildHtpasswdEntry', () => {
  it('formats username:hash correctly', () => {
    const entry = buildHtpasswdEntry('alice', '$2a$10$abcdefghijklmnopqrstuuVGwL6Z5z5z5z5z5z5z5z5z5z5z5z5');
    expect(entry).toBe('alice:$2a$10$abcdefghijklmnopqrstuuVGwL6Z5z5z5z5z5z5z5z5z5z5z5z5');
  });

  it('uses a colon as separator', () => {
    const entry = buildHtpasswdEntry('bob', 'hashvalue');
    expect(entry).toContain(':');
    const parts = entry.split(':');
    expect(parts[0]).toBe('bob');
    expect(parts[1]).toBe('hashvalue');
  });

  it('handles usernames with hyphens and underscores', () => {
    const entry = buildHtpasswdEntry('my_user-name', 'hash');
    expect(entry.startsWith('my_user-name:')).toBe(true);
  });
});

// ─── arrayBufferToPem ─────────────────────────────────────────────────────────

describe('arrayBufferToPem', () => {
  it('wraps public key in PEM headers', () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const pem = arrayBufferToPem(buf, 'PUBLIC KEY');
    expect(pem).toMatch(/-----BEGIN PUBLIC KEY-----/);
    expect(pem).toMatch(/-----END PUBLIC KEY-----/);
    expect(pem).toContain('AQID'); // base64 of [1,2,3]
  });

  it('wraps private key in PEM headers', () => {
    const buf = new Uint8Array([4, 5, 6]).buffer;
    const pem = arrayBufferToPem(buf, 'PRIVATE KEY');
    expect(pem).toMatch(/-----BEGIN PRIVATE KEY-----/);
    expect(pem).toMatch(/-----END PRIVATE KEY-----/);
  });

  it('wraps long keys with line breaks at 64 chars', () => {
    const bytes = new Uint8Array(100).fill(65); // 100 * 'A'
    const pem = arrayBufferToPem(bytes.buffer, 'PUBLIC KEY');
    const lines = pem.split('\n');
    const contentLines = lines.filter(l => !l.startsWith('---'));
    contentLines.forEach(l => expect(l.length).toBeLessThanOrEqual(64));
  });

  it('produces valid base64 content between headers', () => {
    const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
    const pem = arrayBufferToPem(buf, 'PUBLIC KEY');
    // "Hello" in base64 is "SGVsbG8="
    expect(pem).toContain('SGVsbG8=');
  });

  it('begins and ends content on their own lines', () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const pem = arrayBufferToPem(buf, 'PUBLIC KEY');
    const lines = pem.split('\n');
    expect(lines[0]).toBe('-----BEGIN PUBLIC KEY-----');
    expect(lines[lines.length - 1]).toBe('-----END PUBLIC KEY-----');
  });
});
