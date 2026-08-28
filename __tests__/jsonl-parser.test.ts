import {
  jsonlToJson,
  jsonToJsonl,
  getJsonlStats,
} from '../Components/Functions/JsonlParserTools/logic';

// ─── jsonlToJson ──────────────────────────────────────────────────────────────

describe('jsonlToJson', () => {
  it('converts single JSONL line to JSON array', () => {
    const result = jsonlToJson('{"name":"Alice","age":30}');
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('Alice');
  });
  it('converts multiple JSONL lines to JSON array', () => {
    const input = '{"id":1}\n{"id":2}\n{"id":3}';
    const parsed = JSON.parse(jsonlToJson(input));
    expect(parsed).toHaveLength(3);
    expect(parsed[2].id).toBe(3);
  });
  it('skips comment lines', () => {
    const input = '// this is a comment\n{"id":1}';
    const parsed = JSON.parse(jsonlToJson(input));
    expect(parsed).toHaveLength(1);
  });
  it('skips blank lines', () => {
    const input = '{"id":1}\n\n{"id":2}';
    const parsed = JSON.parse(jsonlToJson(input));
    expect(parsed).toHaveLength(2);
  });
  it('throws on invalid JSON line', () => {
    expect(() => jsonlToJson('{"valid":true}\n{invalid}')).toThrow('Line 2');
  });
  it('formats output with 2-space indent', () => {
    const result = jsonlToJson('{"a":1}');
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });
});

// ─── jsonToJsonl ──────────────────────────────────────────────────────────────

describe('jsonToJsonl', () => {
  it('converts JSON array to JSONL', () => {
    const input = '[{"id":1},{"id":2}]';
    const result = jsonToJsonl(input);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).id).toBe(1);
    expect(JSON.parse(lines[1]).id).toBe(2);
  });
  it('each line is valid JSON', () => {
    const input = '[{"name":"Alice"},{"name":"Bob"}]';
    const result = jsonToJsonl(input);
    result.split('\n').forEach(line => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });
  it('throws for non-array input', () => {
    expect(() => jsonToJsonl('{"key":"value"}')).toThrow('Input must be a JSON array');
  });
  it('throws for invalid JSON', () => {
    expect(() => jsonToJsonl('{invalid}')).toThrow();
  });
  it('handles empty array', () => {
    const result = jsonToJsonl('[]');
    expect(result).toBe('');
  });
  it('handles nested objects', () => {
    const input = '[{"a":{"b":1}}]';
    const result = jsonToJsonl(input);
    const parsed = JSON.parse(result);
    expect(parsed.a.b).toBe(1);
  });
});

// ─── getJsonlStats ────────────────────────────────────────────────────────────

describe('getJsonlStats', () => {
  it('counts lines', () => {
    expect(getJsonlStats('{"a":1}\n{"b":2}\n{"c":3}')).toBe('3 lines');
  });
  it('ignores empty lines in count', () => {
    expect(getJsonlStats('{"a":1}\n\n{"b":2}')).toBe('2 lines');
  });
  it('returns 0 for empty input', () => {
    expect(getJsonlStats('')).toBe('0 lines');
  });
  it('returns 1 for single line', () => {
    expect(getJsonlStats('{"a":1}')).toBe('1 lines');
  });
});
