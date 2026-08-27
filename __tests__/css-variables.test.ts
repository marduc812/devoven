import {
  extractCssVariables,
  formatCssVariables,
  cssVariablesToJson,
} from '@/Components/Functions/CssVariableTools/logic';

const sampleCss = `
:root {
  --color-primary: #3490dc;
  --color-secondary: #ffed4a;
  --font-size-base: 16px;
}

.dark {
  --color-primary: #1a56db;
}
`;

// ─── extractCssVariables ──────────────────────────────────────────────────────

describe('extractCssVariables', () => {
  it('extracts variables from :root block', () => {
    const vars = extractCssVariables(sampleCss);
    expect(vars.length).toBeGreaterThanOrEqual(3);
  });

  it('includes variable name, value, and selector', () => {
    const vars = extractCssVariables(sampleCss);
    const primary = vars.find(v => v.name === '--color-primary');
    expect(primary).toBeDefined();
    expect(primary?.value).toBe('#3490dc');
    expect(primary?.selector).toBe(':root');
  });

  it('extracts variables from multiple selectors', () => {
    const vars = extractCssVariables(sampleCss);
    const darkPrimary = vars.find(v => v.name === '--color-primary' && v.selector === '.dark');
    expect(darkPrimary).toBeDefined();
  });

  it('returns empty array for CSS without variables', () => {
    const vars = extractCssVariables('body { color: red; }');
    expect(vars).toHaveLength(0);
  });

  it('returns empty array for empty string', () => {
    const vars = extractCssVariables('');
    expect(vars).toHaveLength(0);
  });

  it('handles variable with spaces around colon', () => {
    const css = ':root { --spacing : 8px; }';
    const vars = extractCssVariables(css);
    expect(vars.length).toBeGreaterThanOrEqual(1);
    expect(vars[0].value).toBe('8px');
  });
});

// ─── formatCssVariables ───────────────────────────────────────────────────────

describe('formatCssVariables', () => {
  it('returns "No CSS variables found" for empty array', () => {
    expect(formatCssVariables([])).toBe('No CSS variables found.');
  });

  it('shows found count', () => {
    const vars = extractCssVariables(sampleCss);
    const output = formatCssVariables(vars);
    expect(output).toContain('Found');
    expect(output).toContain('variable');
  });

  it('groups variables by selector', () => {
    const vars = extractCssVariables(sampleCss);
    const output = formatCssVariables(vars);
    expect(output).toContain(':root {');
    expect(output).toContain('.dark {');
  });

  it('outputs variable name-value pairs', () => {
    const vars = extractCssVariables(sampleCss);
    const output = formatCssVariables(vars);
    expect(output).toContain('--color-primary');
    expect(output).toContain('#3490dc');
  });
});

// ─── cssVariablesToJson ───────────────────────────────────────────────────────

describe('cssVariablesToJson', () => {
  it('returns valid JSON', () => {
    const vars = extractCssVariables(sampleCss);
    const json = cssVariablesToJson(vars);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes variable names as keys', () => {
    const vars = extractCssVariables(sampleCss);
    const obj = JSON.parse(cssVariablesToJson(vars));
    expect(obj['--color-primary']).toBeDefined();
  });

  it('returns empty object for no vars', () => {
    const obj = JSON.parse(cssVariablesToJson([]));
    expect(obj).toEqual({});
  });
});
