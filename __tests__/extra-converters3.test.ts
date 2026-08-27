import {
  jsonToSqlInsert,
  jsonToSqlCreateTable,
  arrayToMarkdownTable,
  markdownTableToArray,
} from '@/Components/Functions/ExtraConverters3/logic';

// ─── jsonToSqlInsert ─────────────────────────────────────────────────────────

describe('jsonToSqlInsert', () => {
  it('generates INSERT for array', () => {
    const sql = jsonToSqlInsert('[{"name":"Alice","age":30}]', 'users');
    expect(sql).toContain('INSERT INTO `users`');
    expect(sql).toContain('`name`, `age`');
    expect(sql).toContain("'Alice'");
  });

  it('handles null values', () => {
    expect(jsonToSqlInsert('[{"a":null}]', 't')).toContain('NULL');
  });

  it('handles numbers without quotes', () => {
    expect(jsonToSqlInsert('[{"n":42}]', 't')).toContain('42');
    expect(jsonToSqlInsert('[{"n":42}]', 't')).not.toContain("'42'");
  });

  it('throws on non-array', () => expect(() => jsonToSqlInsert('{"a":1}', 't')).toThrow());

  it('empty returns empty', () => expect(jsonToSqlInsert('', 't')).toBe(''));
});

// ─── jsonToSqlCreateTable ────────────────────────────────────────────────────

describe('jsonToSqlCreateTable', () => {
  it('generates CREATE TABLE with correct types', () => {
    const sql = jsonToSqlCreateTable('[{"name":"Alice","age":30,"active":true}]', 'users');
    expect(sql).toContain('CREATE TABLE `users`');
    expect(sql).toContain('`name` TEXT');
    expect(sql).toContain('`age` INT');
    expect(sql).toContain('`active` TINYINT(1)');
  });

  it('handles object input directly', () => {
    const sql = jsonToSqlCreateTable('{"x":1.5}', 'nums');
    expect(sql).toContain('DECIMAL(10,2)');
  });

  it('includes auto-increment primary key', () => {
    const sql = jsonToSqlCreateTable('[{"a":"b"}]', 't');
    expect(sql).toContain('AUTO_INCREMENT PRIMARY KEY');
  });

  it('throws on invalid input', () => {
    expect(() => jsonToSqlCreateTable('"string"', 't')).toThrow();
  });

  it('empty returns empty', () => expect(jsonToSqlCreateTable('', 't')).toBe(''));
});

// ─── arrayToMarkdownTable ────────────────────────────────────────────────────

describe('arrayToMarkdownTable', () => {
  it('generates a valid markdown table', () => {
    const md = arrayToMarkdownTable(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']]);
    expect(md).toContain('| Name');
    expect(md).toContain('| ---');
    expect(md).toContain('Alice');
  });

  it('pads columns to minimum width of 3', () => {
    const md = arrayToMarkdownTable(['A'], [['B']]);
    expect(md).toContain('---');
  });

  it('handles empty rows', () => {
    const md = arrayToMarkdownTable(['Col'], []);
    expect(md).toContain('| Col');
  });

  it('returns empty string for no headers', () => {
    expect(arrayToMarkdownTable([], [])).toBe('');
  });

  it('handles cells with pipes gracefully', () => {
    const md = arrayToMarkdownTable(['H1', 'H2'], [['a', 'b']]);
    expect(md.split('\n').length).toBe(3);
  });
});

// ─── markdownTableToArray ────────────────────────────────────────────────────

describe('markdownTableToArray', () => {
  it('parses a simple markdown table', () => {
    const input = '| Name | Age |\n|------|-----|\n| Alice | 30 |';
    const result = markdownTableToArray(input);
    expect(result.headers).toEqual(['Name', 'Age']);
    expect(result.rows[0]).toEqual(['Alice', '30']);
  });

  it('strips whitespace from cells', () => {
    const input = '|  A  |  B  |\n|-----|-----|\n|  x  |  y  |';
    const result = markdownTableToArray(input);
    expect(result.headers[0]).toBe('A');
    expect(result.rows[0][1]).toBe('y');
  });

  it('returns empty rows array when no data rows', () => {
    const input = '| H |\n|---|\n';
    const result = markdownTableToArray(input);
    expect(result.headers).toEqual(['H']);
  });

  it('throws on missing separator row', () => {
    expect(() => markdownTableToArray('| H |')).toThrow();
  });

  it('handles multiple rows', () => {
    const input = '| X |\n|---|\n| 1 |\n| 2 |\n| 3 |';
    const result = markdownTableToArray(input);
    expect(result.rows.length).toBe(3);
  });
});
