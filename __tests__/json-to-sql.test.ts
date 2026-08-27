import { generateInserts } from '../Components/Functions/JsonToSqlTools/logic';

const defaultOpts = { tableName: 'users', dialect: 'postgresql' as const, batchSize: 1 };

describe('generateInserts', () => {
  it('returns empty string for empty input', () => {
    expect(generateInserts('', defaultOpts)).toBe('');
  });

  it('returns error for invalid JSON', () => {
    expect(generateInserts('not json', defaultOpts)).toContain('-- Error');
  });

  it('generates INSERT for a single object', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice' });
    const result = generateInserts(input, defaultOpts);
    expect(result).toContain('INSERT INTO');
    expect(result).toContain('"users"');
    expect(result).toContain('"id"');
    expect(result).toContain("'Alice'");
  });

  it('handles NULL values', () => {
    const input = JSON.stringify([{ id: 1, bio: null }]);
    const result = generateInserts(input, defaultOpts);
    expect(result).toContain('NULL');
  });

  it('escapes single quotes in strings', () => {
    const input = JSON.stringify([{ id: 1, name: "O'Brien" }]);
    const result = generateInserts(input, defaultOpts);
    expect(result).toContain("O''Brien");
  });

  it('uses MySQL backticks', () => {
    const input = JSON.stringify([{ id: 1, name: 'Alice' }]);
    const result = generateInserts(input, { ...defaultOpts, dialect: 'mysql' });
    expect(result).toContain('`users`');
    expect(result).toContain('`id`');
  });

  it('handles boolean values for SQLite (0/1)', () => {
    const input = JSON.stringify([{ id: 1, active: true, disabled: false }]);
    const result = generateInserts(input, { ...defaultOpts, dialect: 'sqlite' });
    expect(result).toContain('1');
    expect(result).toContain('0');
  });

  it('handles boolean values for PostgreSQL (TRUE/FALSE)', () => {
    const input = JSON.stringify([{ id: 1, active: true }]);
    const result = generateInserts(input, defaultOpts);
    expect(result).toContain('TRUE');
  });

  it('generates batch inserts when batchSize > 1', () => {
    const input = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = generateInserts(input, { ...defaultOpts, batchSize: 3 });
    // Only one INSERT INTO statement with multiple value rows
    const insertCount = (result.match(/INSERT INTO/g) || []).length;
    expect(insertCount).toBe(1);
  });

  it('generates separate inserts when batchSize is 1', () => {
    const input = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = generateInserts(input, defaultOpts);
    const insertCount = (result.match(/INSERT INTO/g) || []).length;
    expect(insertCount).toBe(3);
  });

  it('handles missing keys across rows (fills NULL)', () => {
    const input = JSON.stringify([{ id: 1, name: 'Alice' }, { id: 2, email: 'b@b.com' }]);
    const result = generateInserts(input, defaultOpts);
    expect(result).toContain('NULL');
  });
});
