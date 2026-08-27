import {
  parseBoxShadowInput,
  shadowToString,
  generateBoxShadowCSS,
  getBoxShadowPresets,
  formatBoxShadowOutput,
} from '../Components/Functions/BoxShadowTools/logic';

describe('parseBoxShadowInput', () => {
  it('returns empty array for empty string', () => {
    expect(parseBoxShadowInput('')).toHaveLength(0);
  });

  it('parses basic x, y, blur, spread, color', () => {
    const result = parseBoxShadowInput('x=4, y=4, blur=10, spread=0, color=rgba(0,0,0,0.3)');
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(4);
    expect(result[0].y).toBe(4);
    expect(result[0].blur).toBe(10);
    expect(result[0].spread).toBe(0);
    expect(result[0].color).toBe('rgba(0,0,0,0.3)');
    expect(result[0].inset).toBe(false);
  });

  it('parses inset=true', () => {
    const result = parseBoxShadowInput('x=0, y=2, blur=6, spread=0, color=black, inset=true');
    expect(result[0].inset).toBe(true);
  });

  it('parses multiple shadows separated by semicolons', () => {
    const result = parseBoxShadowInput('x=2, y=2, blur=4, spread=0, color=black; x=0, y=0, blur=10, spread=2, color=blue');
    expect(result).toHaveLength(2);
    expect(result[0].x).toBe(2);
    expect(result[1].x).toBe(0);
    expect(result[1].color).toBe('blue');
  });

  it('uses defaults for missing keys', () => {
    const result = parseBoxShadowInput('color=red');
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(4);
    expect(result[0].blur).toBe(6);
    expect(result[0].spread).toBe(0);
    expect(result[0].color).toBe('red');
  });

  it('handles negative values', () => {
    const result = parseBoxShadowInput('x=-5, y=-3, blur=8, spread=0, color=#000');
    expect(result[0].x).toBe(-5);
    expect(result[0].y).toBe(-3);
  });
});

describe('shadowToString', () => {
  it('generates correct CSS value', () => {
    const s = { x: 4, y: 4, blur: 10, spread: 0, color: 'rgba(0,0,0,0.3)', inset: false };
    expect(shadowToString(s)).toBe('4px 4px 10px 0px rgba(0,0,0,0.3)');
  });

  it('adds inset keyword when inset is true', () => {
    const s = { x: 0, y: 2, blur: 6, spread: 0, color: 'black', inset: true };
    const result = shadowToString(s);
    expect(result).toContain('inset');
    expect(result.startsWith('inset')).toBe(true);
  });
});

describe('generateBoxShadowCSS', () => {
  it('returns empty string for no shadows', () => {
    expect(generateBoxShadowCSS([])).toBe('');
  });

  it('wraps in box-shadow property', () => {
    const shadows = [{ x: 2, y: 2, blur: 5, spread: 0, color: '#000', inset: false }];
    const result = generateBoxShadowCSS(shadows);
    expect(result).toContain('box-shadow:');
    expect(result).toContain('2px 2px 5px 0px #000');
  });

  it('joins multiple shadows with comma', () => {
    const shadows = [
      { x: 2, y: 2, blur: 5, spread: 0, color: '#000', inset: false },
      { x: 0, y: 4, blur: 10, spread: 0, color: 'rgba(0,0,0,0.3)', inset: false },
    ];
    const result = generateBoxShadowCSS(shadows);
    expect(result.split(',').length).toBeGreaterThanOrEqual(2);
  });
});

describe('getBoxShadowPresets', () => {
  it('returns at least 8 presets', () => {
    const presets = getBoxShadowPresets();
    expect(presets.length).toBeGreaterThanOrEqual(8);
  });

  it('each preset has name, description, and css', () => {
    const presets = getBoxShadowPresets();
    for (const p of presets) {
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.css).toContain('box-shadow:');
    }
  });

  it('includes an inset preset', () => {
    const presets = getBoxShadowPresets();
    const insetPreset = presets.find(p => p.css.includes('inset'));
    expect(insetPreset).toBeDefined();
  });
});

describe('formatBoxShadowOutput', () => {
  it('returns empty string for empty input', () => {
    expect(formatBoxShadowOutput('')).toBe('');
  });

  it('returns CSS for valid input', () => {
    const output = formatBoxShadowOutput('x=4, y=4, blur=10, spread=0, color=black');
    expect(output).toContain('box-shadow:');
  });

  it('handles multiple shadows', () => {
    const output = formatBoxShadowOutput('x=2, y=2, blur=4, spread=0, color=black; x=0, y=0, blur=8, spread=2, color=blue');
    expect(output).toContain('box-shadow:');
    expect(output).toContain('Layer');
  });
});
