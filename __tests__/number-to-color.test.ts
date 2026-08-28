import { stringToHash, hashToColor, stringToColor, generateColorVariants } from '@/Components/Functions/NumberToColorTools/logic';
describe('stringToHash', () => {
  it('returns consistent hash for same input', () => expect(stringToHash('hello')).toBe(stringToHash('hello')));
  it('returns different hashes for different inputs', () => expect(stringToHash('hello')).not.toBe(stringToHash('world')));
  it('returns a positive number', () => expect(stringToHash('test')).toBeGreaterThanOrEqual(0));
});
describe('hashToColor', () => {
  it('returns a hex color starting with #', () => expect(hashToColor(0xFFCC00)).toMatch(/^#[0-9A-F]{6}$/));
  it('returns 7 characters total', () => expect(hashToColor(12345678)).toHaveLength(7));
});
describe('stringToColor', () => {
  it('returns valid hex color', () => expect(stringToColor('alice')).toMatch(/^#[0-9A-F]{6}$/));
  it('returns consistent color', () => expect(stringToColor('alice')).toBe(stringToColor('alice')));
  it('different strings give different colors', () => expect(stringToColor('alice')).not.toBe(stringToColor('bob')));
});
describe('generateColorVariants', () => {
  it('includes base color', () => expect(generateColorVariants('alice')).toContain('Base color:'));
  it('includes complementary', () => expect(generateColorVariants('42')).toContain('Complementary:'));
  it('includes CSS usage', () => expect(generateColorVariants('test')).toContain('CSS Usage:'));
});
