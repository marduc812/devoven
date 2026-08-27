import { formatTomlValidation, getTomlStats } from '../Components/Functions/TomlValidatorTools/logic';

// ─── formatTomlValidation ─────────────────────────────────────────────────────

describe('formatTomlValidation', () => {
  it('formats a simple object as pretty JSON', () => {
    const result = formatTomlValidation({ name: 'test', version: 1 });
    expect(result).toBe('{\n  "name": "test",\n  "version": 1\n}');
  });

  it('handles nested objects', () => {
    const result = formatTomlValidation({ a: { b: 'c' } });
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
    expect(result).toContain('"c"');
  });

  it('handles arrays', () => {
    const result = formatTomlValidation([1, 2, 3]);
    expect(result).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('handles null', () => {
    expect(formatTomlValidation(null)).toBe('null');
  });

  it('handles strings', () => {
    expect(formatTomlValidation('hello')).toBe('"hello"');
  });
});

// ─── getTomlStats ─────────────────────────────────────────────────────────────

describe('getTomlStats', () => {
  it('counts lines', () => {
    const toml = 'title = "Hello"\nname = "World"';
    const result = getTomlStats(toml);
    expect(result).toContain('Lines: 2');
  });

  it('counts keys', () => {
    const toml = 'title = "Hello"\nname = "World"';
    const result = getTomlStats(toml);
    expect(result).toContain('Keys: 2');
  });

  it('counts tables', () => {
    const toml = '[database]\nhost = "localhost"\n[server]\nport = 8080';
    const result = getTomlStats(toml);
    expect(result).toContain('Tables: 2');
  });

  it('returns zeros for empty input', () => {
    const result = getTomlStats('');
    expect(result).toContain('Keys: 0');
    expect(result).toContain('Tables: 0');
  });

  it('handles TOML with no tables', () => {
    const toml = 'key = "value"';
    const result = getTomlStats(toml);
    expect(result).toContain('Tables: 0');
    expect(result).toContain('Keys: 1');
  });

  it('includes all three stats in the output', () => {
    const result = getTomlStats('a = 1');
    expect(result).toContain('Lines:');
    expect(result).toContain('Keys:');
    expect(result).toContain('Tables:');
  });
});
