import { yamlToJson } from '../Components/Functions/DataFormatConverters/logic';

describe('yamlToJson', () => {
  it('converts a simple YAML mapping to JSON', () => {
    const yaml = 'name: Alice\nage: 30';
    const result = JSON.parse(yamlToJson(yaml));
    expect(result.name).toBe('Alice');
    expect(result.age).toBe(30);
  });

  it('converts a YAML sequence to JSON array', () => {
    const yaml = '- apple\n- banana\n- cherry';
    const result = JSON.parse(yamlToJson(yaml));
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });

  it('handles nested YAML mappings', () => {
    const yaml = 'person:\n  name: Bob\n  age: 25';
    const result = JSON.parse(yamlToJson(yaml));
    expect(result.person.name).toBe('Bob');
    expect(result.person.age).toBe(25);
  });

  it('handles boolean values', () => {
    const yaml = 'enabled: true\ndisabled: false';
    const result = JSON.parse(yamlToJson(yaml));
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
  });

  it('returns empty string for empty input', () => {
    expect(yamlToJson('')).toBe('');
    expect(yamlToJson('   ')).toBe('');
  });

  it('throws for invalid YAML', () => {
    expect(() => yamlToJson('{')).toThrow();
  });

  it('produces pretty-printed JSON', () => {
    const yaml = 'key: value';
    const result = yamlToJson(yaml);
    expect(result).toContain('\n');
  });
});
