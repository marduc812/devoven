import { soundex, metaphone, doubleMetaphone, analyzeSoundex } from '@/Components/Functions/TextSoundexTools/logic';

describe('soundex', () => {
  it('Robert → R163', () => expect(soundex('Robert')).toBe('R163'));
  it('Rupert → R163', () => expect(soundex('Rupert')).toBe('R163'));
  it('Smith → S530', () => expect(soundex('Smith')).toBe('S530'));
  it('Smythe → S523', () => expect(soundex('Smythe')).toBe('S523'));
  it('pads short names to 4 chars', () => expect(soundex('Lee')).toHaveLength(4));
  it('throws for non-alpha input', () => expect(() => soundex('123')).toThrow());
});

describe('metaphone', () => {
  it('returns a non-empty string for valid input', () => expect(metaphone('hello').length).toBeGreaterThan(0));
  it('returns empty for non-alpha input', () => expect(metaphone('123')).toBe(''));
  it('Phone → FN', () => expect(metaphone('Phone')).toContain('F'));
});

describe('doubleMetaphone', () => {
  it('returns primary and secondary keys', () => {
    const dm = doubleMetaphone('Smith');
    expect(typeof dm.primary).toBe('string');
    expect(typeof dm.secondary).toBe('string');
  });
});

describe('analyzeSoundex', () => {
  it('shows soundex code in output', () => expect(analyzeSoundex('Robert')).toContain('R163'));
  it('shows metaphone label', () => expect(analyzeSoundex('Robert')).toContain('Metaphone'));
  it('throws for empty input', () => expect(() => analyzeSoundex('')).toThrow());
  it('handles multiple words', () => {
    const out = analyzeSoundex('Robert\nRupert');
    expect(out).toContain('Robert');
    expect(out).toContain('Rupert');
  });
});
