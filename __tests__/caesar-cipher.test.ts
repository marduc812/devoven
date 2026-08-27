import { caesarShift, rot13, bruteForceCaesar } from '@/Components/Functions/CaesarCipherTools/logic';
describe('caesarShift', () => {
  it('shifts A by 1 to B', () => expect(caesarShift('A', 1)).toBe('B'));
  it('wraps Z by 1 to A', () => expect(caesarShift('Z', 1)).toBe('A'));
  it('preserves case', () => expect(caesarShift('Hello', 3)).toBe('Khoor'));
  it('leaves non-alpha unchanged', () => expect(caesarShift('Hello, World!', 0)).toBe('Hello, World!'));
  it('shift 0 is identity', () => expect(caesarShift('ABC', 0)).toBe('ABC'));
  it('shift 26 is identity', () => expect(caesarShift('ABC', 26)).toBe('ABC'));
  it('negative shift decodes', () => expect(caesarShift('Khoor', -3)).toBe('Hello'));
});
describe('rot13', () => {
  it('encodes Hello to Uryyb', () => expect(rot13('Hello')).toBe('Uryyb'));
  it('is its own inverse', () => expect(rot13(rot13('Hello World'))).toBe('Hello World'));
});
describe('bruteForceCaesar', () => {
  it('returns 26 lines', () => expect(bruteForceCaesar('ABC').split('\n')).toHaveLength(26));
  it('contains Shift  0', () => expect(bruteForceCaesar('ABC')).toContain('Shift  0: ABC'));
});
