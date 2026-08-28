import {
  SCALE_RATIOS,
  generateScale,
  formatScale,
} from '@/Components/Functions/TypeScaleTools/logic';

describe('SCALE_RATIOS', () => {
  it('has 8 presets', () => {
    expect(SCALE_RATIOS.length).toBe(8);
  });

  it('all ratios are greater than 1', () => {
    for (const r of SCALE_RATIOS) {
      expect(r.value).toBeGreaterThan(1);
    }
  });

  it('includes Perfect Fourth', () => {
    expect(SCALE_RATIOS.some(r => r.name === 'Perfect Fourth')).toBe(true);
  });

  it('includes Golden Ratio', () => {
    expect(SCALE_RATIOS.some(r => r.name === 'Golden Ratio')).toBe(true);
  });

  it('includes Minor Second', () => {
    expect(SCALE_RATIOS.some(r => r.name === 'Minor Second')).toBe(true);
  });
});

describe('generateScale', () => {
  it('generates 11 steps (-2 to +8)', () => {
    const scale = generateScale(16, 1.333);
    expect(scale.length).toBe(11);
  });

  it('base step (0) equals base px', () => {
    const scale = generateScale(16, 1.333);
    const base = scale.find(s => s.step === 0);
    expect(base).toBeDefined();
    expect(base!.px).toBe(16);
  });

  it('step +1 is base * ratio', () => {
    const scale = generateScale(16, 1.333);
    const step1 = scale.find(s => s.step === 1);
    expect(step1!.px).toBeCloseTo(16 * 1.333, 1);
  });

  it('step -1 is base / ratio', () => {
    const scale = generateScale(16, 1.333);
    const stepMinus1 = scale.find(s => s.step === -1);
    expect(stepMinus1!.px).toBeCloseTo(16 / 1.333, 1);
  });

  it('rem values use root px', () => {
    const scale = generateScale(16, 1.333, 16);
    const base = scale.find(s => s.step === 0);
    expect(base!.rem).toBe(1);
  });

  it('em value at base is 1', () => {
    const scale = generateScale(16, 1.333);
    const base = scale.find(s => s.step === 0);
    expect(base!.em).toBe(1);
  });

  it('has cssVar for each step', () => {
    const scale = generateScale(16, 1.333);
    for (const s of scale) {
      expect(s.cssVar).toMatch(/^--text-/);
    }
  });
});

describe('formatScale', () => {
  it('returns empty for empty input', () => {
    expect(formatScale('')).toBe('');
  });

  it('generates scale from numeric input', () => {
    const result = formatScale('16 1.333');
    expect(result).toContain('16');
    expect(result).toContain('1.333');
    expect(result).toContain(':root');
  });

  it('accepts preset name', () => {
    const result = formatScale('16 perfect fourth');
    expect(result).toContain('Perfect Fourth');
  });

  it('accepts golden ratio preset', () => {
    const result = formatScale('16 golden ratio');
    expect(result).toContain('Golden Ratio');
  });

  it('generates CSS custom properties', () => {
    const result = formatScale('16 1.333');
    expect(result).toContain('--text-');
    expect(result).toContain('rem;');
  });

  it('shows presets list', () => {
    const result = formatScale('16');
    expect(result).toContain('Available Presets');
    expect(result).toContain('Minor Second');
  });

  it('handles px suffix on base', () => {
    const result = formatScale('16px 1.25');
    expect(result).toContain('16');
  });

  it('includes all step labels', () => {
    const result = formatScale('16 1.333');
    expect(result).toContain('base');
    expect(result).toContain('lg');
    expect(result).toContain('sm');
  });
});
