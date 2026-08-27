import { calculateFluidType, pxToRem, getFluidTypePresets } from '../Components/Functions/FluidTypeTools/logic';

describe('pxToRem', () => {
  it('converts 16px to 1rem', () => {
    expect(pxToRem(16)).toBe(1);
  });

  it('converts 24px to 1.5rem', () => {
    expect(pxToRem(24)).toBe(1.5);
  });

  it('converts 32px to 2rem', () => {
    expect(pxToRem(32)).toBe(2);
  });

  it('converts 8px to 0.5rem', () => {
    expect(pxToRem(8)).toBe(0.5);
  });
});

describe('calculateFluidType', () => {
  const defaultInput = {
    minFontPx: 16,
    maxFontPx: 24,
    minViewportPx: 320,
    maxViewportPx: 1440,
  };

  it('returns a clampValue string', () => {
    const result = calculateFluidType(defaultInput);
    expect(result.clampValue).toContain('clamp(');
    expect(result.clampValue).toContain('rem');
    expect(result.clampValue).toContain('vw');
  });

  it('returns a cssRule with font-size', () => {
    const result = calculateFluidType(defaultInput);
    expect(result.cssRule).toContain('font-size:');
    expect(result.cssRule).toContain('clamp(');
  });

  it('minRem is correct for 16px', () => {
    const result = calculateFluidType(defaultInput);
    expect(result.minRem).toBe(1);
  });

  it('maxRem is correct for 24px', () => {
    const result = calculateFluidType(defaultInput);
    expect(result.maxRem).toBe(1.5);
  });

  it('provides calculation steps', () => {
    const result = calculateFluidType(defaultInput);
    expect(result.steps.length).toBeGreaterThan(5);
    expect(result.steps.some(s => s.includes('slope'))).toBe(true);
  });

  it('throws on zero font size', () => {
    expect(() => calculateFluidType({ ...defaultInput, minFontPx: 0 })).toThrow();
  });

  it('throws on negative font size', () => {
    expect(() => calculateFluidType({ ...defaultInput, maxFontPx: -10 })).toThrow();
  });

  it('throws when min viewport >= max viewport', () => {
    expect(() => calculateFluidType({ ...defaultInput, minViewportPx: 1440, maxViewportPx: 320 })).toThrow();
    expect(() => calculateFluidType({ ...defaultInput, minViewportPx: 1440, maxViewportPx: 1440 })).toThrow();
  });

  it('works for identical font sizes (no scaling)', () => {
    const result = calculateFluidType({ ...defaultInput, minFontPx: 16, maxFontPx: 16 });
    expect(result.cssRule).toContain('clamp(');
    expect(result.minRem).toBe(result.maxRem);
  });

  it('clamp min and max match input rem values', () => {
    const result = calculateFluidType(defaultInput);
    const minStr = result.minRem.toFixed(4) + 'rem';
    const maxStr = result.maxRem.toFixed(4) + 'rem';
    expect(result.clampValue).toContain(minStr);
    expect(result.clampValue).toContain(maxStr);
  });
});

describe('getFluidTypePresets', () => {
  it('returns at least 5 presets', () => {
    const presets = getFluidTypePresets();
    expect(presets.length).toBeGreaterThanOrEqual(5);
  });

  it('each preset has a name, minFontPx, maxFontPx', () => {
    const presets = getFluidTypePresets();
    for (const p of presets) {
      expect(p.name).toBeTruthy();
      expect(p.minFontPx).toBeGreaterThan(0);
      expect(p.maxFontPx).toBeGreaterThan(0);
    }
  });

  it('each preset is valid input for calculateFluidType', () => {
    const presets = getFluidTypePresets();
    for (const p of presets) {
      const result = calculateFluidType({
        minFontPx: p.minFontPx,
        maxFontPx: p.maxFontPx,
        minViewportPx: 320,
        maxViewportPx: 1440,
      });
      expect(result.cssRule).toContain('clamp(');
    }
  });
});
