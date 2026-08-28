import {
  analyzeSql,
  auditSql,
  tokenizeSql,
} from '@/Components/Functions/SqlBuilderTools/logic';

describe('analyzeSql - SELECT', () => {
  it('detects SELECT statement type', () => {
    const result = analyzeSql('SELECT id, name FROM users');
    expect(result.statementType).toBe('SELECT');
  });

  it('extracts tables from FROM clause', () => {
    const result = analyzeSql('SELECT * FROM orders');
    expect(result.tables).toContain('ORDERS');
  });

  it('extracts columns', () => {
    const result = analyzeSql('SELECT id, name, email FROM users');
    expect(result.columns.length).toBeGreaterThan(0);
  });

  it('detects SELECT * warning', () => {
    const result = analyzeSql('SELECT * FROM users');
    expect(result.warnings.some(w => w.includes('SELECT *'))).toBe(true);
  });

  it('extracts JOIN tables', () => {
    const result = analyzeSql('SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id');
    expect(result.joins.length).toBeGreaterThan(0);
  });

  it('extracts WHERE conditions', () => {
    const result = analyzeSql('SELECT id FROM users WHERE active = 1 AND role = "admin"');
    expect(result.conditions.length).toBeGreaterThan(0);
  });

  it('detects aggregate functions', () => {
    const result = analyzeSql('SELECT COUNT(*), SUM(amount) FROM orders');
    expect(result.aggregates.length).toBeGreaterThanOrEqual(2);
  });

  it('detects LIKE leading wildcard warning', () => {
    const result = analyzeSql("SELECT * FROM users WHERE name LIKE '%smith'");
    expect(result.warnings.some(w => w.toLowerCase().includes('wildcard') || w.toLowerCase().includes('like'))).toBe(true);
  });
});

describe('analyzeSql - INSERT', () => {
  it('detects INSERT statement type', () => {
    const result = analyzeSql("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')");
    expect(result.statementType).toBe('INSERT');
  });
});

describe('analyzeSql - UPDATE', () => {
  it('detects UPDATE without WHERE warning', () => {
    const result = analyzeSql('UPDATE users SET active = 0');
    expect(result.warnings.some(w => w.includes('WHERE'))).toBe(true);
  });

  it('no warning when WHERE present', () => {
    const result = analyzeSql('UPDATE users SET active = 0 WHERE id = 1');
    expect(result.warnings.filter(w => w.includes('ALL rows')).length).toBe(0);
  });
});

describe('analyzeSql - DELETE', () => {
  it('detects DELETE without WHERE', () => {
    const result = analyzeSql('DELETE FROM users');
    expect(result.warnings.some(w => w.includes('ALL rows'))).toBe(true);
  });
});

describe('analyzeSql - DROP', () => {
  it('warns about DROP', () => {
    const result = analyzeSql('DROP TABLE users');
    expect(result.warnings.some(w => w.toLowerCase().includes('drop'))).toBe(true);
  });
});

describe('analyzeSql - empty input', () => {
  it('returns empty result for empty input', () => {
    const result = analyzeSql('');
    expect(result.statementType).toBe('');
    expect(result.clauses.length).toBe(0);
  });
});

describe('auditSql', () => {
  it('grades a WHERE-less DELETE as high', () => {
    const [issue] = auditSql('DELETE FROM sessions');
    expect(issue.severity).toBe('high');
    expect(issue.title).toBe('DELETE without WHERE');
  });

  it('grades SELECT * as low', () => {
    const issues = auditSql('SELECT * FROM users WHERE id = 1');
    expect(issues.find(i => i.title === 'SELECT *')?.severity).toBe('low');
  });

  it('orders high severity first', () => {
    const issues = auditSql('DROP TABLE users');
    expect(issues[0].severity).toBe('high');
  });

  it('flags ORDER BY without LIMIT', () => {
    const issues = auditSql('SELECT id FROM users ORDER BY created_at');
    expect(issues.some(i => i.title === 'ORDER BY without LIMIT')).toBe(true);
  });

  it('leaves a tidy query alone', () => {
    expect(auditSql('SELECT id FROM users WHERE id = 1 LIMIT 1')).toEqual([]);
  });

  it('returns nothing for empty input', () => expect(auditSql('  ')).toEqual([]));
});

describe('tokenizeSql', () => {
  it('marks keywords and identifiers', () => {
    const kinds = tokenizeSql('SELECT id FROM users').filter(t => t.kind !== 'whitespace');
    expect(kinds.map(t => t.kind)).toEqual(['keyword', 'identifier', 'keyword', 'identifier']);
  });

  it('does not highlight a keyword inside a string literal', () => {
    const tokens = tokenizeSql("SELECT 'FROM users' AS s");
    const literal = tokens.find(t => t.kind === 'string');
    expect(literal?.text).toBe("'FROM users'");
    expect(tokens.filter(t => t.kind === 'keyword').map(t => t.text)).toEqual(['SELECT', 'AS']);
  });

  it('consumes line comments whole', () => {
    const tokens = tokenizeSql('SELECT 1 -- FROM users\nFROM t');
    expect(tokens.find(t => t.kind === 'comment')?.text).toBe('-- FROM users');
  });

  it('consumes block comments whole', () => {
    expect(tokenizeSql('/* SELECT */ 1').find(t => t.kind === 'comment')?.text).toBe('/* SELECT */');
  });

  it('marks aggregates as functions only when called', () => {
    expect(tokenizeSql('SELECT COUNT(*)').find(t => t.text === 'COUNT')?.kind).toBe('function');
    expect(tokenizeSql('SELECT count FROM t').find(t => t.text === 'count')?.kind).toBe('keyword');
  });

  it('round-trips the input', () => {
    const sql = "SELECT a.b, 12.5 FROM t WHERE x <> 'q' -- note";
    expect(tokenizeSql(sql).map(t => t.text).join('')).toBe(sql);
  });
});
