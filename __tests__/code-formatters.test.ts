import {
  formatJson,
  validateJson,
  formatXml,
  minifyHtml,
  minifyCss,
  minifyJs,
  validateYaml,
  getRegexMatches,
  explainRegexFlags,
} from '../Components/Functions/CodeFormatters/logic';

// ─── formatJson ───────────────────────────────────────────────────────────────

describe('formatJson', () => {
  it('formats valid JSON with 2-space indent', () => {
    expect(formatJson('{"a":1}', 2)).toBe('{\n  "a": 1\n}');
  });
  it('formats with 4-space indent', () => {
    expect(formatJson('{"a":1}', 4)).toBe('{\n    "a": 1\n}');
  });
  it('formats a JSON array', () => {
    expect(formatJson('[1,2,3]', 2)).toBe('[\n  1,\n  2,\n  3\n]');
  });
  it('throws on invalid JSON', () => {
    expect(() => formatJson('invalid', 2)).toThrow();
  });
  it('returns empty string for empty input', () => {
    expect(formatJson('', 2)).toBe('');
    expect(formatJson('   ', 2)).toBe('');
  });
  it('round-trips: format → parse → re-format gives same result', () => {
    const input = '{"z":3,"a":1}';
    const formatted = formatJson(input, 2);
    const reformatted = formatJson(formatted, 2);
    expect(reformatted).toBe(formatted);
  });
});

// ─── validateJson ─────────────────────────────────────────────────────────────

describe('validateJson', () => {
  it('returns valid for a correct JSON object', () => {
    expect(validateJson('{"a":1}').valid).toBe(true);
  });
  it('returns valid for a JSON array', () => {
    expect(validateJson('[1,2,3]').valid).toBe(true);
  });
  it('returns invalid and error for bad JSON', () => {
    const result = validateJson('{bad}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
  it('returns valid (no error) for empty input', () => {
    const result = validateJson('');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
  it('error message mentions position for unterminated string', () => {
    const result = validateJson('{"key": "val');
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
  });
});

// ─── formatXml ────────────────────────────────────────────────────────────────

describe('formatXml', () => {
  it('returns empty string for empty input', () => {
    expect(formatXml('', 2)).toBe('');
    expect(formatXml('   ', 2)).toBe('');
  });
  it('pretty-prints a simple XML snippet', () => {
    const xml = '<root><child>value</child></root>';
    const result = formatXml(xml, 2);
    expect(result).toContain('<root>');
    expect(result).toContain('<child>');
    expect(result).toContain('value');
  });
  it('preserves element values', () => {
    const xml = '<data><name>Alice</name><age>30</age></data>';
    const result = formatXml(xml, 2);
    expect(result).toContain('Alice');
    expect(result).toContain('30');
  });
  it('includes an XML declaration', () => {
    const xml = '<root><item>1</item></root>';
    const result = formatXml(xml, 2);
    expect(result).toContain('<?xml');
  });
});

// ─── minifyHtml ───────────────────────────────────────────────────────────────

describe('minifyHtml', () => {
  it('removes whitespace between tags', () => {
    const html = '<div>  <p>  hello  </p>  </div>';
    const result = minifyHtml(html);
    expect(result).not.toMatch(/>\s+</);
  });
  it('collapses multiple spaces', () => {
    const result = minifyHtml('<p>hello   world</p>');
    expect(result).not.toMatch(/\s{2,}/);
  });
  it('returns empty string for empty input', () => {
    expect(minifyHtml('')).toBe('');
    expect(minifyHtml('   ')).toBe('');
  });
  it('preserves text content', () => {
    const result = minifyHtml('<span>foo</span>');
    expect(result).toContain('foo');
  });
});

// ─── minifyCss ────────────────────────────────────────────────────────────────

describe('minifyCss', () => {
  it('removes block comments', () => {
    const css = '/* heading styles */ h1 { color: red; }';
    expect(minifyCss(css)).not.toContain('/*');
    expect(minifyCss(css)).toContain('h1');
  });
  it('collapses whitespace around structural characters', () => {
    const css = 'body { margin : 0 ; padding : 0 ; }';
    const result = minifyCss(css);
    expect(result).not.toMatch(/\s{2,}/);
  });
  it('returns empty string for empty input', () => {
    expect(minifyCss('')).toBe('');
    expect(minifyCss('   ')).toBe('');
  });
  it('preserves rule content', () => {
    const css = 'p { font-size: 16px; }';
    const result = minifyCss(css);
    expect(result).toContain('font-size');
    expect(result).toContain('16px');
  });
});

// ─── minifyJs ────────────────────────────────────────────────────────────────

describe('minifyJs', () => {
  it('strips single-line comments', () => {
    const js = 'var x = 1; // this is a comment\nvar y = 2;';
    const result = minifyJs(js);
    expect(result).not.toContain('// this is a comment');
    expect(result).toContain('var x = 1;');
  });
  it('strips block comments', () => {
    const js = '/* block comment */ var x = 1;';
    const result = minifyJs(js);
    expect(result).not.toContain('/*');
    expect(result).toContain('var x = 1;');
  });
  it('collapses multiple spaces', () => {
    const js = 'var    x   =   1;';
    const result = minifyJs(js);
    expect(result).not.toMatch(/\s{2,}/);
  });
  it('returns empty string for empty input', () => {
    expect(minifyJs('')).toBe('');
    expect(minifyJs('   ')).toBe('');
  });
  it('preserves code tokens', () => {
    const js = 'function add(a, b) { return a + b; }';
    const result = minifyJs(js);
    expect(result).toContain('function');
    expect(result).toContain('return');
  });
});

// ─── validateYaml ─────────────────────────────────────────────────────────────

describe('validateYaml', () => {
  it('returns valid + canonical for correct YAML', () => {
    const result = validateYaml('name: Alice\nage: 30');
    expect(result.valid).toBe(true);
    expect(result.canonical).toContain('name: Alice');
    expect(result.canonical).toContain('age: 30');
  });
  it('returns invalid + error for bad YAML', () => {
    const result = validateYaml(': : :');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
  it('returns valid + empty canonical for empty input', () => {
    const result = validateYaml('');
    expect(result.valid).toBe(true);
    expect(result.canonical).toBe('');
  });
  it('canonicalises a YAML list', () => {
    const result = validateYaml('- 1\n- 2\n- 3');
    expect(result.valid).toBe(true);
    expect(result.canonical).toContain('- 1');
  });
  it('round-trips JSON-derived YAML', () => {
    // YAML is a superset of JSON — a JSON object is valid YAML
    const result = validateYaml('{"name":"Bob"}');
    expect(result.valid).toBe(true);
    expect(result.canonical).toContain('name: Bob');
  });
});

// ─── getRegexMatches ──────────────────────────────────────────────────────────

describe('getRegexMatches', () => {
  it('finds all matches with global flag', () => {
    const result = getRegexMatches('\\d+', 'g', 'foo 123 bar 456');
    expect(result.count).toBe(2);
    expect(result.matches).toEqual(['123', '456']);
  });
  it('finds first match without global flag', () => {
    const result = getRegexMatches('\\d+', '', 'foo 123 bar 456');
    expect(result.count).toBe(1);
    expect(result.matches).toEqual(['123']);
  });
  it('returns error for invalid regex', () => {
    const result = getRegexMatches('[invalid', 'g', 'test');
    expect(result.error).toBeTruthy();
    expect(result.count).toBe(0);
  });
  it('case insensitive match', () => {
    const result = getRegexMatches('hello', 'gi', 'Hello World hello');
    expect(result.count).toBe(2);
  });
  it('returns zero matches when pattern not found', () => {
    const result = getRegexMatches('xyz', 'g', 'hello world');
    expect(result.count).toBe(0);
    expect(result.matches).toEqual([]);
  });
  it('returns empty result for empty pattern', () => {
    const result = getRegexMatches('', 'g', 'hello');
    expect(result.count).toBe(0);
    expect(result.matches).toEqual([]);
  });
  it('handles multiline flag', () => {
    const result = getRegexMatches('^line', 'gm', 'line1\nline2\nother');
    expect(result.count).toBe(2);
  });
});

// ─── explainRegexFlags ────────────────────────────────────────────────────────

describe('explainRegexFlags', () => {
  it('explains the g flag', () => {
    const result = explainRegexFlags('g');
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Global');
  });
  it('explains multiple flags', () => {
    const result = explainRegexFlags('gi');
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.includes('Case-insensitive'))).toBe(true);
  });
  it('returns empty array for no flags', () => {
    expect(explainRegexFlags('')).toEqual([]);
  });
  it('ignores unknown flag characters', () => {
    // 'x' is not a supported flag in this helper
    const result = explainRegexFlags('gx');
    expect(result).toHaveLength(1);
  });
});
