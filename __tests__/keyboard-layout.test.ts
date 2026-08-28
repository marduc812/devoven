import { analyzeLayout, LAYOUTS, LAYOUT_ROWS, letterFrequency, scoreLayout, bestLayout } from '@/Components/Functions/KeyboardLayoutTools/logic';

describe('LAYOUT_ROWS', () => {
  it('covers every layout in LAYOUTS', () => {
    expect(Object.keys(LAYOUT_ROWS).sort()).toEqual(Object.keys(LAYOUTS).sort());
  });

  it('has three rows per layout', () => {
    for (const rows of Object.values(LAYOUT_ROWS)) expect(rows).toHaveLength(3);
  });

  it('every drawn key exists in that layout\'s finger map', () => {
    for (const [name, rows] of Object.entries(LAYOUT_ROWS)) {
      for (const row of rows) {
        for (const key of [...row.left, ...row.right]) {
          if (key === '') continue;
          expect(LAYOUTS[name][key]).toBeDefined();
        }
      }
    }
  });

  it('places 26 letters for QWERTY', () => {
    const keys = LAYOUT_ROWS.QWERTY.flatMap(r => [...r.left, ...r.right]).filter(k => k !== '');
    expect(new Set(keys).size).toBe(26);
  });
});

describe('letterFrequency', () => {
  it('counts letters case-insensitively', () => expect(letterFrequency('aAb')).toEqual({ a: 2, b: 1 }));
  it('ignores non-letters', () => expect(letterFrequency('a1 b!')).toEqual({ a: 1, b: 1 }));
  it('returns an empty map for no letters', () => expect(letterFrequency('123 !!')).toEqual({}));
});

describe('scoreLayout / bestLayout', () => {
  it('rewards home row and alternation, penalises SFBs', () => {
    const a = analyzeLayout('the quick brown fox', 'QWERTY');
    expect(scoreLayout(a)).toBe(a.homeRowPercent - a.sfbCount + a.handAlternationRate);
  });

  it('picks the highest-scoring layout', () => {
    const analyses = Object.keys(LAYOUTS).map(n => analyzeLayout('the quick brown fox', n));
    const best = bestLayout(analyses);
    for (const a of analyses) expect(scoreLayout(best)).toBeGreaterThanOrEqual(scoreLayout(a));
  });

  it('throws when given no layouts', () => expect(() => bestLayout([])).toThrow());
});

describe('analyzeLayout', () => {
  it('returns zero values for empty-after-filtering text', () => {
    const result = analyzeLayout('123 !@#', 'QWERTY');
    expect(result.totalChars).toBe(0);
    expect(result.homeRowPercent).toBe(0);
  });

  it('counts home row keys correctly for QWERTY', () => {
    // "asdfjkl" are all QWERTY home row keys
    const result = analyzeLayout('asdfjkl', 'QWERTY');
    expect(result.homeRowPercent).toBe(100);
  });

  it('counts SFBs correctly', () => {
    // "ff" — same finger (both index left in QWERTY), should be 1 SFB
    const result = analyzeLayout('ff', 'QWERTY');
    expect(result.sfbCount).toBe(1);
  });

  it('counts hand alternation', () => {
    // "af" = left, left — no alternation; "ak" = left, right — 1 alternation
    const r = analyzeLayout('ak', 'QWERTY');
    expect(r.handAlternationRate).toBe(100);
  });

  it('works for Dvorak layout', () => {
    const result = analyzeLayout('hello', 'Dvorak');
    expect(result.layout).toBe('Dvorak');
    expect(result.totalChars).toBeGreaterThan(0);
  });

  it('works for Colemak layout', () => {
    const result = analyzeLayout('hello', 'Colemak');
    expect(result.layout).toBe('Colemak');
    expect(result.totalChars).toBeGreaterThan(0);
  });

  it('throws for unknown layout', () => {
    expect(() => analyzeLayout('test', 'AZERTY')).toThrow();
  });

  it('finger distribution sums roughly match totalChars', () => {
    const result = analyzeLayout('the quick brown fox', 'QWERTY');
    const total = Object.values(result.fingerDistribution.left).reduce((a, b) => a + b, 0)
      + Object.values(result.fingerDistribution.right).reduce((a, b) => a + b, 0);
    expect(total).toBe(result.totalChars);
  });
});

describe('LAYOUTS', () => {
  it('has 3 layouts', () => {
    expect(Object.keys(LAYOUTS).length).toBe(3);
  });

  it('each layout has keys a and e', () => {
    for (const name of Object.keys(LAYOUTS)) {
      expect(LAYOUTS[name]['a']).toBeDefined();
      expect(LAYOUTS[name]['e']).toBeDefined();
    }
  });
});
