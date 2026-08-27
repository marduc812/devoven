import { checkContrast } from '@/Components/Functions/ColorContrastTools/logic';

describe('checkContrast', () => {
  it('gives black on white the maximum 21:1 ratio', () => {
    const r = checkContrast('#000000', '#ffffff');
    expect(r.ratio).toBeCloseTo(21, 5);
    expect(r.ratioFormatted).toBe('21.00:1');
  });

  it('gives an identical pair a 1:1 ratio', () => {
    expect(checkContrast('#3366cc', '#3366cc').ratio).toBeCloseTo(1, 5);
  });

  it('is symmetric — order of the two colors does not matter', () => {
    const a = checkContrast('#ffffff', '#767676');
    const b = checkContrast('#767676', '#ffffff');
    expect(a.ratio).toBeCloseTo(b.ratio, 10);
  });

  it('accepts hex with and without a leading #', () => {
    expect(checkContrast('000000', 'ffffff').ratio).toBeCloseTo(21, 5);
  });

  it('expands 3-digit shorthand hex', () => {
    expect(checkContrast('#000', '#fff').ratio).toBeCloseTo(21, 5);
  });

  it('normalises the returned colors to include #', () => {
    const r = checkContrast('000000', '#FFFFFF');
    expect(r.color1).toBe('#000000');
    expect(r.color2).toBe('#FFFFFF');
  });

  describe('WCAG thresholds', () => {
    it('passes every level for black on white', () => {
      const r = checkContrast('#000000', '#ffffff');
      expect(r.normalAA).toBe(true);
      expect(r.normalAAA).toBe(true);
      expect(r.largeAA).toBe(true);
      expect(r.largeAAA).toBe(true);
    });

    it('fails every level for an identical pair', () => {
      const r = checkContrast('#777777', '#777777');
      expect(r.normalAA).toBe(false);
      expect(r.normalAAA).toBe(false);
      expect(r.largeAA).toBe(false);
      expect(r.largeAAA).toBe(false);
    });

    // #767676 on white is the canonical WCAG boundary case: it clears 4.5:1 for
    // normal text but not the 7:1 needed for AAA.
    it('passes AA but not AAA for #767676 on white', () => {
      const r = checkContrast('#767676', '#ffffff');
      expect(r.ratio).toBeGreaterThanOrEqual(4.5);
      expect(r.normalAA).toBe(true);
      expect(r.normalAAA).toBe(false);
      expect(r.largeAA).toBe(true);
    });
  });

  describe('luminance', () => {
    it('reports 0 for black and 1 for white', () => {
      const r = checkContrast('#000000', '#ffffff');
      expect(r.luminance1).toBeCloseTo(0, 10);
      expect(r.luminance2).toBeCloseTo(1, 10);
    });
  });

  describe('invalid input', () => {
    it('throws on a hex of the wrong length', () => {
      expect(() => checkContrast('#12345', '#ffffff')).toThrow(/Invalid hex color/);
    });

    it('throws on non-hex characters', () => {
      expect(() => checkContrast('#zzzzzz', '#ffffff')).toThrow(/Invalid hex color/);
    });

    it('throws on an empty color', () => {
      expect(() => checkContrast('', '#ffffff')).toThrow(/Invalid hex color/);
    });
  });
});
