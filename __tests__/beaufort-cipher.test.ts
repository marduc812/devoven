import { beaufortProcess, beaufortTableau, processBeaufort } from '@/Components/Functions/BeaufortCipherTools/logic';

describe('beaufortProcess', () => {
  it('throws on empty key', () => {
    expect(() => beaufortProcess('hello', '')).toThrow();
  });

  it('returns non-alpha unchanged', () => {
    const result = beaufortProcess('Hello, World!', 'KEY');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('is symmetric (encrypt twice = original)', () => {
    const text = 'HELLOWORLD';
    const key = 'SECRET';
    const enc = beaufortProcess(text, key);
    const dec = beaufortProcess(enc, key);
    expect(dec).toBe(text);
  });

  it('encrypts A with key A to A: (0-0+26)%26=0 -> A', () => {
    expect(beaufortProcess('A', 'A')).toBe('A');
  });

  it('encrypts A with key B to B: (1-0+26)%26=1 -> B', () => {
    expect(beaufortProcess('A', 'B')).toBe('B');
  });

  it('encrypts B with key A to Z: (0-1+26)%26=25 -> Z', () => {
    expect(beaufortProcess('B', 'A')).toBe('Z');
  });

  it('preserves case in output', () => {
    const result = beaufortProcess('hello', 'KEY');
    expect(result).toEqual(result.toLowerCase());
  });
});

describe('beaufortTableau', () => {
  it('returns empty for empty text', () => {
    expect(beaufortTableau('', 'KEY')).toBe('');
  });

  it('returns empty for empty key', () => {
    expect(beaufortTableau('hello', '')).toBe('');
  });

  it('contains header line', () => {
    const t = beaufortTableau('HELLO', 'KEY');
    expect(t).toContain('Char');
  });
});

describe('processBeaufort', () => {
  it('returns empty for empty input', () => {
    expect(processBeaufort('', 'KEY')).toBe('');
  });

  it('includes tableau in output', () => {
    const r = processBeaufort('HELLO', 'KEY');
    expect(r).toContain('---');
    expect(r).toContain('tableau');
  });
});
