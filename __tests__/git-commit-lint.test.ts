import {
  parseCommit,
  lintCommit,
  COMMIT_TYPES,
  COMMIT_TYPE_DESCRIPTIONS,
} from '@/Components/Functions/GitCommitLintTools/logic';

describe('parseCommit', () => {
  it('parses type and subject', () => {
    const c = parseCommit('feat: add login page');
    expect(c.type).toBe('feat');
    expect(c.subject).toBe('add login page');
    expect(c.scope).toBeNull();
    expect(c.isBreaking).toBe(false);
  });
  it('parses scope', () => {
    const c = parseCommit('fix(auth): resolve token expiry');
    expect(c.type).toBe('fix');
    expect(c.scope).toBe('auth');
    expect(c.subject).toBe('resolve token expiry');
  });
  it('detects breaking change with !', () => {
    const c = parseCommit('feat!: remove deprecated API');
    expect(c.isBreaking).toBe(true);
  });
  it('parses body after blank line', () => {
    const c = parseCommit('fix: patch issue\n\nThis fixes the login bug.');
    expect(c.body).toContain('This fixes the login bug');
  });
  it('handles missing type gracefully', () => {
    const c = parseCommit('just a plain message');
    expect(c.type).toBeNull();
    expect(c.subject).toBe('just a plain message');
  });
});

describe('lintCommit', () => {
  it('passes valid conventional commit', () => {
    const r = lintCommit('feat: add user authentication');
    expect(r.valid).toBe(true);
    expect(r.issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });
  it('errors on missing type', () => {
    const r = lintCommit('just a message without type');
    const errors = r.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });
  it('errors on unknown type', () => {
    const r = lintCommit('blah: something');
    expect(r.issues.some(i => i.message.includes('Unknown type'))).toBe(true);
  });
  it('errors on header > 72 chars', () => {
    const longMsg = 'feat: ' + 'a'.repeat(70);
    const r = lintCommit(longMsg);
    expect(r.issues.some(i => i.severity === 'error' && i.message.includes('long'))).toBe(true);
  });
  it('warns on header > 50 chars', () => {
    const medMsg = 'feat: ' + 'a'.repeat(48);
    const r = lintCommit(medMsg);
    expect(r.issues.some(i => i.severity === 'warning' && i.message.includes('chars'))).toBe(true);
  });
  it('warns on period at end of subject', () => {
    const r = lintCommit('feat: add something.');
    expect(r.issues.some(i => i.message.includes('period'))).toBe(true);
  });
  it('warns on uppercase subject start', () => {
    const r = lintCommit('feat: Add something');
    expect(r.issues.some(i => i.message.includes('lowercase'))).toBe(true);
  });
  it('warns on past tense imperative', () => {
    const r = lintCommit('feat: added new feature');
    expect(r.issues.some(i => i.message.includes('imperative'))).toBe(true);
  });
  it('errors when second line is not blank', () => {
    const r = lintCommit('feat: something\nnot blank line\nbody');
    expect(r.issues.some(i => i.severity === 'error' && i.message.includes('blank'))).toBe(true);
  });
  it('marks breaking change as info', () => {
    const r = lintCommit('feat!: remove API');
    expect(r.issues.some(i => i.severity === 'info' && i.message.includes('Breaking'))).toBe(true);
  });
  it('returns score 100 for perfect commit', () => {
    expect(lintCommit('fix: resolve null pointer').score).toBe(100);
  });
  it('reduces score for errors', () => {
    expect(lintCommit('invalid commit message').score).toBeLessThan(100);
  });
  it('formatted output contains report header', () => {
    const r = lintCommit('feat: do something');
    expect(r.formatted).toContain('Conventional Commit Lint Report');
  });
});

describe('COMMIT_TYPES', () => {
  it('includes feat and fix', () => {
    expect(COMMIT_TYPES).toContain('feat');
    expect(COMMIT_TYPES).toContain('fix');
  });
  it('has descriptions for all types', () => {
    for (const t of COMMIT_TYPES) {
      expect(COMMIT_TYPE_DESCRIPTIONS[t]).toBeTruthy();
    }
  });
});
