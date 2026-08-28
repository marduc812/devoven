import { convertCssUnit } from '@/Components/Functions/CssUnitTools/logic';
describe('convertCssUnit', () => {
  it('converts 16px to 1rem', () => expect(convertCssUnit(16, 'px')).toContain('rem:  1'));
  it('converts 1rem to 16px', () => expect(convertCssUnit(1, 'rem')).toContain('px:   16'));
  it('converts 1in to 96px', () => expect(convertCssUnit(1, 'in')).toContain('px:   96'));
  it('converts 72pt to 96px', () => expect(convertCssUnit(72, 'pt')).toContain('px:   96'));
  it('converts 2.54cm to 96px', () => expect(convertCssUnit(2.54, 'cm')).toContain('px:   96'));
  it('includes vw in output', () => expect(convertCssUnit(100, 'px')).toContain('vw:'));
  it('includes vh in output', () => expect(convertCssUnit(100, 'px')).toContain('vh:'));
  it('throws for unknown unit', () => expect(() => convertCssUnit(1, 'foo')).toThrow());
  it('respects custom baseFontSize', () => {
    const result = convertCssUnit(1, 'rem', { baseFontSize: 18 });
    expect(result).toContain('px:   18');
  });
});
