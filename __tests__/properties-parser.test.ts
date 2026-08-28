import { propertiesToJson, jsonToProperties } from '@/Components/Functions/PropertiesParserTools/logic';

describe('propertiesToJson - happy path', () => {
  it('parses simple key=value pairs', () => {
    const input = 'name=John\nage=30\ncity=New York';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.name).toBe('John');
    expect(result.age).toBe('30');
    expect(result.city).toBe('New York');
  });

  it('ignores comment lines starting with #', () => {
    const input = '# This is a comment\nkey=value';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.key).toBe('value');
    expect(Object.keys(result)).not.toContain('# This is a comment');
  });

  it('ignores comment lines starting with !', () => {
    const input = '! This is also a comment\nkey=value';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.key).toBe('value');
  });

  it('supports colon separator', () => {
    const input = 'name: John\nage: 30';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.name).toBe('John');
    expect(result.age).toBe('30');
  });

  it('handles escaped special chars', () => {
    const input = 'greeting=Hello\\nWorld';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.greeting).toBe('Hello\nWorld');
  });

  it('handles escaped tab', () => {
    const input = 'path=foo\\tbar';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.path).toBe('foo\tbar');
  });
});

describe('propertiesToJson - edge cases', () => {
  it('handles empty input', () => {
    const result = JSON.parse(propertiesToJson(''));
    expect(result).toEqual({});
  });

  it('skips blank lines', () => {
    const input = 'key1=val1\n\nkey2=val2\n';
    const result = JSON.parse(propertiesToJson(input));
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('handles continuation lines with backslash', () => {
    const input = 'key=line1\\\nline2';
    const result = JSON.parse(propertiesToJson(input));
    expect(result.key).toBe('line1line2');
  });
});

describe('jsonToProperties - happy path', () => {
  it('converts JSON object to properties format', () => {
    const input = JSON.stringify({ name: 'John', age: '30' });
    const result = jsonToProperties(input);
    expect(result).toContain('name=John');
    expect(result).toContain('age=30');
  });

  it('escapes newlines in values', () => {
    const input = JSON.stringify({ greeting: 'Hello\nWorld' });
    const result = jsonToProperties(input);
    expect(result).toContain('\\n');
  });

  it('escapes tabs in values', () => {
    const input = JSON.stringify({ path: 'foo\tbar' });
    const result = jsonToProperties(input);
    expect(result).toContain('\\t');
  });

  it('escapes hash signs', () => {
    const input = JSON.stringify({ color: '#ff0000' });
    const result = jsonToProperties(input);
    expect(result).toContain('\\#');
  });
});

describe('jsonToProperties - edge cases', () => {
  it('handles empty object', () => {
    expect(jsonToProperties('{}')).toBe('');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToProperties('not json')).toThrow();
  });

  it('round-trips data correctly', () => {
    const original = { key1: 'value1', key2: 'value2' };
    const props = jsonToProperties(JSON.stringify(original));
    const back = JSON.parse(propertiesToJson(props));
    expect(back).toEqual(original);
  });
});
