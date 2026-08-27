import { soundex, soundexBatch } from '@/Components/Functions/SoundexTools/logic';
describe('soundex', () => {
  it('Robert → R163', () => expect(soundex('Robert')).toBe('R163'));
  it('Rupert → R163', () => expect(soundex('Rupert')).toBe('R163'));
  it('Ashcraft → A261', () => expect(soundex('Ashcraft')).toBe('A261'));
  it('always returns 4 characters', () => {
    expect(soundex('Lee').length).toBe(4);
    expect(soundex('Washington').length).toBe(4);
  });
  it('pads short results with zeros', () => expect(soundex('Lee')).toMatch(/[A-Z]\d{3}/));
  it('throws for empty/non-alpha', () => expect(() => soundex('123')).toThrow());
  it('handles single letter', () => expect(soundex('A')).toBe('A000'));
});
describe('soundexBatch', () => {
  it('processes multiple names', () => {
    const r = soundexBatch('Robert\nRupert\nLee');
    expect(r).toContain('R163');
    expect(r).toContain('Lee');
  });
  it('throws for empty input', () => expect(() => soundexBatch('')).toThrow());
});
