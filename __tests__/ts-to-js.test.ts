import { stripTypes, removeTypeImports } from '@/Components/Functions/TsToJsTools/logic';

describe('stripTypes - happy path', () => {
  it('removes simple type annotation from variable', () => {
    const result = stripTypes('const x: string = "hello";');
    expect(result).not.toContain(': string');
    expect(result).toContain('const x');
    expect(result).toContain('"hello"');
  });

  it('removes type annotations from function parameters', () => {
    const result = stripTypes('function add(a: number, b: number): number { return a + b; }');
    expect(result).not.toContain(': number');
    expect(result).toContain('function add(a, b)');
  });

  it('removes interface declarations', () => {
    const input = `interface User {
  name: string;
  age: number;
}
const x = 1;`;
    const result = stripTypes(input);
    expect(result).not.toContain('interface User');
    expect(result).toContain('const x = 1;');
  });

  it('removes type alias declarations', () => {
    const input = `type MyType = string | number;
const x = 1;`;
    const result = stripTypes(input);
    expect(result).not.toContain('type MyType');
    expect(result).toContain('const x = 1;');
  });

  it('removes import type statements', () => {
    const input = `import type { Foo, Bar } from './types';
const x = 1;`;
    const result = stripTypes(input);
    expect(result).not.toContain('import type');
    expect(result).toContain('const x = 1;');
  });

  it('removes access modifiers', () => {
    const input = `class MyClass {
  public name: string;
  private age: number;
  protected id: string;
}`;
    const result = stripTypes(input);
    expect(result).not.toContain('public');
    expect(result).not.toContain('private');
    expect(result).not.toContain('protected');
  });

  it('removes readonly keyword', () => {
    const result = stripTypes('const obj = { readonly name: "hello" };');
    expect(result).not.toContain('readonly');
  });

  it('removes as type assertions', () => {
    const result = stripTypes('const x = foo as string;');
    expect(result).not.toContain(' as string');
  });
});

describe('stripTypes - edge cases', () => {
  it('handles empty string', () => {
    expect(stripTypes('')).toBe('');
  });

  it('handles plain JavaScript without changes', () => {
    const js = 'const x = 1;\nconst y = "hello";\nconsole.log(x, y);';
    const result = stripTypes(js);
    expect(result).toContain('const x = 1;');
    expect(result).toContain('const y = "hello"');
  });

  it('collapses multiple blank lines', () => {
    const input = 'const a = 1;\n\n\n\nconst b = 2;';
    const result = stripTypes(input);
    const blanks = result.match(/\n{3,}/);
    expect(blanks).toBeNull();
  });

  it('removes abstract keyword', () => {
    const result = stripTypes('abstract class Foo {}');
    expect(result).not.toContain('abstract');
  });
});

describe('removeTypeImports', () => {
  it('removes type import lines', () => {
    const input = `import type { Foo } from './foo';
import { bar } from './bar';`;
    const result = removeTypeImports(input);
    expect(result).not.toContain('import type');
    expect(result).toContain("import { bar } from './bar'");
  });

  it('handles no type imports', () => {
    const input = `import { foo } from './foo';`;
    expect(removeTypeImports(input)).toBe(input);
  });

  it('handles empty string', () => {
    expect(removeTypeImports('')).toBe('');
  });
});
