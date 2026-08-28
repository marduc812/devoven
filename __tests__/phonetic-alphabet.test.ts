import { textToPhonetic, phoneticToText, allAlphabetsForChar } from '@/Components/Functions/PhoneticAlphabetTools/logic';

describe('textToPhonetic', () => {
  it('converts A to Alpha in NATO', () => {
    const result = textToPhonetic('A', 'nato');
    expect(result).toContain('Alpha');
  });

  it('converts SOS in NATO', () => {
    const result = textToPhonetic('SOS', 'nato');
    expect(result).toContain('Sierra');
    expect(result).toContain('Oscar');
  });

  it('handles spaces', () => {
    const result = textToPhonetic('A B', 'nato');
    expect(result).toContain('(space)');
  });

  it('works with ICAO alphabet', () => {
    const result = textToPhonetic('A', 'icao');
    expect(result).toContain('Alfa');
  });

  it('works with German alphabet', () => {
    const result = textToPhonetic('A', 'german');
    expect(result).toContain('Anton');
  });

  it('works with Old British alphabet', () => {
    const result = textToPhonetic('A', 'oldBritish');
    expect(result).toContain('Ace');
  });

  it('handles lowercase input', () => {
    const result = textToPhonetic('hello', 'nato');
    expect(result).toContain('Hotel');
    expect(result).toContain('Echo');
    expect(result).toContain('Lima');
    expect(result).toContain('Oscar');
  });
});

describe('phoneticToText', () => {
  it('decodes Alpha to A', () => {
    const result = phoneticToText('Alpha', 'nato');
    expect(result).toBe('A');
  });

  it('decodes multiple words', () => {
    const result = phoneticToText('Sierra\nOscar\nSierra', 'nato');
    expect(result).toBe('SOS');
  });

  it('decodes space marker', () => {
    const result = phoneticToText('Alpha\n/ (space)\nBravo', 'nato');
    expect(result).toBe('A B');
  });
});

describe('allAlphabetsForChar', () => {
  it('returns all four alphabets for A', () => {
    const result = allAlphabetsForChar('A');
    expect(result.nato).toBe('Alpha');
    expect(result.icao).toBe('Alfa');
    expect(result.oldBritish).toBe('Ace');
    expect(result.german).toBe('Anton');
  });
});
