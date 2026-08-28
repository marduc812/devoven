import { mixColors, generateMixSteps, formatColorMix } from '@/Components/Functions/ColorMixerTools/logic';
describe('mixColors', () => {
  it('mixing black and white 50% gives gray', () => expect(mixColors('#000000', '#FFFFFF', 0.5)).toBe('#808080'));
  it('mixing with weight 1 returns first color', () => expect(mixColors('#FF0000', '#0000FF', 1)).toBe('#FF0000'));
  it('mixing with weight 0 returns second color', () => expect(mixColors('#FF0000', '#0000FF', 0)).toBe('#0000FF'));
  it('handles shorthand hex', () => expect(mixColors('#FFF', '#000', 0.5)).toBe('#808080'));
  it('throws for invalid hex', () => expect(() => mixColors('invalid', '#000')).toThrow());
});
describe('generateMixSteps', () => {
  it('returns steps+1 colors', () => expect(generateMixSteps('#FF0000', '#0000FF', 4)).toHaveLength(5));
  it('first step is color1', () => expect(generateMixSteps('#FF0000', '#0000FF', 4)[0]).toBe('#FF0000'));
  it('last step is color2', () => expect(generateMixSteps('#FF0000', '#0000FF', 4)[4]).toBe('#0000FF'));
});
describe('formatColorMix', () => {
  it('includes Color 1 label', () => expect(formatColorMix('#FF0000', '#0000FF')).toContain('Color 1:'));
  it('includes Mix Gradient section', () => expect(formatColorMix('#FF0000', '#0000FF')).toContain('Mix Gradient'));
});
