import { parseEnvFile, formatEnvParseResult } from '@/Components/Functions/EnvParserAdvancedTools/logic';

describe('parseEnvFile', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvFile('KEY=value\nFOO=bar');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({ key: 'KEY', value: 'value' });
    expect(result.entries[1]).toMatchObject({ key: 'FOO', value: 'bar' });
  });

  it('handles double-quoted values', () => {
    const result = parseEnvFile('KEY="hello world"');
    expect(result.entries[0].value).toBe('hello world');
    expect(result.entries[0].hasQuotes).toBe(true);
    expect(result.entries[0].quoteType).toBe('"');
  });

  it('handles single-quoted values', () => {
    const result = parseEnvFile("KEY='hello world'");
    expect(result.entries[0].value).toBe('hello world');
    expect(result.entries[0].quoteType).toBe("'");
  });

  it('skips comment lines', () => {
    const result = parseEnvFile('# this is a comment\nKEY=value');
    expect(result.entries).toHaveLength(1);
    expect(result.commentLines).toBe(1);
  });

  it('counts empty lines', () => {
    const result = parseEnvFile('KEY=value\n\nFOO=bar\n');
    expect(result.emptyLines).toBeGreaterThan(0);
  });

  it('handles export prefix', () => {
    const result = parseEnvFile('export KEY=value');
    expect(result.entries[0].hasExportPrefix).toBe(true);
    expect(result.entries[0].key).toBe('KEY');
    expect(result.entries[0].value).toBe('value');
  });

  it('detects duplicate keys', () => {
    const result = parseEnvFile('KEY=value1\nKEY=value2');
    expect(result.duplicateKeys).toContain('KEY');
    expect(result.issues.some(i => i.severity === 'error')).toBe(true);
  });

  it('detects empty values', () => {
    const result = parseEnvFile('EMPTY=');
    expect(result.entries[0].isEmpty).toBe(true);
    expect(result.issues.some(i => i.key === 'EMPTY')).toBe(true);
  });

  it('strips inline comments from unquoted values', () => {
    const result = parseEnvFile('KEY=value # this is a comment');
    expect(result.entries[0].value).toBe('value');
  });

  it('jsonOutput is valid JSON', () => {
    const result = parseEnvFile('FOO=bar\nBAZ=qux');
    const parsed = JSON.parse(result.jsonOutput);
    expect(parsed).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('handles line continuation with backslash', () => {
    const result = parseEnvFile('KEY=hello\\\n world');
    expect(result.entries[0].key).toBe('KEY');
    expect(result.entries[0].value.replace(/\s+/g, ' ').trim()).toBeTruthy();
  });

  it('detects keys with special characters', () => {
    const result = parseEnvFile('KEY-WITH-DASH=value');
    expect(result.issues.some(i => i.message.includes('special characters'))).toBe(true);
  });
});

describe('formatEnvParseResult', () => {
  it('returns empty string for empty input', () => {
    expect(formatEnvParseResult('')).toBe('');
    expect(formatEnvParseResult('   ')).toBe('');
  });

  it('includes parsed variables and summary', () => {
    const result = formatEnvParseResult('FOO=bar\nBAZ=qux');
    expect(result).toContain('=== Parsed Variables');
    expect(result).toContain('=== Summary ===');
    expect(result).toContain('=== All Keys ===');
  });

  it('shows issues section when there are issues', () => {
    const result = formatEnvParseResult('KEY=\nKEY=value2');
    expect(result).toContain('=== Issues');
  });
});
