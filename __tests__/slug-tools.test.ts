import {
  toSlug,
  toSnakeCase,
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toConstantCase,
  formatSlugVariants,
} from '../Components/Functions/SlugTools/logic';

// ─── toSlug / toKebabCase ────────────────────────────────────────────────────

describe('toKebabCase', () => {
  it('converts plain text to kebab-case', () => {
    expect(toKebabCase('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(toKebabCase('Hello, World!')).toBe('hello-world');
  });

  it('handles accented characters', () => {
    expect(toKebabCase('café au lait')).toBe('cafe-au-lait');
  });

  it('collapses multiple spaces', () => {
    expect(toKebabCase('hello   world')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(toKebabCase('')).toBe('');
  });

  it('handles already kebab-case', () => {
    expect(toKebabCase('hello-world')).toBe('hello-world');
  });
});

// ─── toSnakeCase ────────────────────────────────────────────────────────────

describe('toSnakeCase', () => {
  it('converts plain text to snake_case', () => {
    expect(toSnakeCase('Hello World')).toBe('hello_world');
  });

  it('handles camelCase input', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });

  it('removes special characters', () => {
    expect(toSnakeCase('Hello, World!')).toBe('hello_world');
  });

  it('handles accented characters', () => {
    expect(toSnakeCase('café au lait')).toBe('cafe_au_lait');
  });

  it('handles empty string', () => {
    expect(toSnakeCase('')).toBe('');
  });
});

// ─── toCamelCase ────────────────────────────────────────────────────────────

describe('toCamelCase', () => {
  it('converts plain text to camelCase', () => {
    expect(toCamelCase('Hello World')).toBe('helloWorld');
  });

  it('handles multiple words', () => {
    expect(toCamelCase('the quick brown fox')).toBe('theQuickBrownFox');
  });

  it('handles single word', () => {
    expect(toCamelCase('hello')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(toCamelCase('')).toBe('');
  });
});

// ─── toPascalCase ────────────────────────────────────────────────────────────

describe('toPascalCase', () => {
  it('converts plain text to PascalCase', () => {
    expect(toPascalCase('Hello World')).toBe('HelloWorld');
  });

  it('handles single word', () => {
    expect(toPascalCase('hello')).toBe('Hello');
  });

  it('handles multiple words', () => {
    expect(toPascalCase('the quick brown fox')).toBe('TheQuickBrownFox');
  });
});

// ─── toConstantCase ─────────────────────────────────────────────────────────

describe('toConstantCase', () => {
  it('converts plain text to CONSTANT_CASE', () => {
    expect(toConstantCase('Hello World')).toBe('HELLO_WORLD');
  });

  it('handles camelCase input', () => {
    expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD');
  });

  it('handles special characters', () => {
    expect(toConstantCase('Hello, World!')).toBe('HELLO_WORLD');
  });
});

// ─── formatSlugVariants ──────────────────────────────────────────────────────

describe('formatSlugVariants', () => {
  it('outputs all 5 variants', () => {
    const result = formatSlugVariants('Hello World');
    expect(result).toContain('hello-world');
    expect(result).toContain('hello_world');
    expect(result).toContain('helloWorld');
    expect(result).toContain('HelloWorld');
    expect(result).toContain('HELLO_WORLD');
  });

  it('includes all format labels', () => {
    const result = formatSlugVariants('test');
    expect(result).toContain('slug (kebab-case)');
    expect(result).toContain('snake_case');
    expect(result).toContain('camelCase');
    expect(result).toContain('PascalCase');
    expect(result).toContain('CONSTANT_CASE');
  });
});
