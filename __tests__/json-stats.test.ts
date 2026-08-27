import {
  analyzeJson,
  formatJsonStats,
} from '@/Components/Functions/JsonStatsTools/logic';

describe('analyzeJson', () => {
  it('counts objects correctly', () => {
    const stats = analyzeJson('{"a": 1, "b": 2}');
    expect(stats.objects).toBe(1);
  });

  it('counts keys correctly', () => {
    const stats = analyzeJson('{"a": 1, "b": 2, "c": 3}');
    expect(stats.totalKeys).toBe(3);
  });

  it('counts arrays correctly', () => {
    const stats = analyzeJson('{"arr": [1, 2, 3]}');
    expect(stats.arrays).toBe(1);
  });

  it('counts strings correctly', () => {
    const stats = analyzeJson('{"a": "hello", "b": "world"}');
    expect(stats.strings).toBe(2);
  });

  it('counts numbers correctly', () => {
    const stats = analyzeJson('{"a": 1, "b": 2.5, "c": -3}');
    expect(stats.numbers).toBe(3);
  });

  it('counts booleans correctly', () => {
    const stats = analyzeJson('{"a": true, "b": false}');
    expect(stats.booleans).toBe(2);
  });

  it('counts nulls correctly', () => {
    const stats = analyzeJson('{"a": null, "b": null}');
    expect(stats.nulls).toBe(2);
  });

  it('calculates max depth for nested objects', () => {
    const stats = analyzeJson('{"a": {"b": {"c": 1}}}');
    expect(stats.maxDepth).toBeGreaterThanOrEqual(3);
  });

  it('finds longest key', () => {
    const stats = analyzeJson('{"shortKey": 1, "veryLongKeyName": 2}');
    expect(stats.longestKey).toBe('veryLongKeyName');
  });

  it('finds longest string', () => {
    const stats = analyzeJson('{"a": "hi", "b": "longer string here"}');
    expect(stats.longestString).toBe('longer string here');
  });

  it('handles empty array', () => {
    const stats = analyzeJson('[]');
    expect(stats.arrays).toBe(1);
    expect(stats.totalKeys).toBe(0);
  });

  it('throws for invalid JSON', () => {
    expect(() => analyzeJson('not json')).toThrow();
  });
});

describe('formatJsonStats', () => {
  it('includes objects count', () => {
    const stats = analyzeJson('{"a": 1}');
    const result = formatJsonStats(stats);
    expect(result).toContain('Objects:');
  });

  it('includes arrays count', () => {
    const stats = analyzeJson('[1, 2]');
    const result = formatJsonStats(stats);
    expect(result).toContain('Arrays:');
  });

  it('includes max depth', () => {
    const stats = analyzeJson('{"a": {"b": 1}}');
    const result = formatJsonStats(stats);
    expect(result).toContain('Max depth:');
  });

  it('truncates very long strings', () => {
    const longStr = 'x'.repeat(100);
    const stats = analyzeJson(`{"a": "${longStr}"}`);
    const result = formatJsonStats(stats);
    expect(result).toContain('...');
  });
});
