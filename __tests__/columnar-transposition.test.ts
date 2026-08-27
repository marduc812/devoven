import { columnarEncrypt, columnarDecrypt, columnarGrid, processColumnar } from '@/Components/Functions/ColumnarTranspositionTools/logic';

describe('columnarEncrypt', () => {
  it('throws on empty key', () => {
    expect(() => columnarEncrypt('hello', '')).toThrow();
  });

  it('returns empty for empty text', () => {
    expect(columnarEncrypt('', 'KEY')).toBe('');
  });

  it('encrypts WEAREDISCOVEREDFLEEATONCE with ZEBRA', () => {
    // Classic example: WEAREDISCOVEREDFLEEATONCE, key ZEBRA
    const result = columnarEncrypt('WEAREDISCOVEREDFLEEATONCE', 'ZEBRA');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('encrypt then decrypt round-trips', () => {
    const text = 'HELLOWORLD';
    const key = 'SECRET';
    const enc = columnarEncrypt(text, key);
    const dec = columnarDecrypt(enc, key);
    expect(dec).toBe(text);
  });

  it('handles key with only letters', () => {
    const result = columnarEncrypt('ABCDEFGH', 'CAB');
    expect(result.length).toBe(9); // padded to 9 (3 cols * 3 rows)
  });
});

describe('columnarDecrypt', () => {
  it('throws on empty key', () => {
    expect(() => columnarDecrypt('HELLO', '')).toThrow();
  });

  it('returns empty for empty text', () => {
    expect(columnarDecrypt('', 'KEY')).toBe('');
  });
});

describe('columnarGrid', () => {
  it('returns empty for empty key', () => {
    expect(columnarGrid('hello', '')).toBe('');
  });

  it('returns empty for empty text', () => {
    expect(columnarGrid('', 'KEY')).toBe('');
  });

  it('contains key header', () => {
    const grid = columnarGrid('HELLO', 'KEY');
    expect(grid).toContain('Key:');
  });
});

describe('processColumnar', () => {
  it('returns empty for empty input', () => {
    expect(processColumnar('', 'KEY', 'encrypt')).toBe('');
  });

  it('encrypt includes grid visualization', () => {
    const r = processColumnar('HELLO', 'KEY', 'encrypt');
    expect(r).toContain('---');
    expect(r).toContain('Grid visualization');
  });
});
