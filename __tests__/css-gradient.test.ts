import {
  parseGradientConfig,
  generateGradient,
  formatGradientOutput,
  processGradientInput,
  GRADIENT_EXAMPLES,
} from '@/Components/Functions/CssGradientTools/logic';

describe('parseGradientConfig', () => {
  it('parses linear gradient config', () => {
    const config = parseGradientConfig('type: linear\nangle: 135\ncolors: #ff0000 0%, #0000ff 100%');
    expect(config.type).toBe('linear');
    expect(config.angle).toBe(135);
    expect(config.colors).toBe('#ff0000 0%, #0000ff 100%');
  });
  it('parses radial gradient config', () => {
    const config = parseGradientConfig('type: radial\nshape: circle\ncolors: #ff0000 0%, #0000ff 100%');
    expect(config.type).toBe('radial');
    expect(config.shape).toBe('circle');
  });
  it('parses conic gradient config', () => {
    const config = parseGradientConfig('type: conic\nangle: 45\ncolors: red 0%, blue 100%');
    expect(config.type).toBe('conic');
    expect(config.angle).toBe(45);
  });
  it('defaults to linear when type not specified', () => {
    const config = parseGradientConfig('colors: red 0%, blue 100%');
    expect(config.type).toBe('linear');
  });
  it('ignores comment lines', () => {
    const config = parseGradientConfig('# comment\ntype: linear\ncolors: red 0%, blue 100%');
    expect(config.type).toBe('linear');
  });
});

describe('generateGradient', () => {
  const baseConfig = { type: 'linear' as const, angle: 90, shape: 'ellipse', colors: '#ff0000 0%, #0000ff 100%' };

  it('generates linear gradient with correct angle', () => {
    const out = generateGradient(baseConfig);
    expect(out.standard).toContain('linear-gradient(90deg');
    expect(out.standard).toContain('#ff0000 0%, #0000ff 100%');
  });
  it('generates webkit prefix for linear', () => {
    const out = generateGradient(baseConfig);
    expect(out.webkit).toContain('-webkit-linear-gradient');
  });
  it('generates moz prefix for linear', () => {
    const out = generateGradient(baseConfig);
    expect(out.moz).toContain('-moz-linear-gradient');
  });
  it('generates radial gradient', () => {
    const out = generateGradient({ ...baseConfig, type: 'radial', shape: 'circle' });
    expect(out.standard).toContain('radial-gradient(circle');
  });
  it('generates conic gradient', () => {
    const out = generateGradient({ ...baseConfig, type: 'conic', angle: 45 });
    expect(out.standard).toContain('conic-gradient(from 45deg');
  });
  it('throws when less than 2 color stops', () => {
    expect(() => generateGradient({ ...baseConfig, colors: '#ff0000' })).toThrow();
  });
  it('throws when colors is empty', () => {
    expect(() => generateGradient({ ...baseConfig, colors: '' })).toThrow();
  });
  it('cssProperty includes background: lines', () => {
    const out = generateGradient(baseConfig);
    expect(out.cssProperty).toContain('background:');
  });
});

describe('formatGradientOutput', () => {
  it('includes standard, webkit, moz in output', () => {
    const config = { type: 'linear' as const, angle: 90, shape: 'ellipse', colors: '#ff0000 0%, #0000ff 100%' };
    const out = generateGradient(config);
    const formatted = formatGradientOutput(out);
    expect(formatted).toContain('/* Standard */');
    expect(formatted).toContain('/* With vendor prefixes */');
    expect(formatted).toContain('-webkit-linear-gradient');
    expect(formatted).toContain('-moz-linear-gradient');
  });
});

describe('processGradientInput', () => {
  it('processes a full config string', () => {
    const result = processGradientInput('type: linear\nangle: 135\ncolors: #ff0000 0%, #0000ff 100%');
    expect(result).toContain('linear-gradient');
    expect(result).toContain('135deg');
  });
  it('throws on missing colors', () => {
    expect(() => processGradientInput('type: linear\nangle: 90\ncolors: #ff0000')).toThrow();
  });
});

describe('GRADIENT_EXAMPLES', () => {
  it('has at least 5 examples', () => {
    expect(GRADIENT_EXAMPLES.length).toBeGreaterThanOrEqual(5);
  });
  it('each example has label and config', () => {
    GRADIENT_EXAMPLES.forEach(ex => {
      expect(ex.label).toBeTruthy();
      expect(ex.config).toBeTruthy();
    });
  });
  it('all examples are processable', () => {
    GRADIENT_EXAMPLES.forEach(ex => {
      expect(() => processGradientInput(ex.config)).not.toThrow();
    });
  });
});
