import { parseAndValidate, formatValidationResult } from '@/Components/Functions/EnvValidatorTools/logic';

describe('parseAndValidate - basic parsing', () => {
  it('parses simple key=value', () => {
    const result = parseAndValidate('PORT=3000\nNODE_ENV=production');
    expect(result.variables.length).toBe(2);
    expect(result.variables[0].key).toBe('PORT');
    expect(result.variables[0].value).toBe('3000');
  });

  it('strips quoted values', () => {
    const result = parseAndValidate('NAME="Alice"');
    expect(result.variables[0].value).toBe('Alice');
    expect(result.variables[0].hasQuotes).toBe(true);
  });

  it('strips single-quoted values', () => {
    const result = parseAndValidate("NAME='Bob'");
    expect(result.variables[0].value).toBe('Bob');
    expect(result.variables[0].quoteChar).toBe("'");
  });

  it('ignores comment lines', () => {
    const result = parseAndValidate('# comment\nFOO=bar');
    expect(result.variables.length).toBe(1);
  });

  it('ignores empty lines', () => {
    const result = parseAndValidate('\n\nFOO=bar\n\n');
    expect(result.variables.length).toBe(1);
  });

  it('strips inline comments', () => {
    const result = parseAndValidate('PORT=3000 # port number');
    expect(result.variables[0].value).toBe('3000');
  });
});

describe('parseAndValidate - issues', () => {
  it('detects missing equals sign', () => {
    const result = parseAndValidate('BADLINE');
    expect(result.issues.some(i => i.severity === 'error')).toBe(true);
  });

  it('detects spaces in value without quotes', () => {
    const result = parseAndValidate('MY_VAR=hello world');
    expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('spaces'))).toBe(true);
  });

  it('detects duplicate keys', () => {
    const result = parseAndValidate('FOO=1\nFOO=2');
    expect(result.stats.duplicates).toBe(1);
    expect(result.issues.some(i => i.category === 'duplicate')).toBe(true);
  });

  it('detects empty value as info', () => {
    const result = parseAndValidate('SECRET=');
    expect(result.issues.some(i => i.severity === 'info' && i.message.includes('empty'))).toBe(true);
  });

  it('detects invalid PORT value', () => {
    const result = parseAndValidate('PORT=99999');
    expect(result.issues.some(i => i.message.includes('port'))).toBe(true);
  });

  it('detects unusual NODE_ENV', () => {
    const result = parseAndValidate('NODE_ENV=staging2');
    expect(result.issues.some(i => i.key === 'NODE_ENV')).toBe(true);
  });
});

describe('parseAndValidate - security', () => {
  it('flags short API_KEY as warning', () => {
    const result = parseAndValidate('API_KEY=abc');
    expect(result.issues.some(i => i.severity === 'warning' && i.key === 'API_KEY')).toBe(true);
  });

  it('flags placeholder secret', () => {
    const result = parseAndValidate('SECRET_KEY=changeme');
    expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('placeholder'))).toBe(true);
  });

  it('counts sensitive keys', () => {
    const result = parseAndValidate('API_KEY=longvalidkey123\nNODE_ENV=production');
    expect(result.stats.sensitiveKeys).toBeGreaterThanOrEqual(1);
  });
});

describe('parseAndValidate - stats', () => {
  it('correctly counts variables', () => {
    const result = parseAndValidate('A=1\nB=2\nC=3');
    expect(result.stats.total).toBe(3);
  });

  it('returns empty result for empty input', () => {
    const result = parseAndValidate('');
    expect(result.variables.length).toBe(0);
    expect(result.issues.length).toBe(0);
  });
});

describe('formatValidationResult', () => {
  it('includes header', () => {
    const result = parseAndValidate('FOO=bar');
    const output = formatValidationResult(result);
    expect(output).toContain('ENV VALIDATION RESULT');
  });

  it('includes variable table', () => {
    const result = parseAndValidate('FOO=bar\nBAZ=123');
    const output = formatValidationResult(result);
    expect(output).toContain('Parsed Variables');
    expect(output).toContain('FOO');
  });

  it('masks sensitive values', () => {
    const result = parseAndValidate('API_KEY=supersecretkey');
    const output = formatValidationResult(result);
    expect(output).not.toContain('supersecretkey');
    expect(output).toContain('[sensitive]');
  });

  it('returns empty string for empty result', () => {
    const result = parseAndValidate('');
    expect(formatValidationResult(result)).toBe('');
  });
});
