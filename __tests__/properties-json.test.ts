import { propertiesToJson, jsonToProperties, detectPropertiesOrJson } from '../Components/Functions/PropertiesJsonTools/logic';

describe('propertiesToJson', () => {
  it('converts simple key=value', () => {
    const result = JSON.parse(propertiesToJson('name=Alice\nage=30'));
    expect(result.name).toBe('Alice');
    expect(result.age).toBe('30');
  });

  it('converts key: value format', () => {
    const result = JSON.parse(propertiesToJson('name: Bob'));
    expect(result.name).toBe('Bob');
  });

  it('ignores # comments', () => {
    const result = JSON.parse(propertiesToJson('# comment\nname=Alice'));
    expect(result['# comment']).toBeUndefined();
    expect(result.name).toBe('Alice');
  });

  it('ignores ! comments', () => {
    const result = JSON.parse(propertiesToJson('! comment\nkey=val'));
    expect(result.key).toBe('val');
  });

  it('handles multiline with backslash continuation', () => {
    const result = JSON.parse(propertiesToJson('key=line1\\\nline2'));
    expect(result.key).toBe('line1line2');
  });

  it('handles unicode escapes', () => {
    const result = JSON.parse(propertiesToJson('greeting=Hello \\u0057orld'));
    expect(result.greeting).toBe('Hello World');
  });

  it('ignores blank lines', () => {
    const result = JSON.parse(propertiesToJson('\nname=Alice\n\n'));
    expect(result.name).toBe('Alice');
  });
});

describe('jsonToProperties', () => {
  it('converts JSON object to properties', () => {
    const result = jsonToProperties('{"name":"Alice","age":30}');
    expect(result).toContain('name=Alice');
    expect(result).toContain('age=30');
  });

  it('returns error for invalid JSON', () => {
    expect(jsonToProperties('not json')).toContain('Error');
  });

  it('returns error for JSON array', () => {
    expect(jsonToProperties('["a","b"]')).toContain('Error');
  });

  it('escapes backslashes in values', () => {
    const result = jsonToProperties('{"path":"C:\\\\Users"}');
    expect(result).toContain('path=C:\\\\Users');
  });
});

describe('detectPropertiesOrJson', () => {
  it('detects JSON object', () => {
    expect(detectPropertiesOrJson('{"a":1}')).toBe('json');
  });

  it('detects JSON array', () => {
    expect(detectPropertiesOrJson('[1,2,3]')).toBe('json');
  });

  it('detects properties', () => {
    expect(detectPropertiesOrJson('name=Alice')).toBe('properties');
  });
});
