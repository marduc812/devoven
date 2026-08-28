import { parseCommit, parseAllCommits, determineVersionBump, generateChangelog } from '@/Components/Functions/ChangelogGenTools/logic';

describe('parseCommit', () => {
  it('parses feat commit', () => {
    const c = parseCommit('feat(auth): add OAuth2 login');
    expect(c.type).toBe('feat');
    expect(c.scope).toBe('auth');
    expect(c.breaking).toBe(false);
    expect(c.description).toBe('add OAuth2 login');
  });

  it('parses breaking change with !', () => {
    const c = parseCommit('feat!: redesign API');
    expect(c.type).toBe('feat');
    expect(c.breaking).toBe(true);
  });

  it('parses fix commit', () => {
    const c = parseCommit('fix: resolve null pointer exception');
    expect(c.type).toBe('fix');
    expect(c.scope).toBeUndefined();
  });

  it('handles non-conventional commit', () => {
    const c = parseCommit('just a random message');
    expect(c.type).toBe('other');
    expect(c.description).toBe('just a random message');
  });

  it('maps unknown type to other', () => {
    const c = parseCommit('xyz: some change');
    expect(c.type).toBe('other');
  });
});

describe('determineVersionBump', () => {
  it('returns major for breaking change', () => {
    const commits = parseAllCommits('feat!: breaking\nfix: something');
    expect(determineVersionBump(commits).bump).toBe('major');
  });

  it('returns minor for feat', () => {
    const commits = parseAllCommits('feat: new feature\nfix: bug');
    expect(determineVersionBump(commits).bump).toBe('minor');
  });

  it('returns patch for fix only', () => {
    const commits = parseAllCommits('fix: minor bug\nchore: update deps');
    expect(determineVersionBump(commits).bump).toBe('patch');
  });

  it('returns none for empty', () => {
    expect(determineVersionBump([]).bump).toBe('none');
  });
});

describe('generateChangelog', () => {
  it('generates markdown with sections', () => {
    const input = 'feat(api): add endpoint\nfix: fix bug\ndocs: update readme';
    const result = generateChangelog(input);
    expect(result.markdown).toContain('### Features');
    expect(result.markdown).toContain('### Bug Fixes');
    expect(result.markdown).toContain('### Documentation');
    expect(result.versionBump).toBe('minor');
  });

  it('groups commits by type', () => {
    const input = 'feat: a\nfeat: b\nfix: c';
    const result = generateChangelog(input);
    expect(result.groups['feat'].length).toBe(2);
    expect(result.groups['fix'].length).toBe(1);
  });

  it('handles empty input gracefully', () => {
    const result = generateChangelog('');
    expect(result.versionBump).toBe('none');
  });
});
