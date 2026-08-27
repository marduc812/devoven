import { textToAsciiArt } from '../Components/Functions/AsciiArtTools/logic';

describe('textToAsciiArt', () => {
  it('returns a non-empty string for single letter', () => {
    const result = textToAsciiArt('A');
    expect(result).toBeTruthy();
    expect(result.split('\n')).toHaveLength(5);
  });

  it('returns 5 rows for any input', () => {
    const result = textToAsciiArt('HELLO');
    const rows = result.split('\n');
    expect(rows).toHaveLength(5);
  });

  it('handles lowercase by converting to uppercase', () => {
    const upper = textToAsciiArt('A');
    const lower = textToAsciiArt('a');
    expect(upper).toBe(lower);
  });

  it('handles all letters A-Z', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of alphabet) {
      const result = textToAsciiArt(letter);
      expect(result.split('\n')).toHaveLength(5);
    }
  });

  it('handles all digits 0-9', () => {
    const digits = '0123456789';
    for (const digit of digits) {
      const result = textToAsciiArt(digit);
      expect(result.split('\n')).toHaveLength(5);
    }
  });

  it('handles space character', () => {
    const result = textToAsciiArt(' ');
    expect(result.split('\n')).toHaveLength(5);
  });

  it('handles empty string', () => {
    const result = textToAsciiArt('');
    expect(result).toBe('');
  });

  it('handles multi-character input', () => {
    const result = textToAsciiArt('HI');
    expect(result.split('\n')).toHaveLength(5);
    // Should be wider than single char
    const singleChar = textToAsciiArt('H');
    const rows1 = result.split('\n');
    const rows2 = singleChar.split('\n');
    expect(rows1[0].length).toBeGreaterThan(rows2[0].length);
  });

  it('handles numbers in input', () => {
    const result = textToAsciiArt('42');
    expect(result.split('\n')).toHaveLength(5);
  });
});
