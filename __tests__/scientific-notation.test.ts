import { toScientific, toEngineering, fromScientific, convertScientific } from '@/Components/Functions/ScientificNotationTools/logic';
describe('toScientific', () => {
  it('converts 1000 to 1e+3', () => {
    const r = toScientific('1000');
    expect(r).toContain('1e+3');
  });
  it('converts 0.001 to scientific', () => {
    const r = toScientific('0.001');
    expect(r).toContain('1e-3');
  });
  it('includes Engineering notation', () => expect(toScientific('1000000')).toContain('Engineering:'));
  it('throws for non-number', () => expect(() => toScientific('abc')).toThrow());
  it('handles negative numbers', () => expect(toScientific('-1500')).toContain('-'));
});
describe('toEngineering', () => {
  it('1000 → 1e+3', () => expect(toEngineering(1000)).toContain('1'));
  it('1000000 → 1e+6', () => expect(toEngineering(1000000)).toContain('e+6'));
  it('0 → "0"', () => expect(toEngineering(0)).toBe('0'));
});
describe('fromScientific', () => {
  it('converts 1.5e+3 to 1500', () => expect(fromScientific('1.5e+3')).toContain('1,500'));
  it('converts 2e6 to 2000000', () => expect(fromScientific('2e6')).toContain('2,000,000'));
  it('throws for invalid input', () => expect(() => fromScientific('not-a-number')).toThrow());
});
describe('convertScientific', () => {
  it('plain number returns scientific output', () => expect(convertScientific('1000')).toContain('Scientific:'));
  it('scientific notation returns from scientific', () => expect(convertScientific('1.5e+3')).toContain('1,500'));
});
