import { rgbToCmyk, cmykToRgb } from '@/Components/Functions/CmykTools/logic';

describe('rgbToCmyk', () => {
  it('matches the examples on the tool page', () => {
    expect(rgbToCmyk(164, 55, 55)).toEqual({ c: 0, m: 66, y: 66, k: 36 });
  });

  it('treats black as pure key rather than dividing by zero', () => {
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('treats white as no ink', () => {
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });
});

describe('cmykToRgb', () => {
  it('matches the examples on the tool page', () => {
    expect(cmykToRgb(85, 0, 75, 14)).toEqual({ r: 33, g: 219, b: 55 });
  });

  it('round-trips a colour through both directions', () => {
    const { c, m, y, k } = rgbToCmyk(200, 100, 50);
    const back = cmykToRgb(c, m, y, k);
    expect(Math.abs(back.r - 200)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.g - 100)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.b - 50)).toBeLessThanOrEqual(3);
  });
});
