import { inspectText, formatInspection } from '@/Components/Functions/UnicodeInspectorTools/logic';

describe('inspectText', () => {
  it('returns empty result for empty string', () => {
    const result = inspectText('');
    expect(result.totalCodePoints).toBe(0);
    expect(result.chars.length).toBe(0);
    expect(result.utf8TotalBytes).toBe(0);
  });

  it('handles ASCII characters', () => {
    const result = inspectText('ABC');
    expect(result.totalCodePoints).toBe(3);
    expect(result.chars[0].codePoint).toBe(65); // 'A'
    expect(result.chars[0].codePointStr).toBe('U+0041');
    expect(result.chars[0].decimal).toBe(65);
    expect(result.chars[0].hex).toBe('0x41');
  });

  it('counts UTF-8 bytes correctly for ASCII', () => {
    const result = inspectText('Hello');
    expect(result.utf8TotalBytes).toBe(5); // 1 byte per ASCII char
    expect(result.utf16TotalBytes).toBe(10); // 2 bytes per char in UTF-16
  });

  it('handles multi-byte UTF-8 characters', () => {
    const result = inspectText('café'); // e with acute is 2 bytes in UTF-8
    expect(result.utf8TotalBytes).toBeGreaterThan(4); // 'c','a','f' = 3 bytes + 'é' = 2 bytes = 5
    expect(result.totalCodePoints).toBe(4);
  });

  it('handles emoji (surrogate pair)', () => {
    const result = inspectText('😀');
    expect(result.totalCodePoints).toBe(1);
    const c = result.chars[0];
    expect(c.codePoint).toBe(0x1F600);
    expect(c.codePointStr).toBe('U+1F600');
    expect(c.utf8ByteCount).toBe(4); // emoji is 4 bytes in UTF-8
    expect(c.utf16ByteCount).toBe(4); // surrogate pair
    expect(c.isEmoji).toBe(true);
  });

  it('identifies space character', () => {
    const result = inspectText(' ');
    expect(result.chars[0].codePoint).toBe(32);
    expect(result.chars[0].category).toBe('Zs');
  });

  it('identifies digit category', () => {
    const result = inspectText('5');
    expect(result.chars[0].category).toBe('Nd');
  });

  it('identifies uppercase category', () => {
    const result = inspectText('A');
    expect(result.chars[0].category).toBe('Lu');
    expect(result.chars[0].categoryName).toContain('Uppercase');
  });

  it('identifies lowercase category', () => {
    const result = inspectText('a');
    expect(result.chars[0].category).toBe('Ll');
    expect(result.chars[0].categoryName).toContain('Lowercase');
  });

  it('provides UTF-8 byte string for ASCII', () => {
    const result = inspectText('A');
    expect(result.chars[0].utf8Bytes).toBe('41');
    expect(result.chars[0].utf8ByteCount).toBe(1);
  });

  it('provides UTF-16 unit string for ASCII', () => {
    const result = inspectText('A');
    expect(result.chars[0].utf16Units).toBe('0041');
    expect(result.chars[0].utf16ByteCount).toBe(2);
  });

  it('identifies CJK characters', () => {
    const result = inspectText('中');
    expect(result.totalCodePoints).toBe(1);
    expect(result.chars[0].utf8ByteCount).toBe(3); // CJK = 3 UTF-8 bytes
  });

  it('handles null character', () => {
    const result = inspectText('\x00');
    expect(result.chars[0].codePoint).toBe(0);
    expect(result.chars[0].category).toBe('Cc');
  });

  it('generates summary string', () => {
    const result = inspectText('Hello 😀');
    expect(result.summary).toContain('code points');
    expect(result.summary).toContain('UTF-8');
  });

  it('counts combining marks correctly', () => {
    const result = inspectText('a\u0301'); // a + combining acute
    expect(result.totalCodePoints).toBe(2);
    expect(result.chars[1].isCombining).toBe(true);
  });
});

describe('formatInspection', () => {
  it('returns empty string for no chars', () => {
    const result = inspectText('');
    expect(formatInspection(result)).toBe('');
  });

  it('includes header with byte counts', () => {
    const result = inspectText('Hello');
    const output = formatInspection(result);
    expect(output).toContain('Code Points');
    expect(output).toContain('UTF-8');
    expect(output).toContain('UTF-16');
  });

  it('includes one row per character', () => {
    const result = inspectText('AB');
    const output = formatInspection(result);
    const rows = output.split('\n').filter(l => l.match(/^\s*\d+\./));
    expect(rows.length).toBe(2);
  });

  it('shows code points in U+XXXX format', () => {
    const result = inspectText('A');
    const output = formatInspection(result);
    expect(output).toContain('U+0041');
  });
});
