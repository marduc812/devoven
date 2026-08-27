import { lintJson, formatLintResult } from '@/Components/Functions/JsonLintTools/logic';

describe('lintJson - valid JSON', () => {
  it('returns valid for simple object', () => {
    const result = lintJson('{"key": "value"}');
    expect(result.valid).toBe(true);
  });

  it('returns valid for array', () => {
    const result = lintJson('[1, 2, 3]');
    expect(result.valid).toBe(true);
  });

  it('returns valid for nested JSON', () => {
    const input = '{"a": {"b": {"c": 1}}, "d": [1, 2, 3]}';
    const result = lintJson(input);
    expect(result.valid).toBe(true);
  });

  it('includes line count in preview', () => {
    const input = '{\n  "key": "value"\n}';
    const result = lintJson(input);
    expect(result.valid).toBe(true);
    expect(result.preview).toContain('3 lines');
  });

  it('includes char count in preview', () => {
    const input = '{"key":"val"}';
    const result = lintJson(input);
    expect(result.valid).toBe(true);
    expect(result.preview).toContain(`${input.length} characters`);
  });
});

describe('lintJson - invalid JSON', () => {
  it('returns invalid for trailing comma', () => {
    const result = lintJson('{"key": "value",}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid for missing quotes on key', () => {
    const result = lintJson('{key: "value"}');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for empty input', () => {
    const result = lintJson('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Input is empty');
  });

  it('returns invalid for whitespace-only input', () => {
    const result = lintJson('   ');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for unclosed bracket', () => {
    const result = lintJson('{"key": "value"');
    expect(result.valid).toBe(false);
  });

  it('includes error message for invalid JSON', () => {
    const result = lintJson('{invalid}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('formatLintResult', () => {
  it('formats valid result with checkmark', () => {
    const result = lintJson('{"key": "value"}');
    const formatted = formatLintResult(result);
    expect(formatted).toContain('Valid JSON');
  });

  it('formats invalid result with cross', () => {
    const result = lintJson('{invalid}');
    const formatted = formatLintResult(result);
    expect(formatted).toContain('Invalid JSON');
  });

  it('includes error details for invalid JSON', () => {
    const result = lintJson('{invalid}');
    const formatted = formatLintResult(result);
    expect(formatted).toContain('Error:');
  });

  it('formats empty input result', () => {
    const result = lintJson('');
    const formatted = formatLintResult(result);
    expect(formatted).toContain('Invalid JSON');
  });
});
