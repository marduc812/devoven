import {
  MAX_TEXT_FILE_BYTES,
  contentError,
  formatSize,
  looksBinary,
  sizeError,
  trimTrailingNewline,
} from '@/lib/textFile';

describe('formatSize', () => {
  it('scales the unit to the size', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('looksBinary', () => {
  it('accepts ordinary text, including empty and unicode', () => {
    expect(looksBinary('')).toBe(false);
    expect(looksBinary('hello\nworld\n')).toBe(false);
    expect(looksBinary('Καλημέρα — 日本語 — emoji 🎉')).toBe(false);
  });

  it('rejects anything holding a NUL byte', () => {
    expect(looksBinary('PK\u0000\u0000')).toBe(true);
  });

  it('rejects text peppered with replacement characters', () => {
    expect(looksBinary('\uFFFD'.repeat(20) + 'x'.repeat(80))).toBe(true);
  });

  it('tolerates the odd replacement character in real text', () => {
    expect(looksBinary('a legitimate \uFFFD in ' + 'text '.repeat(50))).toBe(false);
  });

  it('only looks at the start of a long file', () => {
    expect(looksBinary('x'.repeat(5000) + '\u0000')).toBe(false);
  });
});

describe('sizeError', () => {
  it('passes a file within the limit', () => {
    expect(sizeError('notes.txt', 1024)).toBeNull();
    expect(sizeError('notes.txt', MAX_TEXT_FILE_BYTES)).toBeNull();
  });

  it('names the file and both sizes when it is too big', () => {
    const message = sizeError('dump.log', MAX_TEXT_FILE_BYTES + 1);
    expect(message).toContain('dump.log');
    expect(message).toContain('2.0 MB');
  });
});

describe('contentError', () => {
  it('passes text and rejects binary, naming the file', () => {
    expect(contentError('a.txt', 'plain text')).toBeNull();
    expect(contentError('logo.png', '\u0000PNG')).toBe('"logo.png" is not a text file');
  });
});

describe('trimTrailingNewline', () => {
  it('drops the newline an editor leaves behind', () => {
    expect(trimTrailingNewline('karolin\n')).toBe('karolin');
    expect(trimTrailingNewline('karolin\r\n')).toBe('karolin');
    expect(trimTrailingNewline('karolin\n\n\n')).toBe('karolin');
  });

  it('leaves the rest of the value alone', () => {
    expect(trimTrailingNewline('one\ntwo')).toBe('one\ntwo');
    expect(trimTrailingNewline('  spaced  ')).toBe('  spaced  ');
    expect(trimTrailingNewline('')).toBe('');
  });
});
