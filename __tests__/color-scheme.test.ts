import { generateColorScheme } from '@/Components/Functions/ColorSchemeTools/logic';
describe('generateColorScheme', () => {
  it('includes all scheme types', () => {
    const r = generateColorScheme('#FF6B6B');
    expect(r).toContain('Complementary');
    expect(r).toContain('Triadic');
    expect(r).toContain('Monochromatic');
    expect(r).toContain('Analogous');
  });
  it('includes base color info', () => expect(generateColorScheme('#3B82F6')).toContain('Base color:'));
  it('throws for invalid hex', () => expect(() => generateColorScheme('invalid')).toThrow());
  it('handles hex with # prefix', () => expect(() => generateColorScheme('#FF0000')).not.toThrow());
  it('handles hex without # prefix', () => expect(() => generateColorScheme('FF0000')).not.toThrow());
});
