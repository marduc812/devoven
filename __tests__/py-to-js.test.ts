import { convertPyToJs } from '@/Components/Functions/PyToJsTools/logic';

describe('convertPyToJs', () => {
  it('returns empty output for empty input', () => {
    const result = convertPyToJs('');
    expect(result.output).toBe('');
    expect(result.notes).toHaveLength(0);
  });

  it('converts print() to console.log()', () => {
    const result = convertPyToJs('print("hello")');
    expect(result.output).toContain('console.log(');
  });

  it('converts True to true', () => {
    const result = convertPyToJs('x = True');
    expect(result.output).toContain('true');
  });

  it('converts False to false', () => {
    const result = convertPyToJs('x = False');
    expect(result.output).toContain('false');
  });

  it('converts None to null', () => {
    const result = convertPyToJs('x = None');
    expect(result.output).toContain('null');
  });

  it('converts def to function', () => {
    const result = convertPyToJs('def greet(name):');
    expect(result.output).toContain('function greet(name)');
  });

  it('converts elif to else if', () => {
    const result = convertPyToJs('elif x > 5:');
    expect(result.output).toContain('else if');
  });

  it('converts Python comment to JS comment', () => {
    const result = convertPyToJs('# this is a comment');
    expect(result.output).toContain('//');
  });

  it('converts f-strings to template literals', () => {
    const result = convertPyToJs('f"Hello {name}"');
    expect(result.output).toContain('`Hello ${name}`');
  });

  it('converts len(x) to x.length', () => {
    const result = convertPyToJs('len(arr)');
    expect(result.output).toContain('arr.length');
  });

  it('converts range(n) to Array.from', () => {
    const result = convertPyToJs('range(5)');
    expect(result.output).toContain('Array.from');
  });

  it('converts ** to Math.pow', () => {
    const result = convertPyToJs('x**2');
    expect(result.output).toContain('Math.pow');
  });

  it('adds notes for non-empty conversion', () => {
    const result = convertPyToJs('print("test")');
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('converts import to commented line', () => {
    const result = convertPyToJs('import os');
    expect(result.output).toContain('//');
  });
});
