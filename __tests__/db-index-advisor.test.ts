import {
  analyzeQuery,
  estimateCardinality,
  buildIndexScript,
} from '../Components/Functions/DbIndexAdvisorTools/logic';

describe('analyzeQuery', () => {
  it('returns empty result for empty input', () => {
    const result = analyzeQuery('');
    expect(result.suggestions).toHaveLength(0);
    expect(result.summary).toBe('');
  });

  it('warns for non-SELECT queries', () => {
    const result = analyzeQuery('UPDATE users SET name = "x"');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.suggestions).toHaveLength(0);
  });

  it('suggests index for WHERE column', () => {
    const result = analyzeQuery('SELECT * FROM users WHERE email = "a@b.com"');
    expect(result.suggestions.some(s => s.columns.includes('email'))).toBe(true);
  });

  it('suggests index for ORDER BY column', () => {
    const result = analyzeQuery('SELECT id, name FROM orders ORDER BY created_at DESC');
    expect(result.suggestions.some(s => s.columns.includes('created_at'))).toBe(true);
  });

  it('suggests index for JOIN ON column', () => {
    const result = analyzeQuery(
      'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id'
    );
    const cols = result.suggestions.flatMap(s => s.columns);
    expect(cols).toContain('user_id');
  });

  it('suggests composite index for multi-column WHERE', () => {
    const result = analyzeQuery(
      'SELECT * FROM orders WHERE status = "done" AND user_id = 5'
    );
    const composite = result.suggestions.find(s => s.indexType === 'composite');
    expect(composite).toBeDefined();
  });

  it('warns about SELECT *', () => {
    const result = analyzeQuery('SELECT * FROM users WHERE id = 1');
    expect(result.warnings.some(w => w.includes('SELECT *'))).toBe(true);
  });

  it('warns about leading LIKE wildcard', () => {
    const result = analyzeQuery("SELECT id FROM users WHERE name LIKE '%alice'");
    expect(result.warnings.some(w => w.includes('LIKE'))).toBe(true);
  });
});

describe('estimateCardinality', () => {
  it('calls identifiers high', () => {
    expect(estimateCardinality('user_id').level).toBe('high');
    expect(estimateCardinality('id').level).toBe('high');
    expect(estimateCardinality('email').level).toBe('high');
  });

  it('calls timestamps high', () => {
    expect(estimateCardinality('created_at').level).toBe('high');
  });

  it('calls booleans and enums low', () => {
    expect(estimateCardinality('is_active').level).toBe('low');
    expect(estimateCardinality('status').level).toBe('low');
    expect(estimateCardinality('role').level).toBe('low');
  });

  it('falls back to medium with a reason', () => {
    const guess = estimateCardinality('widget_weight');
    expect(guess.level).toBe('medium');
    expect(guess.reason).toBeTruthy();
  });
});

describe('buildIndexScript', () => {
  it('emits one CREATE INDEX per line', () => {
    const script = buildIndexScript(
      analyzeQuery('SELECT id FROM users WHERE email = "a@b.com" ORDER BY created_at')
    );
    const lines = script.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every(l => l.startsWith('CREATE INDEX'))).toBe(true);
  });

  it('drops duplicate statements', () => {
    const script = buildIndexScript(
      analyzeQuery('SELECT id FROM users WHERE email = "a" AND email = "b"')
    );
    const lines = script.split('\n').filter(Boolean);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('is empty when there is nothing to suggest', () => {
    expect(buildIndexScript(analyzeQuery(''))).toBe('');
  });
});
