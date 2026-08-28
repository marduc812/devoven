import { inferSchema, generateCreateTable, generateSqlSchema } from '../Components/Functions/SqlSchemaGenTools/logic';

describe('inferSchema', () => {
  it('infers basic types from a JSON object', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice', active: true, score: 9.5 });
    const schema = inferSchema(input, 'users', 'postgresql');
    expect(schema.tableName).toBe('users');
    const idCol = schema.columns.find(c => c.name === 'id');
    expect(idCol?.isPrimaryKey).toBe(true);
    const nameCol = schema.columns.find(c => c.name === 'name');
    expect(nameCol?.sqlType).toMatch(/VARCHAR/i);
    const activeCol = schema.columns.find(c => c.name === 'active');
    expect(activeCol?.sqlType).toBe('BOOLEAN');
    const scoreCol = schema.columns.find(c => c.name === 'score');
    expect(scoreCol?.sqlType).toBe('FLOAT');
  });

  it('infers types from a JSON array', () => {
    const input = JSON.stringify([{ id: 1, name: 'Alice' }]);
    const schema = inferSchema(input, 'test', 'postgresql');
    expect(schema.columns.length).toBe(2);
  });

  it('marks null columns as nullable', () => {
    const input = JSON.stringify({ id: 1, bio: null });
    const schema = inferSchema(input, 't', 'postgresql');
    const bioCol = schema.columns.find(c => c.name === 'bio');
    expect(bioCol?.nullable).toBe(true);
  });

  it('infers TIMESTAMP for ISO date strings', () => {
    const input = JSON.stringify({ id: 1, created_at: '2024-01-15T10:30:00Z' });
    const schema = inferSchema(input, 't', 'postgresql');
    const tsCol = schema.columns.find(c => c.name === 'created_at');
    expect(tsCol?.sqlType).toBe('TIMESTAMP');
  });

  it('infers TEXT for sqlite boolean', () => {
    const input = JSON.stringify({ id: 1, active: true });
    const schema = inferSchema(input, 't', 'sqlite');
    const col = schema.columns.find(c => c.name === 'active');
    expect(col?.sqlType).toBe('INTEGER');
  });

  it('throws on invalid JSON', () => {
    expect(() => inferSchema('not json', 't', 'postgresql')).toThrow();
  });

  it('throws on empty array', () => {
    expect(() => inferSchema('[]', 't', 'postgresql')).toThrow();
  });
});

describe('generateCreateTable', () => {
  it('generates valid PostgreSQL CREATE TABLE', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice', age: 30 });
    const schema = inferSchema(input, 'users', 'postgresql');
    const sql = generateCreateTable(schema, 'postgresql');
    expect(sql).toContain('CREATE TABLE');
    expect(sql).toContain('"users"');
    expect(sql).toContain('PRIMARY KEY');
    expect(sql).toContain('SERIAL');
  });

  it('generates MySQL backtick-quoted names', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice' });
    const schema = inferSchema(input, 'users', 'mysql');
    const sql = generateCreateTable(schema, 'mysql');
    expect(sql).toContain('`users`');
    expect(sql).toContain('AUTO_INCREMENT');
  });

  it('generates SQLite INTEGER PRIMARY KEY', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice' });
    const schema = inferSchema(input, 't', 'sqlite');
    const sql = generateCreateTable(schema, 'sqlite');
    expect(sql).toContain('INTEGER');
    expect(sql).toContain('PRIMARY KEY');
  });
});

describe('generateSqlSchema', () => {
  it('returns empty string for empty input', () => {
    expect(generateSqlSchema('', 'users', 'postgresql')).toBe('');
  });

  it('returns error comment for invalid JSON', () => {
    const result = generateSqlSchema('bad json', 'users', 'postgresql');
    expect(result).toContain('-- Error');
  });

  it('generates a full schema from JSON object', () => {
    const input = JSON.stringify({ id: 1, email: 'a@b.com', active: true });
    const result = generateSqlSchema(input, 'members', 'postgresql');
    expect(result).toContain('CREATE TABLE');
    expect(result).toContain('"members"');
  });
});
