import {
  parseSemver,
  compareSemver,
  semverComparison,
  nextBumps,
  checkRange,
  formatSemverReport,
} from '@/Components/Functions/SemverRangeTools/logic';

describe('parseSemver', () => {
  it('parses valid semver', () => {
    const sv = parseSemver('1.2.3');
    expect(sv.valid).toBe(true);
    expect(sv.major).toBe(1);
    expect(sv.minor).toBe(2);
    expect(sv.patch).toBe(3);
  });
  it('parses with v prefix', () => {
    expect(parseSemver('v2.0.0').valid).toBe(true);
    expect(parseSemver('v2.0.0').major).toBe(2);
  });
  it('parses pre-release', () => {
    const sv = parseSemver('1.0.0-alpha.1');
    expect(sv.preRelease).toBe('alpha.1');
  });
  it('parses build metadata', () => {
    const sv = parseSemver('1.0.0+build.42');
    expect(sv.buildMeta).toBe('build.42');
  });
  it('returns invalid for bad input', () => {
    expect(parseSemver('not-semver').valid).toBe(false);
    expect(parseSemver('1.2').valid).toBe(false);
  });
});

describe('compareSemver', () => {
  it('returns 0 for equal versions', () => {
    expect(compareSemver(parseSemver('1.0.0'), parseSemver('1.0.0'))).toBe(0);
  });
  it('returns 1 when first is greater by major', () => {
    expect(compareSemver(parseSemver('2.0.0'), parseSemver('1.9.9'))).toBe(1);
  });
  it('returns -1 when first is smaller by patch', () => {
    expect(compareSemver(parseSemver('1.0.0'), parseSemver('1.0.1'))).toBe(-1);
  });
  it('pre-release is lower than release', () => {
    expect(compareSemver(parseSemver('1.0.0-alpha'), parseSemver('1.0.0'))).toBe(-1);
  });
  it('higher pre-release number wins', () => {
    expect(compareSemver(parseSemver('1.0.0-alpha.2'), parseSemver('1.0.0-alpha.1'))).toBe(1);
  });
});

describe('semverComparison', () => {
  it('labels equal versions with =', () => {
    expect(semverComparison('1.0.0', '1.0.0').label).toContain('=');
  });
  it('labels greater with >', () => {
    expect(semverComparison('2.0.0', '1.0.0').label).toContain('>');
  });
  it('labels lesser with <', () => {
    expect(semverComparison('1.0.0', '2.0.0').label).toContain('<');
  });
});

describe('nextBumps', () => {
  it('bumps patch correctly', () => {
    expect(nextBumps(parseSemver('1.2.3')).nextPatch).toBe('1.2.4');
  });
  it('bumps minor and resets patch', () => {
    expect(nextBumps(parseSemver('1.2.3')).nextMinor).toBe('1.3.0');
  });
  it('bumps major and resets minor.patch', () => {
    expect(nextBumps(parseSemver('1.2.3')).nextMajor).toBe('2.0.0');
  });
});

describe('checkRange', () => {
  it('>=: satisfied when equal', () => {
    expect(checkRange('1.0.0', '>=1.0.0').satisfied).toBe(true);
  });
  it('>=: satisfied when greater', () => {
    expect(checkRange('1.5.0', '>=1.0.0').satisfied).toBe(true);
  });
  it('>=: fails when less', () => {
    expect(checkRange('0.9.0', '>=1.0.0').satisfied).toBe(false);
  });
  it('<: satisfied when less', () => {
    expect(checkRange('1.9.9', '<2.0.0').satisfied).toBe(true);
  });
  it('<: fails when equal', () => {
    expect(checkRange('2.0.0', '<2.0.0').satisfied).toBe(false);
  });
  it('^: caret range same major', () => {
    expect(checkRange('1.5.0', '^1.0.0').satisfied).toBe(true);
    expect(checkRange('2.0.0', '^1.0.0').satisfied).toBe(false);
  });
  it('~: tilde range same major.minor', () => {
    expect(checkRange('1.2.9', '~1.2.0').satisfied).toBe(true);
    expect(checkRange('1.3.0', '~1.2.0').satisfied).toBe(false);
  });
  it('returns invalid version error', () => {
    expect(checkRange('not-semver', '>=1.0.0').satisfied).toBe(false);
  });
  it('returns invalid range error', () => {
    expect(checkRange('1.0.0', '>=not-valid').satisfied).toBe(false);
  });
});

describe('formatSemverReport', () => {
  it('shows error for invalid version', () => {
    expect(formatSemverReport('bad', '')).toContain('Error');
  });
  it('shows parsed components', () => {
    const result = formatSemverReport('2.3.4', '');
    expect(result).toContain('Major:       2');
    expect(result).toContain('Minor:       3');
    expect(result).toContain('Patch:       4');
  });
  it('shows range check when range provided', () => {
    const result = formatSemverReport('1.5.0', '^1.0.0');
    expect(result).toContain('Range Check');
    expect(result).toContain('YES');
  });
  it('shows next version bumps', () => {
    const result = formatSemverReport('1.2.3', '');
    expect(result).toContain('Next patch: 1.2.4');
    expect(result).toContain('Next minor: 1.3.0');
    expect(result).toContain('Next major: 2.0.0');
  });
});
