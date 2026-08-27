import {
  calculateSpecificity,
  compareSpecificity,
  parseSemver,
  compareSemver,
  semverSatisfies,
  bumpVersion,
} from '@/Components/Functions/DevTools3/logic';

// ─── calculateSpecificity ────────────────────────────────────────────────────

describe('calculateSpecificity', () => {
  it('#id = (1,0,0)', () => {
    const s = calculateSpecificity('#id');
    expect(s.ids).toBe(1); expect(s.classes).toBe(0); expect(s.elements).toBe(0);
  });

  it('.class = (0,1,0)', () => {
    const s = calculateSpecificity('.foo');
    expect(s.ids).toBe(0); expect(s.classes).toBe(1); expect(s.elements).toBe(0);
  });

  it('div = (0,0,1)', () => {
    const s = calculateSpecificity('div');
    expect(s.ids).toBe(0); expect(s.classes).toBe(0); expect(s.elements).toBe(1);
  });

  it('formats score string correctly', () => {
    const s = calculateSpecificity('#app .btn');
    expect(s.score).toBe('(1, 1, 0)');
  });

  it('throws on empty selector', () => {
    expect(() => calculateSpecificity('')).toThrow();
  });
});

// ─── compareSpecificity ──────────────────────────────────────────────────────

describe('compareSpecificity', () => {
  it('higher ID wins', () => {
    const a = calculateSpecificity('#id');
    const b = calculateSpecificity('.foo');
    expect(compareSpecificity(a, b)).toBe('A wins');
  });

  it('equal scores return Equal', () => {
    const a = calculateSpecificity('div');
    const b = calculateSpecificity('span');
    expect(compareSpecificity(a, b)).toBe('Equal');
  });

  it('higher class count wins when IDs equal', () => {
    const a = calculateSpecificity('.a.b');
    const b = calculateSpecificity('.c');
    expect(compareSpecificity(a, b)).toBe('A wins');
  });

  it('B wins when B has more IDs', () => {
    const a = calculateSpecificity('div');
    const b = calculateSpecificity('#id');
    expect(compareSpecificity(a, b)).toBe('B wins');
  });

  it('element tiebreaker works', () => {
    const a = calculateSpecificity('div p');
    const b = calculateSpecificity('span');
    expect(compareSpecificity(a, b)).toBe('A wins');
  });
});

// ─── compareSemver ───────────────────────────────────────────────────────────

describe('compareSemver', () => {
  it('1.2.3 > 1.2.2', () => expect(compareSemver('1.2.3', '1.2.2')).toBe(1));
  it('2.0.0 > 1.9.9', () => expect(compareSemver('2.0.0', '1.9.9')).toBe(1));
  it('1.0.0 === 1.0.0', () => expect(compareSemver('1.0.0', '1.0.0')).toBe(0));
  it('1.0.0-alpha < 1.0.0', () => expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(-1));
  it('throws on invalid', () => expect(() => compareSemver('not-semver', '1.0.0')).toThrow());
});

// ─── parseSemver ─────────────────────────────────────────────────────────────

describe('parseSemver', () => {
  it('parses valid version', () => {
    const v = parseSemver('1.2.3');
    expect(v.major).toBe(1); expect(v.minor).toBe(2); expect(v.patch).toBe(3); expect(v.valid).toBe(true);
  });

  it('parses v-prefixed version', () => {
    const v = parseSemver('v2.0.0');
    expect(v.major).toBe(2); expect(v.valid).toBe(true);
  });

  it('parses prerelease', () => {
    const v = parseSemver('1.0.0-alpha.1');
    expect(v.prerelease).toBe('alpha.1');
  });

  it('returns invalid for garbage', () => {
    const v = parseSemver('not-a-version');
    expect(v.valid).toBe(false);
  });

  it('parses build metadata', () => {
    const v = parseSemver('1.0.0+build.1');
    expect(v.build).toBe('build.1');
  });
});

// ─── semverSatisfies ─────────────────────────────────────────────────────────

describe('semverSatisfies', () => {
  it('^1.2.3 satisfied by 1.3.0', () => expect(semverSatisfies('1.3.0', '^1.2.3')).toBe(true));
  it('^1.2.3 not satisfied by 2.0.0', () => expect(semverSatisfies('2.0.0', '^1.2.3')).toBe(false));
  it('>=1.0.0 satisfied by 1.0.1', () => expect(semverSatisfies('1.0.1', '>=1.0.0')).toBe(true));
  it('<2.0.0 satisfied by 1.9.9', () => expect(semverSatisfies('1.9.9', '<2.0.0')).toBe(true));
  it('~1.2.3 not satisfied by 1.3.0', () => expect(semverSatisfies('1.3.0', '~1.2.3')).toBe(false));
});

// ─── bumpVersion ─────────────────────────────────────────────────────────────

describe('bumpVersion', () => {
  it('bumps major', () => expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0'));
  it('bumps minor', () => expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0'));
  it('bumps patch', () => expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4'));
  it('throws on invalid', () => expect(() => bumpVersion('bad', 'major')).toThrow());
  it('handles 0.0.0', () => expect(bumpVersion('0.0.0', 'patch')).toBe('0.0.1'));
});
