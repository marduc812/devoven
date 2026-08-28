// Tests for the /text/slug-generator route logic
// (wraps SlugTools — see also slug-tools.test.ts)
import {
  toSlug,
  toKebabCase,
  toSnakeCase,
  toCamelCase,
  toPascalCase,
  toConstantCase,
  formatSlugVariants,
} from '../Components/Functions/SlugTools/logic';

describe('slug-generator route — slug variants', () => {
  describe('toSlug (hyphen separator)', () => {
    it('lowercases and hyphenates', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('strips special characters', () => {
      expect(toSlug('Hello, World!')).toBe('hello-world');
    });

    it('handles diacritics', () => {
      expect(toSlug('café')).toBe('cafe');
    });

    it('handles empty string', () => {
      expect(toSlug('')).toBe('');
    });
  });

  describe('toSnakeCase', () => {
    it('converts to snake_case', () => {
      expect(toSnakeCase('Hello World')).toBe('hello_world');
    });

    it('converts camelCase to snake_case', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });
  });

  describe('toCamelCase', () => {
    it('converts to camelCase', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });

    it('handles single word', () => {
      expect(toCamelCase('hello')).toBe('hello');
    });
  });

  describe('toPascalCase', () => {
    it('converts to PascalCase', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld');
    });
  });

  describe('toConstantCase', () => {
    it('converts to CONSTANT_CASE', () => {
      expect(toConstantCase('hello world')).toBe('HELLO_WORLD');
    });
  });

  describe('toKebabCase', () => {
    it('converts to kebab-case', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
    });
  });

  describe('formatSlugVariants', () => {
    it('contains all variant labels', () => {
      const result = formatSlugVariants('Hello World');
      expect(result).toContain('hello-world');
      expect(result).toContain('hello_world');
      expect(result).toContain('helloWorld');
      expect(result).toContain('HelloWorld');
      expect(result).toContain('HELLO_WORLD');
    });
  });
});
