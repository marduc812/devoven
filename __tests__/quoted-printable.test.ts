import {
  encodeQuotedPrintable,
  decodeQuotedPrintable,
  isLikelyQuotedPrintable,
  autoConvert,
} from '../Components/Functions/QuotedPrintableTools/logic';

describe('encodeQuotedPrintable', () => {
  it('leaves printable ASCII unchanged', () => {
    const result = encodeQuotedPrintable('Hello World');
    expect(result).toBe('Hello World');
  });

  it('encodes non-ASCII bytes with =XX', () => {
    const result = encodeQuotedPrintable('café');
    expect(result).toContain('=C3');
  });

  it('returns empty for empty input', () => {
    expect(encodeQuotedPrintable('')).toBe('');
  });

  it('handles equals sign encoding', () => {
    const result = encodeQuotedPrintable('1+1=2');
    expect(result).toContain('=3D');
  });
});

describe('decodeQuotedPrintable', () => {
  it('decodes =XX sequences', () => {
    const result = decodeQuotedPrintable('caf=C3=A9');
    expect(result).toBe('café');
  });

  it('handles soft line breaks (= at end of line)', () => {
    const result = decodeQuotedPrintable('Hello =\r\nWorld');
    expect(result).toBe('Hello World');
  });

  it('decodes equals sign', () => {
    const result = decodeQuotedPrintable('1+1=3D2');
    expect(result).toBe('1+1=2');
  });

  it('round-trips ASCII', () => {
    const original = 'Hello, World!';
    const encoded = encodeQuotedPrintable(original);
    const decoded = decodeQuotedPrintable(encoded);
    expect(decoded).toBe(original);
  });
});

describe('isLikelyQuotedPrintable', () => {
  it('detects =XX pattern', () => {
    expect(isLikelyQuotedPrintable('caf=C3=A9')).toBe(true);
  });

  it('detects soft line breaks', () => {
    expect(isLikelyQuotedPrintable('Hello =\nWorld')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isLikelyQuotedPrintable('Hello World')).toBe(false);
  });
});

describe('autoConvert', () => {
  it('encodes plain text', () => {
    const result = autoConvert('café');
    expect(result).toContain('=');
  });

  it('decodes QP text', () => {
    const result = autoConvert('caf=C3=A9');
    expect(result).toBe('café');
  });

  it('returns empty for empty input', () => {
    expect(autoConvert('')).toBe('');
  });
});
