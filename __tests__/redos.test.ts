import { RegExpParser } from '@eslint-community/regexpp';
import { classifyGrowth, nextSweepK, type TimingPoint } from '@/Components/Functions/RedosTools/classify';
import {
  firstChars,
  intersect,
  isEmpty,
  hasChar,
  canMatchEmpty,
  shortestMatch,
  charOutside,
} from '@/Components/Functions/RedosTools/charsets';
import { analyze, buildAttack } from '@/Components/Functions/RedosTools/analyze';

const NO_FLAGS = { ignoreCase: false, dotAll: false };

/**
 * First element of a pattern's first alternative, for exercising node-level helpers.
 * `\p{...}` is only a property escape in unicode mode, so those cases must opt in.
 */
const firstEl = (source: string, unicode = false) => {
  const pattern = new RegExpParser().parsePattern(source, 0, source.length, { unicode });
  return pattern.alternatives[0].elements[0];
};

const setOf = (source: string, flags = NO_FLAGS) => {
  const result = firstChars(firstEl(source), flags);
  if (result === 'unknown') throw new Error(`expected a known set for /${source}/`);
  return result;
};

const SWEEP = [8, 12, 16, 20, 24, 28, 32];

const curve = (f: (k: number) => number): TimingPoint[] =>
  SWEEP.map(k => ({ k, ms: f(k) }));

describe('classifyGrowth', () => {
  it('reports flat timings as not super-linear', () => {
    const result = classifyGrowth(curve(() => 10));
    expect(result.kind).toBe('linear');
  });

  it('reports linear timings as not super-linear', () => {
    const result = classifyGrowth(curve(k => k));
    expect(result.kind).toBe('linear');
  });

  it('detects quadratic growth and its degree', () => {
    const result = classifyGrowth(curve(k => (k * k) / 10));
    expect(result.kind).toBe('polynomial');
    expect(result.degree).toBe(2);
  });

  it('detects cubic growth and its degree', () => {
    const result = classifyGrowth(curve(k => (k * k * k) / 100));
    expect(result.kind).toBe('polynomial');
    expect(result.degree).toBe(3);
  });

  it('detects exponential growth', () => {
    // Real blowups double per added pump, not per four. Over a wide k range a
    // curve that doubles every fourth step is genuinely indistinguishable from
    // a cubic, so this uses the shape actually observed in measurement.
    const result = classifyGrowth([20, 21, 22, 23, 24, 25, 26].map(k => ({ k, ms: 2 ** (k - 19) })));
    expect(result.kind).toBe('exponential');
  });

  it('does not mistake quadratic growth for exponential', () => {
    const result = classifyGrowth(curve(k => (k * k) / 10));
    expect(result.kind).not.toBe('exponential');
  });

  it('is inconclusive with fewer than three usable points', () => {
    expect(classifyGrowth([{ k: 8, ms: 50 }, { k: 16, ms: 200 }]).kind).toBe('inconclusive');
  });

  it('discards readings below the noise floor', () => {
    const result = classifyGrowth(curve(() => 0.4));
    expect(result.kind).toBe('inconclusive');
  });

  it('treats a timed-out run as exponential evidence', () => {
    const points: TimingPoint[] = [
      { k: 8, ms: 3 },
      { k: 12, ms: 25 },
      { k: 16, ms: 240 },
      { k: 20, ms: 1000, timedOut: true },
    ];
    expect(classifyGrowth(points).kind).toBe('exponential');
  });

  it('reads a narrow band of doubling times as exponential, not a high-degree polynomial', () => {
    // Real shape of a measured (a+)+$ sweep: over a narrow k range an
    // exponential curve fits a power law just as well, so degree is the tell.
    const points = [
      { k: 21, ms: 2 }, { k: 22, ms: 4 }, { k: 23, ms: 7 },
      { k: 24, ms: 15 }, { k: 25, ms: 30 }, { k: 26, ms: 60 },
    ];
    expect(classifyGrowth(points).kind).toBe('exponential');
  });

  it('still reports a genuine cubic as polynomial', () => {
    const points = [4096, 8192, 16384, 32768].map(k => ({ k, ms: (k / 4096) ** 3 * 4 }));
    const result = classifyGrowth(points);
    expect(result.kind).toBe('polynomial');
    expect(result.degree).toBe(3);
  });

  // The two datasets below are verbatim measurements taken in a worker, kept as
  // regression guards for the discrimination between the two curve shapes.

  it('keeps a measured quadratic-shaped sweep polynomial', () => {
    // /\s*\s*$/ via its adjacent-quantifiers candidate.
    const result = classifyGrowth([
      { k: 64, ms: 0.3 }, { k: 128, ms: 2.0 }, { k: 254, ms: 14.6 }, { k: 255, ms: 14.2 },
      { k: 256, ms: 14.9 }, { k: 510, ms: 119.7 }, { k: 511, ms: 131.2 }, { k: 512, ms: 137.8 },
      { k: 1024, ms: 1000, timedOut: true },
    ]);
    expect(result.kind).toBe('polynomial');
    expect(result.degree).toBe(3);
  });

  it('reads a measured narrow-band sweep as exponential', () => {
    // /^(([a-z])+.)+[A-Z]([a-z])+$/ via its nested-quantifier candidate.
    const result = classifyGrowth([
      { k: 27, ms: 6.8 }, { k: 28, ms: 10.8 }, { k: 29, ms: 16.0 }, { k: 30, ms: 26.4 },
      { k: 31, ms: 47.7 }, { k: 32, ms: 79.7 }, { k: 64, ms: 1000, timedOut: true },
    ]);
    expect(result.kind).toBe('exponential');
  });

  it('tolerates measurement noise on a quadratic curve', () => {
    const jitter = [1.08, 0.94, 1.05, 0.97, 1.02, 0.96, 1.04];
    const result = classifyGrowth(SWEEP.map((k, i) => ({ k, ms: ((k * k) / 10) * jitter[i] })));
    expect(result.kind).toBe('polynomial');
    expect(result.degree).toBe(2);
  });
});

describe('firstChars', () => {
  it('resolves a literal character', () => {
    const set = setOf('a');
    expect(hasChar(set, 'a')).toBe(true);
    expect(hasChar(set, 'b')).toBe(false);
  });

  it('resolves an escape class', () => {
    const set = setOf('\\d');
    expect(hasChar(set, '5')).toBe(true);
    expect(hasChar(set, 'x')).toBe(false);
  });

  it('resolves a character class range', () => {
    const set = setOf('[a-z]');
    expect(hasChar(set, 'm')).toBe(true);
    expect(hasChar(set, 'M')).toBe(false);
  });

  it('resolves a negated character class', () => {
    const set = setOf('[^a]');
    expect(hasChar(set, 'a')).toBe(false);
    expect(hasChar(set, 'b')).toBe(true);
  });

  it('excludes newline from dot unless the s flag is set', () => {
    expect(hasChar(setOf('.'), '\n')).toBe(false);
    expect(hasChar(setOf('.', { ignoreCase: false, dotAll: true }), '\n')).toBe(true);
  });

  it('folds case when the i flag is set', () => {
    expect(hasChar(setOf('a', { ignoreCase: true, dotAll: false }), 'A')).toBe(true);
    expect(hasChar(setOf('a'), 'A')).toBe(false);
  });

  it('looks through a quantifier to its body', () => {
    expect(hasChar(setOf('a+'), 'a')).toBe(true);
  });

  it('unions the branches of an alternation', () => {
    const set = setOf('(a|b)');
    expect(hasChar(set, 'a')).toBe(true);
    expect(hasChar(set, 'b')).toBe(true);
    expect(hasChar(set, 'c')).toBe(false);
  });

  it('skips a nullable leading element to reach the next one', () => {
    expect(hasChar(setOf('(a*b)'), 'b')).toBe(true);
  });

  it('returns unknown for a unicode property escape', () => {
    expect(firstChars(firstEl('\\p{L}', true), NO_FLAGS)).toBe('unknown');
  });

  it('returns unknown for a backreference', () => {
    const source = '(a)\\1';
    const pattern = new RegExpParser().parsePattern(source, 0, source.length, { unicode: false });
    expect(firstChars(pattern.alternatives[0].elements[1], NO_FLAGS)).toBe('unknown');
  });
});

describe('intersect', () => {
  it('finds the overlap between two escape classes', () => {
    const both = intersect(setOf('\\w'), setOf('\\d'));
    expect(isEmpty(both)).toBe(false);
    expect(hasChar(both, '7')).toBe(true);
    expect(hasChar(both, 'a')).toBe(false);
  });

  it('reports disjoint sets as empty', () => {
    expect(isEmpty(intersect(setOf('\\d'), setOf('[a-z]')))).toBe(true);
  });

  it('overlaps ranges that partially meet', () => {
    const both = intersect(setOf('[a-m]'), setOf('[j-z]'));
    expect(hasChar(both, 'k')).toBe(true);
    expect(hasChar(both, 'a')).toBe(false);
    expect(hasChar(both, 'z')).toBe(false);
  });
});

describe('canMatchEmpty', () => {
  it('is true for a star quantifier', () => {
    expect(canMatchEmpty(firstEl('a*'))).toBe(true);
  });

  it('is false for a plus quantifier', () => {
    expect(canMatchEmpty(firstEl('a+'))).toBe(false);
  });

  it('is false for a literal', () => {
    expect(canMatchEmpty(firstEl('a'))).toBe(false);
  });

  it('is true for a group whose every element is nullable', () => {
    expect(canMatchEmpty(firstEl('(a*b*)'))).toBe(true);
  });
});

describe('shortestMatch', () => {
  it('returns the single character a quantified literal repeats', () => {
    expect(shortestMatch(firstEl('a+'), NO_FLAGS)).toBe('a');
  });

  it('returns the low end of a class range', () => {
    expect(shortestMatch(firstEl('[c-z]'), NO_FLAGS)).toBe('c');
  });

  it('concatenates a group in order', () => {
    expect(shortestMatch(firstEl('(ab)'), NO_FLAGS)).toBe('ab');
  });

  it('returns unknown for constructs it cannot model', () => {
    expect(shortestMatch(firstEl('\\p{L}', true), NO_FLAGS)).toBe('unknown');
  });
});

describe('charOutside', () => {
  it('finds a character the set does not contain', () => {
    const outside = charOutside(setOf('[a-z]'));
    expect(outside).not.toBeNull();
    expect(hasChar(setOf('[a-z]'), outside!)).toBe(false);
  });

  it('returns null when the set covers everything', () => {
    expect(charOutside(setOf('[\\s\\S]'))).toBeNull();
  });
});

describe('analyze', () => {
  const ok = (source: string, flags = '') => {
    const outcome = analyze(source, flags);
    if (outcome.status !== 'ok') throw new Error(`expected ok for /${source}/, got ${outcome.status}`);
    return outcome.candidates;
  };

  it('reports a syntactically invalid pattern', () => {
    const outcome = analyze('(a', '');
    expect(outcome.status).toBe('invalid');
  });

  it('declines to analyze a pattern with a backreference', () => {
    expect(analyze('(a)\\1+', '').status).toBe('not-analyzable');
  });

  it('declines to analyze a pattern with a lookbehind', () => {
    expect(analyze('(?<=a)b+', '').status).toBe('not-analyzable');
  });

  it('declines to analyze a unicode property escape', () => {
    expect(analyze('\\p{L}+x', 'u').status).toBe('not-analyzable');
  });

  describe('known-vulnerable patterns', () => {
    const exponential = [
      '(a+)+$',
      '([a-zA-Z]+)*$',
      '(a|aa)+$',
      '(a|a?)+$',
      '^(([a-z])+.)+[A-Z]([a-z])+$',
      '(\\s*\\w+)+$',
    ];

    it.each(exponential)('flags %s as exponential', source => {
      const candidates = ok(source);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.some(c => c.hypothesis === 'exponential')).toBe(true);
    });

    const polynomial = [
      '.*.*=.*',
      '\\s*\\s*$',
      '[\\r\\n]+$',
    ];

    it.each(polynomial)('flags %s as at least polynomial', source => {
      const candidates = ok(source);
      expect(candidates.length).toBeGreaterThan(0);
    });
  });

  describe('patterns with no ambiguity', () => {
    const safe = [
      '^\\d{4}-\\d{2}-\\d{2}$',
      '^[a-z]+@[a-z]+\\.[a-z]{2,}$',
      '^hello world$',
      '^[a-f0-9]{32}$',
      '^\\d+$',
    ];

    it.each(safe)('finds nothing to attack in %s', source => {
      expect(ok(source)).toHaveLength(0);
    });
  });

  it('builds a pump from the ambiguous body', () => {
    const candidate = ok('(a+)+$')[0];
    expect(candidate.pump).toBe('a');
    expect(candidate.prefix).toBe('');
  });

  it('offers suffixes the ambiguous body cannot consume', () => {
    const candidate = ok('(a+)+$')[0];
    expect(candidate.suffixes.length).toBeGreaterThan(0);
    expect(candidate.suffixes).not.toContain('a');
  });

  it('distinguishes disjoint alternation from overlapping alternation', () => {
    expect(ok('^(a|b)+$')).toHaveLength(0);
    expect(ok('^(a|aa)+$').length).toBeGreaterThan(0);
  });

  it('ignores bounded repetition', () => {
    expect(ok('^(a{2}){3}$')).toHaveLength(0);
  });
});

describe('buildAttack', () => {
  it('repeats the pump between prefix and suffix', () => {
    const candidate = { prefix: 'x', pump: 'ab', suffixes: ['!'] } as never;
    expect(buildAttack(candidate, 3, '!')).toBe('x' + 'ababab' + '!');
  });
});

describe('nextSweepK', () => {
  const fast = (k: number): TimingPoint => ({ k, ms: 0.1 });

  it('starts the ramp with no history', () => {
    expect(nextSweepK([])).toBe(2);
  });

  it('doubles while runs stay well under the target', () => {
    expect(nextSweepK([fast(2)])).toBe(4);
    expect(nextSweepK([fast(2), fast(4)])).toBe(8);
  });

  it('stops the ramp once the pump count would get absurd', () => {
    expect(nextSweepK([fast(2), fast(131072)])).toBeNull();
  });

  it('bisects toward the measurable band when nothing is measurable yet', () => {
    const points = [fast(2), fast(4), { k: 8, ms: 1000, timedOut: true }];
    expect(nextSweepK(points)).toBe(6);
  });

  it('widens downward from a measurable point', () => {
    const points = [fast(2), fast(4), fast(8), { k: 16, ms: 400 }];
    expect(nextSweepK(points)).toBe(15);
  });

  it('widens upward when everything below is too fast to measure', () => {
    const points = [{ k: 16, ms: 400 }, { k: 15, ms: 0.5 }, { k: 14, ms: 0.2 }];
    expect(nextSweepK(points)).toBe(17);
  });

  it('never probes at or beyond a pump count that timed out', () => {
    const points: TimingPoint[] = [
      { k: 17, ms: 1000, timedOut: true },
      { k: 16, ms: 400 },
      { k: 15, ms: 0.5 },
    ];
    expect(nextSweepK(points)).toBeNull();
  });

  it('stops once there are enough usable points', () => {
    const points = [
      { k: 11, ms: 15 }, { k: 12, ms: 30 }, { k: 13, ms: 60 },
      { k: 14, ms: 120 }, { k: 15, ms: 240 }, { k: 16, ms: 480 },
    ];
    expect(nextSweepK(points)).toBeNull();
  });
});
