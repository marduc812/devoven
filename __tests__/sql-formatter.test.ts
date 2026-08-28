import { formatSql } from '@/Components/Functions/SqlFormatterTools/logic';

// Keyword spacing is not asserted directly: the formatter pads after a keyword
// and that padding is cosmetic. These tests pin the structure instead — which
// clause starts a line, how keywords are cased, and what survives untouched.
const lines = (sql: string) => formatSql(sql).split('\n').map(l => l.trim());

describe('formatSql', () => {
  it('returns an empty string for empty input', () => {
    expect(formatSql('')).toBe('');
    expect(formatSql('   \n  ')).toBe('');
  });

  it('uppercases keywords', () => {
    const out = formatSql('select id from users');
    expect(out).toMatch(/SELECT/);
    expect(out).toMatch(/FROM/);
    expect(out).not.toMatch(/\bselect\b/);
  });

  it('puts each top-level clause on its own line', () => {
    const l = lines('select id from users where age > 21 order by name');
    expect(l[0]).toMatch(/^SELECT\s+id$/);
    expect(l).toContainEqual(expect.stringMatching(/^FROM\s+users$/));
    expect(l).toContainEqual(expect.stringMatching(/^WHERE\s+age > 21$/));
    expect(l).toContainEqual(expect.stringMatching(/^ORDER BY\s+name$/));
  });

  it('breaks a select list onto one column per line', () => {
    const l = lines('select id, name, email from users');
    expect(l).toContainEqual('name,');
    expect(l).toContainEqual('email');
  });

  it('keeps ORDER BY and GROUP BY as single compound keywords', () => {
    expect(formatSql('select a from t group by a')).toMatch(/GROUP BY/);
    expect(formatSql('select a from t order by a')).toMatch(/ORDER BY/);
  });

  it('preserves string literals verbatim, including their case', () => {
    const out = formatSql("select * from t where name = 'Select From Where'");
    expect(out).toContain("'Select From Where'");
  });

  it('keeps comments on their own line', () => {
    const l = lines('-- a leading note\nselect 1');
    expect(l[0]).toBe('-- a leading note');
  });

  it('formats a join', () => {
    const out = formatSql('select u.id from users u join orders o on o.user_id = u.id');
    expect(out).toMatch(/JOIN/);
    expect(out).toMatch(/ON/);
  });

  it('is idempotent — formatting formatted SQL changes nothing', () => {
    const once = formatSql('select id, name from users where age > 21');
    expect(formatSql(once)).toBe(once);
  });
});
