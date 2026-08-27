import {
  getUtf8Bytes,
  countGraphemes,
  describeCodePoint,
  analyzeString,
} from '../Components/Functions/StringInspectorTools/logic';

// ─── getUtf8Bytes ─────────────────────────────────────────────────────────────

describe('getUtf8Bytes', () => {
  it('returns hex bytes for ASCII text', () => {
    expect(getUtf8Bytes('A')).toBe('41');
  });

  it('returns space-separated hex bytes for multiple chars', () => {
    expect(getUtf8Bytes('Hi')).toBe('48 69');
  });

  it('returns multi-byte hex for UTF-8 encoded chars', () => {
    // '€' = 0xE2 0x82 0xAC
    expect(getUtf8Bytes('€')).toBe('e2 82 ac');
  });

  it('returns empty string for empty input', () => {
    expect(getUtf8Bytes('')).toBe('');
  });

  it('handles space character', () => {
    expect(getUtf8Bytes(' ')).toBe('20');
  });
});

// Test strings are written as escapes on purpose: most of the interesting ones are
// invisible, and the composed / decomposed pair is indistinguishable otherwise.

// --- countGraphemes ---------------------------------------------------------

describe('countGraphemes', () => {
  it('counts a plain string by character', () => expect(countGraphemes('hello')).toBe(5));

  it('counts a decomposed accent as one character', () => {
    expect(countGraphemes('caf\u00E9')).toBe(4);
    expect(countGraphemes('cafe\u0301')).toBe(4);
  });

  it('counts a ZWJ emoji sequence as one character', () => {
    expect(countGraphemes('\u{1F468}\u200D\u{1F469}\u200D\u{1F467}')).toBe(1);
  });
});

// --- describeCodePoint ------------------------------------------------------

describe('describeCodePoint', () => {
  it('describes an ASCII letter', () => {
    expect(describeCodePoint('A', 0)).toMatchObject({
      hex: 'U+0041',
      category: 'ascii',
      utf8: ['41'],
      utf16: ['0041'],
      escape: '\\u0041',
    });
  });

  it('splits an astral code point into a surrogate pair', () => {
    const info = describeCodePoint('\u{1F600}');
    expect(info.category).toBe('astral');
    expect(info.utf16).toEqual(['D83D', 'DE00']);
    expect(info.utf8).toEqual(['F0', '9F', '98', '80']);
    expect(info.escape).toBe('\\u{1F600}');
  });

  it('names invisible code points', () => {
    expect(describeCodePoint('\u200B').name).toBe('ZERO WIDTH SPACE');
    expect(describeCodePoint('\u200B').category).toBe('invisible');
  });

  it('gives control characters a printable stand-in', () => {
    expect(describeCodePoint('\n').display).toBe('LF');
    expect(describeCodePoint('\u0000').display).toBe('NUL');
  });

  it('marks a bidi override', () => {
    expect(describeCodePoint('\u202E').category).toBe('bidi');
  });
});

// --- analyzeString ----------------------------------------------------------

describe('analyzeString', () => {
  it('reports the four counts disagreeing on an emoji', () => {
    const r = analyzeString('\u{1F468}\u200D\u{1F469}');
    expect(r.utf8Bytes).toBe(11);
    expect(r.utf16Units).toBe(5);
    expect(r.codePointCount).toBe(3);
    expect(r.graphemeCount).toBe(1);
  });

  it('agrees with itself on plain ASCII', () => {
    const r = analyzeString('abc');
    expect([r.utf8Bytes, r.utf16Units, r.codePointCount, r.graphemeCount]).toEqual([3, 3, 3, 3]);
    expect(r.asciiOnly).toBe(true);
    expect(r.flags).toEqual([]);
  });

  it('flags a leading BOM', () => {
    expect(analyzeString('\uFEFFid').flags.map(f => f.label)).toContain('Byte order mark');
  });

  it('flags a bidi override as a failure', () => {
    const flag = analyzeString('admin\u202E').flags.find(f => f.label === 'Bidi control characters');
    expect(flag?.tone).toBe('fail');
  });

  it('flags a decomposed string as not NFC', () => {
    const labels = analyzeString('cafe\u0301').flags.map(f => f.label);
    expect(labels).toContain('Not in NFC');
    expect(labels).toContain('Combining marks');
  });

  it('leaves the composed form alone', () => {
    expect(analyzeString('caf\u00E9').flags.map(f => f.label)).not.toContain('Not in NFC');
  });

  it('flags mixed line endings', () => {
    expect(analyzeString('a\r\nb\nc').flags.map(f => f.label)).toContain('Mixed line endings');
  });

  it('does not flag consistent CRLF', () => {
    expect(analyzeString('a\r\nb\r\nc').flags.map(f => f.label)).not.toContain('Mixed line endings');
  });

  it('flags a non-breaking space', () => {
    expect(analyzeString('a\u00A0b').flags.map(f => f.label)).toContain('Non-breaking space');
  });

  it('compares the normalisation forms', () => {
    const forms = analyzeString('cafe\u0301').normalization;
    expect(forms.find(n => n.form === 'NFC')?.changed).toBe(true);
    expect(forms.find(n => n.form === 'NFD')?.changed).toBe(false);
    expect(forms.find(n => n.form === 'NFC')?.codePoints).toBe(4);
    expect(forms.find(n => n.form === 'NFD')?.codePoints).toBe(5);
  });

  it('caps the code point list and says so', () => {
    const r = analyzeString('a'.repeat(300));
    expect(r.codePoints).toHaveLength(256);
    expect(r.truncated).toBe(true);
    expect(r.codePointCount).toBe(300);
  });

  it('counts lines', () => {
    expect(analyzeString('a\nb\nc').lineCount).toBe(3);
    expect(analyzeString('').lineCount).toBe(0);
  });
});
