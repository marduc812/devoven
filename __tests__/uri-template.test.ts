import { expandUriTemplate, parseVariableLines, extractTemplateVars } from '../Components/Functions/UriTemplateTools/logic';

describe('expandUriTemplate - simple', () => {
  it('expands simple variable', () => {
    expect(expandUriTemplate('{var}', { var: 'value' })).toBe('value');
  });

  it('percent-encodes spaces', () => {
    expect(expandUriTemplate('{var}', { var: 'hello world' })).toBe('hello%20world');
  });

  it('leaves undefined variable as empty string', () => {
    expect(expandUriTemplate('/users/{id}', {})).toBe('/users/');
  });

  it('expands multiple variables', () => {
    expect(expandUriTemplate('{x},{y}', { x: 'a', y: 'b' })).toBe('a,b');
  });
});

describe('expandUriTemplate - reserved (+)', () => {
  it('allows reserved chars', () => {
    const result = expandUriTemplate('{+path}', { path: 'foo/bar' });
    expect(result).toBe('foo/bar');
  });
});

describe('expandUriTemplate - fragment (#)', () => {
  it('prepends #', () => {
    const result = expandUriTemplate('{#section}', { section: 'intro' });
    expect(result).toBe('#intro');
  });
});

describe('expandUriTemplate - path (/)', () => {
  it('prepends /', () => {
    const result = expandUriTemplate('{/id}', { id: '42' });
    expect(result).toBe('/42');
  });
});

describe('expandUriTemplate - label (.)', () => {
  it('prepends .', () => {
    const result = expandUriTemplate('{.format}', { format: 'json' });
    expect(result).toBe('.json');
  });
});

describe('expandUriTemplate - query (?)', () => {
  it('builds query string', () => {
    const result = expandUriTemplate('{?q,lang}', { q: 'hello', lang: 'en' });
    expect(result).toBe('?q=hello&lang=en');
  });

  it('omits undefined variables', () => {
    const result = expandUriTemplate('{?q,lang}', { q: 'test' });
    expect(result).toBe('?q=test');
  });
});

describe('expandUriTemplate - query continuation (&)', () => {
  it('uses & separator', () => {
    const result = expandUriTemplate('?a=1{&b,c}', { b: '2', c: '3' });
    expect(result).toBe('?a=1&b=2&c=3');
  });
});

describe('expandUriTemplate - path-style (;)', () => {
  it('uses ; with name=value', () => {
    const result = expandUriTemplate('{;v}', { v: '6' });
    expect(result).toBe(';v=6');
  });
});

describe('expandUriTemplate - lists', () => {
  it('expands list with commas for simple', () => {
    const result = expandUriTemplate('{list}', { list: ['a', 'b', 'c'] });
    expect(result).toBe('a,b,c');
  });
});

describe('expandUriTemplate - complex', () => {
  it('handles mixed template', () => {
    const result = expandUriTemplate('https://api.example.com/{version}/users{/id}{?fields}', {
      version: 'v2',
      id: '42',
      fields: 'name',
    });
    expect(result).toBe('https://api.example.com/v2/users/42?fields=name');
  });

  it('handles literal text without templates', () => {
    expect(expandUriTemplate('https://example.com/path', {})).toBe('https://example.com/path');
  });
});

describe('parseVariableLines', () => {
  it('parses key=value lines', () => {
    const vars = parseVariableLines('name=John\nage=30');
    expect(vars['name']).toBe('John');
    expect(vars['age']).toBe('30');
  });

  it('parses list values', () => {
    const vars = parseVariableLines('tags=[a,b,c]');
    expect(vars['tags']).toEqual(['a', 'b', 'c']);
  });

  it('ignores comment lines', () => {
    const vars = parseVariableLines('# comment\nfoo=bar');
    expect(vars['foo']).toBe('bar');
    expect(vars['# comment']).toBeUndefined();
  });

  it('ignores lines without =', () => {
    const vars = parseVariableLines('noequal\nfoo=bar');
    expect(vars['foo']).toBe('bar');
    expect(vars['noequal']).toBeUndefined();
  });

  it('handles empty input', () => {
    expect(parseVariableLines('')).toEqual({});
  });
});

describe('extractTemplateVars', () => {
  it('extracts variable names', () => {
    const vars = extractTemplateVars('{x}/{y}{?q}');
    expect(vars).toContain('x');
    expect(vars).toContain('y');
    expect(vars).toContain('q');
  });

  it('handles operator prefixes', () => {
    const vars = extractTemplateVars('{+path}{#section}{/id}');
    expect(vars).toContain('path');
    expect(vars).toContain('section');
    expect(vars).toContain('id');
  });

  it('deduplicates variables', () => {
    const vars = extractTemplateVars('{x}{x}{x}');
    expect(vars.filter(v => v === 'x').length).toBe(1);
  });

  it('returns empty for no templates', () => {
    expect(extractTemplateVars('https://example.com/path')).toHaveLength(0);
  });
});
