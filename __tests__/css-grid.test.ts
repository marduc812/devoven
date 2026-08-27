import { parseGridInput, generateGridCss, generateResponsiveGrid, GRID_PATTERNS } from '../Components/Functions/CssGridTools/logic';

describe('CssGridTools logic', () => {
  test('GRID_PATTERNS has multiple patterns', () => {
    expect(GRID_PATTERNS.length).toBeGreaterThanOrEqual(4);
  });

  test('parseGridInput - 3 columns', () => {
    const result = parseGridInput('3 columns, 16px gap');
    expect(result.columns).toBe('repeat(3, 1fr)');
    expect(result.gap).toBe('16px');
  });

  test('parseGridInput - repeat auto-fill', () => {
    const result = parseGridInput('repeat(auto-fill, minmax(200px, 1fr))');
    expect(result.columns).toContain('repeat(auto-fill');
  });

  test('parseGridInput - rows', () => {
    const result = parseGridInput('3 columns, 2 rows');
    expect(result.rows).toBe('repeat(2, auto)');
  });

  test('generateGridCss - empty input', () => {
    expect(generateGridCss('')).toBe('');
  });

  test('generateGridCss - 3 columns', () => {
    const css = generateGridCss('3 columns, 24px gap');
    expect(css).toContain('display: grid');
    expect(css).toContain('repeat(3, 1fr)');
    expect(css).toContain('gap: 24px');
  });

  test('generateResponsiveGrid - empty input', () => {
    expect(generateResponsiveGrid('')).toBe('');
  });

  test('generateResponsiveGrid - returns media queries', () => {
    const css = generateResponsiveGrid('3 columns');
    expect(css).toContain('@media');
    expect(css).toContain('min-width');
  });

  test('GRID_PATTERNS each has name and css', () => {
    for (const p of GRID_PATTERNS) {
      expect(p.name).toBeTruthy();
      expect(p.css).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });
});
