import {
  DEFAULT_OPTIONS,
  generatePrettierConfig,
  generateFullConfig,
  getExampleCode,
  PrettierOptions,
} from '@/Components/Functions/PrettierConfigTools/logic';

describe('generatePrettierConfig', () => {
  it('returns empty object comment for all defaults', () => {
    const result = generatePrettierConfig({ ...DEFAULT_OPTIONS });
    expect(result).toContain('{}');
  });

  it('includes singleQuote when changed from default', () => {
    const opts: PrettierOptions = { ...DEFAULT_OPTIONS, singleQuote: true };
    const result = generatePrettierConfig(opts);
    expect(result).toContain('"singleQuote": true');
  });

  it('includes semi: false when changed', () => {
    const opts: PrettierOptions = { ...DEFAULT_OPTIONS, semi: false };
    const result = generatePrettierConfig(opts);
    expect(result).toContain('"semi": false');
  });

  it('includes printWidth when changed from 80', () => {
    const opts: PrettierOptions = { ...DEFAULT_OPTIONS, printWidth: 120 };
    const result = generatePrettierConfig(opts);
    expect(result).toContain('"printWidth": 120');
  });

  it('includes useTabs when changed', () => {
    const opts: PrettierOptions = { ...DEFAULT_OPTIONS, useTabs: true };
    const result = generatePrettierConfig(opts);
    expect(result).toContain('"useTabs": true');
  });
});

describe('generateFullConfig', () => {
  it('always returns valid JSON', () => {
    const result = generateFullConfig({ ...DEFAULT_OPTIONS });
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('contains all expected keys', () => {
    const parsed = JSON.parse(generateFullConfig({ ...DEFAULT_OPTIONS }));
    expect(parsed).toHaveProperty('printWidth');
    expect(parsed).toHaveProperty('tabWidth');
    expect(parsed).toHaveProperty('semi');
    expect(parsed).toHaveProperty('singleQuote');
    expect(parsed).toHaveProperty('trailingComma');
    expect(parsed).toHaveProperty('bracketSpacing');
    expect(parsed).toHaveProperty('endOfLine');
    expect(parsed).toHaveProperty('arrowParens');
  });

  it('reflects non-default values', () => {
    const opts: PrettierOptions = { ...DEFAULT_OPTIONS, printWidth: 100, tabWidth: 4 };
    const parsed = JSON.parse(generateFullConfig(opts));
    expect(parsed.printWidth).toBe(100);
    expect(parsed.tabWidth).toBe(4);
  });
});

describe('getExampleCode', () => {
  it('returns a non-empty string', () => {
    const code = getExampleCode({ ...DEFAULT_OPTIONS });
    expect(code.length).toBeGreaterThan(0);
  });

  it('uses single quotes when singleQuote is true', () => {
    const code = getExampleCode({ ...DEFAULT_OPTIONS, singleQuote: true });
    expect(code).toContain("'");
  });

  it('omits semicolons when semi is false', () => {
    const code = getExampleCode({ ...DEFAULT_OPTIONS, semi: false });
    // Should not end lines with semicolons
    expect(code).not.toMatch(/;\n/);
  });
});
