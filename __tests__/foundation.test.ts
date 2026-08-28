import { colorVariants, colorBadge, colorName, MainViewColorVariants } from '../types';
import { menu } from '../menu';

const EXPECTED_CATEGORIES: MainViewColorVariants[] = [
  'yellow',
  'teal',
  'cyan',
  'lime',
  'fuchsia',
  'rose',
  'sky',
];

describe('category color maps are complete', () => {
  it.each(EXPECTED_CATEGORIES)('colorVariants has entry for %s', (key) => {
    expect(colorVariants[key]).toBeDefined();
    expect(typeof colorVariants[key]).toBe('string');
  });

  it.each(EXPECTED_CATEGORIES)('colorBadge has entry for %s', (key) => {
    expect(colorBadge[key]).toBeDefined();
    expect(typeof colorBadge[key]).toBe('string');
  });

  it.each(EXPECTED_CATEGORIES)('colorName has entry for %s', (key) => {
    expect(colorName[key]).toBeDefined();
    expect(typeof colorName[key]).toBe('string');
  });
});

describe('menu has a group per new category', () => {
  const menuColors = menu.map((g) => g.color);

  it('includes fuchsia group (image)', () => {
    expect(menuColors).toContain('fuchsia');
  });

  it('includes rose group (text)', () => {
    expect(menuColors).toContain('rose');
  });

  it('includes sky group (network)', () => {
    expect(menuColors).toContain('sky');
  });
});
