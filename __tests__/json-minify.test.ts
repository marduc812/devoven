import { minifyJson, beautifyJson, getJsonStats } from '../Components/Functions/JsonMinifyTools/logic';

// ─── minifyJson ────────────────────────────────────────────────────────────────

describe('minifyJson', () => {
  it('removes whitespace from pretty-printed JSON', () => {
    const input = '{\n  "key": "value"\n}';
    expect(minifyJson(input)).toBe('{"key":"value"}');
  });

  it('handles arrays', () => {
    const input = '[\n  1,\n  2,\n  3\n]';
    expect(minifyJson(input)).toBe('[1,2,3]');
  });

  it('handles nested objects', () => {
    const input = '{"a": {"b": 1}}';
    expect(minifyJson(input)).toBe('{"a":{"b":1}}');
  });

  it('throws on invalid JSON', () => {
    expect(() => minifyJson('not json')).toThrow();
  });

  it('handles already-minified JSON', () => {
    const input = '{"x":1}';
    expect(minifyJson(input)).toBe('{"x":1}');
  });

  it('handles null value', () => {
    expect(minifyJson('null')).toBe('null');
  });

  it('handles boolean values', () => {
    expect(minifyJson('{"a":true,"b":false}')).toBe('{"a":true,"b":false}');
  });
});

// ─── beautifyJson ─────────────────────────────────────────────────────────────

describe('beautifyJson', () => {
  it('formats JSON with 2-space indent by default', () => {
    const result = beautifyJson('{"key":"value"}');
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('formats JSON with 4-space indent', () => {
    const result = beautifyJson('{"key":"value"}', 4);
    expect(result).toBe('{\n    "key": "value"\n}');
  });

  it('formats JSON with tab indent', () => {
    const result = beautifyJson('{"key":"value"}', '\t');
    expect(result).toBe('{\n\t"key": "value"\n}');
  });

  it('throws on invalid JSON', () => {
    expect(() => beautifyJson('{bad}')).toThrow();
  });

  it('handles arrays', () => {
    const result = beautifyJson('[1,2,3]', 2);
    expect(result).toBe('[\n  1,\n  2,\n  3\n]');
  });
});

// ─── getJsonStats ─────────────────────────────────────────────────────────────

describe('getJsonStats', () => {
  it('returns stats string with minified and beautified sizes', () => {
    const minified = '{"key":"value"}';
    const beautified = '{\n  "key": "value"\n}';
    const stats = getJsonStats(minified, beautified);
    expect(stats).toContain('Minified:');
    expect(stats).toContain('Beautified:');
    expect(stats).toContain('Savings:');
  });

  it('savings is positive when beautified is larger', () => {
    const minified = '{"a":1}';
    const beautified = '{\n  "a": 1\n}';
    const stats = getJsonStats(minified, beautified);
    const match = stats.match(/Savings: (\d+) bytes/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  it('handles empty strings gracefully', () => {
    const stats = getJsonStats('', '');
    expect(stats).toContain('0 bytes');
    expect(stats).toContain('(0%)');
  });

  it('percentage is correct', () => {
    // minified=10 bytes, beautified=20 bytes => savings=10 => 50%
    const min = 'x'.repeat(10);
    const beau = 'x'.repeat(20);
    const stats = getJsonStats(min, beau);
    expect(stats).toContain('50%');
  });
});
