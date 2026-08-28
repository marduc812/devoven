import {
  charToBinary,
  textToCharBinaries,
  binaryToText,
  looksLikeBinary,
  autoConvert,
  textToBinaryOutput,
} from '@/Components/Functions/BinaryVisualTools/logic';

describe('charToBinary', () => {
  it('converts A to 01000001', () => {
    expect(charToBinary(65)).toBe('01000001');
  });

  it('converts space to 00100000', () => {
    expect(charToBinary(32)).toBe('00100000');
  });

  it('converts 0 to 00110000', () => {
    expect(charToBinary(48)).toBe('00110000');
  });
});

describe('textToCharBinaries', () => {
  it('converts "Hi" to two CharBinary entries', () => {
    const result = textToCharBinaries('Hi');
    expect(result).toHaveLength(2);
    expect(result[0].char).toBe('H');
    expect(result[0].binary).toBe('01001000');
    expect(result[0].bits).toHaveLength(8);
  });

  it('bits array has correct values', () => {
    const result = textToCharBinaries('A');
    // 01000001
    expect(result[0].bits[0]).toBe(false);
    expect(result[0].bits[1]).toBe(true);
    expect(result[0].bits[7]).toBe(true);
  });
});

describe('binaryToText', () => {
  it('decodes space-separated binary', () => {
    expect(binaryToText('01001000 01101001')).toBe('Hi');
  });

  it('decodes continuous 8-bit binary', () => {
    expect(binaryToText('0100100001101001')).toBe('Hi');
  });

  it('returns error for invalid group', () => {
    expect(binaryToText('012')).toContain('Error');
  });
});

describe('looksLikeBinary', () => {
  it('returns true for binary string', () => {
    expect(looksLikeBinary('01001000 01101001')).toBe(true);
  });

  it('returns false for text', () => {
    expect(looksLikeBinary('Hello')).toBe(false);
  });

  it('returns false for empty', () => {
    expect(looksLikeBinary('')).toBe(false);
  });
});

describe('autoConvert', () => {
  it('detects binary input and decodes', () => {
    const { direction, output } = autoConvert('01001000 01101001');
    expect(direction).toBe('decode');
    expect(output).toBe('Hi');
  });

  it('detects text input and encodes', () => {
    const { direction, output } = autoConvert('Hi');
    expect(direction).toBe('encode');
    expect(output).toContain('01001000');
  });

  it('returns empty for empty input', () => {
    const { output } = autoConvert('');
    expect(output).toBe('');
  });
});

describe('textToBinaryOutput', () => {
  it('returns empty for empty text', () => {
    expect(textToBinaryOutput('')).toBe('');
  });

  it('includes header line', () => {
    const out = textToBinaryOutput('A');
    expect(out).toContain('Dec');
    expect(out).toContain('Binary');
  });

  it('includes binary stream', () => {
    const out = textToBinaryOutput('A');
    expect(out).toContain('01000001');
  });
});
