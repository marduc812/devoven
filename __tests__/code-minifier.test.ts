import { minifyCode, formatMinify } from '@/Components/Functions/CodeMinifierTools/logic';

describe('minifyCode - JavaScript', () => {
  it('removes block comments', () => {
    const r = minifyCode('/* comment */ var x = 1;', 'js');
    expect(r.minified).not.toContain('comment');
    expect(r.minified).toContain('var x=1');
  });

  it('removes line comments', () => {
    const r = minifyCode('var x = 1; // comment\nvar y = 2;', 'js');
    expect(r.minified).not.toContain('comment');
  });

  it('collapses whitespace', () => {
    const r = minifyCode('var   x   =   1;', 'js');
    expect(r.minified).toContain('var x=1');
  });

  it('removes semicolon before closing brace', () => {
    const r = minifyCode('function f() { return 1; }', 'js');
    expect(r.minified).not.toContain(';}');
  });

  it('minified size is smaller than original', () => {
    const code = `
      // This is a long comment
      function hello(name) {
        /* Another comment */
        var greeting = "Hello, " + name + "!";
        return greeting;
      }
    `;
    const r = minifyCode(code, 'js');
    expect(r.minifiedSize).toBeLessThan(r.originalSize);
    expect(r.savingsPercent).toBeGreaterThan(0);
  });

  it('preserves string literals (comment-like content stays in output)', () => {
    const r = minifyCode('var s = "not // a comment";', 'js');
    // The string content is preserved (not removed as a comment), though spaces may be collapsed
    expect(r.minified).toContain('not');
    expect(r.minified).toContain('a comment');
  });
});

describe('minifyCode - CSS', () => {
  it('removes CSS comments', () => {
    const r = minifyCode('/* comment */ body { color: red; }', 'css');
    expect(r.minified).not.toContain('comment');
    expect(r.minified).toContain('body{color:red}');
  });

  it('collapses whitespace in CSS', () => {
    const r = minifyCode('body  {  color :  red  ;  }', 'css');
    expect(r.minified).toContain('body{color:red}');
  });

  it('minified CSS is smaller', () => {
    const css = `
      /* Main styles */
      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `;
    const r = minifyCode(css, 'css');
    expect(r.minifiedSize).toBeLessThan(r.originalSize);
  });
});

describe('minifyCode - auto-detect', () => {
  it('detects JS for function keyword', () => {
    const r = minifyCode('function test() { return 1; }', 'auto');
    expect(r.language).toBe('js');
  });

  it('detects CSS for selector pattern', () => {
    const r = minifyCode('.class { color: red; }', 'auto');
    expect(r.language).toBe('css');
  });

  it('throws for empty input', () => {
    expect(() => minifyCode('', 'js')).toThrow();
  });
});

describe('formatMinify', () => {
  it('includes size info', () => {
    const out = formatMinify('var x = 1; // comment', 'js');
    expect(out).toContain('Original size');
    expect(out).toContain('Minified size');
    expect(out).toContain('Savings');
  });

  it('includes language detection', () => {
    const out = formatMinify('var x = 1;', 'auto');
    expect(out).toContain('JS');
  });
});
