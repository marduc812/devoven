import { tomlToJson } from '../Components/Functions/TomlToJsonTools/logic';

describe('tomlToJson', () => {
  it('converts a simple key-value TOML to JSON', () => {
    const toml = 'host = "localhost"\nport = 5432';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
  });

  it('converts a TOML table section to nested JSON', () => {
    const toml = '[database]\nhost = "localhost"\nport = 5432';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.database.host).toBe('localhost');
    expect(result.database.port).toBe(5432);
  });

  it('handles boolean values', () => {
    const toml = 'enabled = true\ndisabled = false';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
  });

  it('handles float values', () => {
    const toml = 'pi = 3.14';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.pi).toBeCloseTo(3.14);
  });

  it('handles TOML arrays', () => {
    const toml = 'fruits = ["apple", "banana", "cherry"]';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.fruits).toEqual(['apple', 'banana', 'cherry']);
  });

  it('handles inline tables', () => {
    const toml = 'point = {x = 1, y = 2}';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.point.x).toBe(1);
    expect(result.point.y).toBe(2);
  });

  it('returns empty string for empty input', () => {
    expect(tomlToJson('')).toBe('');
    expect(tomlToJson('   ')).toBe('');
  });

  it('produces pretty-printed JSON', () => {
    const toml = 'key = "value"';
    const result = tomlToJson(toml);
    expect(result).toContain('\n');
  });

  it('handles comments', () => {
    const toml = '# This is a comment\nname = "Alice" # inline comment';
    const result = JSON.parse(tomlToJson(toml));
    expect(result.name).toBe('Alice');
  });
});
