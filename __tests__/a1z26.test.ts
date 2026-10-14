import { encodeA1Z26, decodeA1Z26 } from '@/Components/Functions/A1Z26Tools/logic';

describe('A1Z26', () => {
  it('encodes letter positions, words and line breaks', () => {
    expect(encodeA1Z26('Hello, world!\r\nAz 123')).toBe('8-5-12-12-15 / 23-15-18-12-4\n1-26');
  });
  it('decodes common number separators', () => {
    expect(decodeA1Z26('8 5 12 12 15 / 23,15,18,12,4\n1-26')).toBe('HELLO WORLD\nAZ');
  });
  it('round trips words and empty lines', () => {
    const text = 'THE QUICK BROWN FOX\n\nJUMPS OVER THE LAZY DOG';
    expect(decodeA1Z26(encodeA1Z26(text))).toBe(text);
    expect(encodeA1Z26('')).toBe('');
    expect(decodeA1Z26('')).toBe('');
  });
  it.each(['0', '27', '-1', '1.5', '2e1', 'abc', '1//2', '1-'])('rejects invalid input %s', (text) => {
    expect(() => decodeA1Z26(text)).toThrow('Use numbers from 1 to 26');
  });
});
