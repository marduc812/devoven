import {
  parseSemVer,
  bumpVersion,
  formatVersion,
  parseCommit,
  determineBumpType,
  analyzeSemver,
  formatSemverResult,
} from '@/Components/Functions/SemverBumperTools/logic';

describe('parseSemVer', () => {
  it('parses standard version', () => {
    const v = parseSemVer('1.2.3');
    expect(v).toEqual({ major: 1, minor: 2, patch: 3, prerelease: undefined });
  });

  it('strips leading v', () => {
    const v = parseSemVer('v2.0.0');
    expect(v.major).toBe(2);
  });

  it('parses prerelease', () => {
    const v = parseSemVer('1.0.0-alpha.1');
    expect(v.prerelease).toBe('alpha.1');
  });

  it('throws on invalid version', () => {
    expect(() => parseSemVer('1.2')).toThrow();
    expect(() => parseSemVer('not-a-version')).toThrow();
  });
});

describe('bumpVersion', () => {
  it('bumps major and resets minor/patch', () => {
    const result = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'major');
    expect(result).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('bumps minor and resets patch', () => {
    const result = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'minor');
    expect(result).toEqual({ major: 1, minor: 3, patch: 0 });
  });

  it('bumps patch only', () => {
    const result = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'patch');
    expect(result).toEqual({ major: 1, minor: 2, patch: 4 });
  });

  it('no bump returns same version', () => {
    const result = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'none');
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
  });
});

describe('parseCommit', () => {
  it('parses feat commit', () => {
    const c = parseCommit('feat: add login page');
    expect(c.type).toBe('feat');
    expect(c.breaking).toBe(false);
    expect(c.description).toBe('add login page');
  });

  it('detects breaking change via !', () => {
    const c = parseCommit('feat!: redesign API');
    expect(c.breaking).toBe(true);
    expect(c.type).toBe('feat');
  });

  it('parses fix commit', () => {
    const c = parseCommit('fix(auth): handle expired tokens');
    expect(c.type).toBe('fix');
    expect(c.breaking).toBe(false);
  });

  it('parses chore commit', () => {
    const c = parseCommit('chore: update deps');
    expect(c.type).toBe('chore');
  });

  it('handles non-conventional commit', () => {
    const c = parseCommit('misc stuff');
    expect(c.type).toBe('unknown');
    expect(c.breaking).toBe(false);
  });
});

describe('determineBumpType', () => {
  it('returns major for breaking commit', () => {
    const commits = [parseCommit('feat!: break everything')];
    expect(determineBumpType(commits)).toBe('major');
  });

  it('returns minor for feat', () => {
    const commits = [parseCommit('feat: new feature')];
    expect(determineBumpType(commits)).toBe('minor');
  });

  it('returns patch for fix', () => {
    const commits = [parseCommit('fix: resolve bug')];
    expect(determineBumpType(commits)).toBe('patch');
  });

  it('returns none for chore only', () => {
    const commits = [parseCommit('chore: update deps'), parseCommit('docs: update readme')];
    expect(determineBumpType(commits)).toBe('none');
  });

  it('major wins over feat', () => {
    const commits = [parseCommit('feat: add feature'), parseCommit('fix!: breaking fix')];
    expect(determineBumpType(commits)).toBe('major');
  });

  it('returns none for empty commits', () => {
    expect(determineBumpType([])).toBe('none');
  });
});

describe('analyzeSemver', () => {
  it('suggests minor bump for feat commits', () => {
    const result = analyzeSemver('1.2.3\nfeat: add new endpoint\nfix: fix typo');
    expect(result.bumpType).toBe('minor');
    expect(result.newVersion).toBe('1.3.0');
  });

  it('suggests major bump for breaking changes', () => {
    const result = analyzeSemver('2.0.0\nfeat!: new incompatible API');
    expect(result.bumpType).toBe('major');
    expect(result.newVersion).toBe('3.0.0');
  });

  it('suggests patch bump for fix only', () => {
    const result = analyzeSemver('1.0.0\nfix: null pointer exception');
    expect(result.bumpType).toBe('patch');
    expect(result.newVersion).toBe('1.0.1');
  });

  it('throws on empty input', () => {
    expect(() => analyzeSemver('')).toThrow();
  });

  it('throws on missing commits', () => {
    expect(() => analyzeSemver('1.0.0')).toThrow();
  });

  it('throws on invalid version', () => {
    expect(() => analyzeSemver('bad-version\nfeat: something')).toThrow();
  });
});

describe('formatSemverResult', () => {
  it('includes current version and new version', () => {
    const result = analyzeSemver('1.0.0\nfeat: something new');
    const output = formatSemverResult(result);
    expect(output).toContain('1.0.0');
    expect(output).toContain('1.1.0');
    expect(output).toContain('MINOR');
  });
});
