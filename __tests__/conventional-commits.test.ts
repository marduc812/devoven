import { buildCommitMessage, parseCommitInput, getCommitTemplate } from '@/Components/Functions/ConventionalCommitsTools/logic';
describe('buildCommitMessage', () => {
  it('builds simple commit', () => {
    const r = buildCommitMessage({ type: 'feat', description: 'add login' });
    expect(r).toBe('feat: add login');
  });
  it('includes scope', () => {
    const r = buildCommitMessage({ type: 'fix', scope: 'auth', description: 'fix token' });
    expect(r).toBe('fix(auth): fix token');
  });
  it('marks breaking change with !', () => {
    const r = buildCommitMessage({ type: 'feat', breaking: true, description: 'change API' });
    expect(r).toContain('feat!: change API');
  });
  it('includes body', () => {
    const r = buildCommitMessage({ type: 'feat', description: 'test', body: 'Body text' });
    expect(r).toContain('Body text');
  });
  it('throws for empty description', () => expect(() => buildCommitMessage({ type: 'feat', description: '' })).toThrow());
});
describe('parseCommitInput', () => {
  it('parses complete input', () => {
    const r = parseCommitInput('type: feat\nscope: auth\ndescription: add OAuth');
    expect(r).toContain('feat(auth): add OAuth');
  });
  it('throws for unknown type', () => {
    expect(() => parseCommitInput('type: unknown\ndescription: test')).toThrow();
  });
});
describe('getCommitTemplate', () => {
  it('returns a non-empty template', () => expect(getCommitTemplate().length).toBeGreaterThan(0));
});
