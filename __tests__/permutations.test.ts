import {
  logFactorial,
  logPermutation,
  logCombination,
  listCombinations,
  calculatePermComb,
  analyzePermComb,
  factorialBig,
  permutationsBig,
  combinationsBig,
  tuplesBig,
  multisetsBig,
  formatBig,
  listCombinationsOf,
  listPermutationsOf,
  parsePermCombInput,
} from '@/Components/Functions/PermutationsTools/logic';

describe('logFactorial', () => {
  it('log10(0!) = 0', () => expect(logFactorial(0)).toBeCloseTo(0));
  it('log10(1!) = 0', () => expect(logFactorial(1)).toBeCloseTo(0));
  it('log10(10!) ≈ 6.559', () => expect(logFactorial(10)).toBeCloseTo(6.5598, 3));
  it('throws for negative', () => expect(() => logFactorial(-1)).toThrow());
});

describe('logPermutation', () => {
  it('P(5,2) = 20', () => {
    const val = Math.round(Math.pow(10, logPermutation(5, 2)));
    expect(val).toBe(20);
  });
  it('P(10,3) = 720', () => {
    const val = Math.round(Math.pow(10, logPermutation(10, 3)));
    expect(val).toBe(720);
  });
  it('P(n,0) = 1', () => {
    const val = Math.round(Math.pow(10, logPermutation(5, 0)));
    expect(val).toBe(1);
  });
  it('returns -Infinity when r > n', () => {
    expect(logPermutation(3, 5)).toBe(-Infinity);
  });
});

describe('logCombination', () => {
  it('C(5,2) = 10', () => {
    const val = Math.round(Math.pow(10, logCombination(5, 2)));
    expect(val).toBe(10);
  });
  it('C(10,3) = 120', () => {
    const val = Math.round(Math.pow(10, logCombination(10, 3)));
    expect(val).toBe(120);
  });
  it('C(n,0) = 1', () => {
    const val = Math.round(Math.pow(10, logCombination(5, 0)));
    expect(val).toBe(1);
  });
  it('C(n,n) = 1', () => {
    const val = Math.round(Math.pow(10, logCombination(5, 5)));
    expect(val).toBe(1);
  });
});

describe('listCombinations', () => {
  it('C(4,2) has 6 combinations', () => {
    expect(listCombinations(4, 2)).toHaveLength(6);
  });
  it('returns empty for large n', () => {
    expect(listCombinations(11, 2)).toHaveLength(0);
  });
  it('each combination has correct length', () => {
    const combos = listCombinations(5, 3);
    expect(combos.every(c => c.length === 3)).toBe(true);
  });
});

describe('calculatePermComb', () => {
  it('throws on single input', () => {
    expect(() => calculatePermComb('5')).toThrow();
  });
  it('throws when r > n', () => {
    expect(() => calculatePermComb('3 5')).toThrow();
  });
  it('throws on negative values', () => {
    expect(() => calculatePermComb('-1 2')).toThrow();
  });

  it('produces correct output for 5,2', () => {
    const result = calculatePermComb('5 2');
    expect(result).toContain('P(5, 2) = 20');
    expect(result).toContain('C(5, 2) = 10');
  });

  it('lists combinations for small input', () => {
    const result = calculatePermComb('4 2');
    expect(result).toContain('{1, 2}');
  });
});

describe('exact arithmetic', () => {
  it('permutationsBig matches the small known values', () => {
    expect(permutationsBig(5, 2)).toBe(BigInt('20'));
    expect(permutationsBig(10, 3)).toBe(BigInt('720'));
    expect(permutationsBig(5, 0)).toBe(BigInt('1'));
    expect(permutationsBig(5, 5)).toBe(BigInt('120'));
  });

  it('combinationsBig matches the small known values', () => {
    expect(combinationsBig(5, 2)).toBe(BigInt('10'));
    expect(combinationsBig(10, 3)).toBe(BigInt('120'));
    expect(combinationsBig(5, 0)).toBe(BigInt('1'));
    expect(combinationsBig(5, 5)).toBe(BigInt('1'));
    expect(combinationsBig(52, 5)).toBe(BigInt('2598960'));
    expect(combinationsBig(49, 6)).toBe(BigInt('13983816'));
  });

  it('returns 0 when r > n', () => {
    expect(permutationsBig(3, 5)).toBe(BigInt('0'));
    expect(combinationsBig(3, 5)).toBe(BigInt('0'));
  });

  it('is exact where the log-based helpers are not', () => {
    // Math.round(10 ** logCombination(50, 25)) gives 126410606437748.
    expect(combinationsBig(50, 25)).toBe(BigInt('126410606437752'));
    expect(combinationsBig(60, 30)).toBe(BigInt('118264581564861424'));
  });

  it('obeys Pascal’s rule for every C(n,k) up to n = 30', () => {
    for (let n = 1; n <= 30; n++) {
      for (let k = 1; k < n; k++) {
        expect(combinationsBig(n, k)).toBe(combinationsBig(n - 1, k - 1) + combinationsBig(n - 1, k));
      }
    }
  });

  it('is symmetric: C(n,k) = C(n,n−k)', () => {
    for (let n = 0; n <= 40; n++) {
      for (let k = 0; k <= n; k++) {
        expect(combinationsBig(n, k)).toBe(combinationsBig(n, n - k));
      }
    }
  });

  it('rows of C(n,k) sum to 2^n', () => {
    for (let n = 0; n <= 25; n++) {
      let total = BigInt('0');
      for (let k = 0; k <= n; k++) total += combinationsBig(n, k);
      let twoToTheN = BigInt('1');
      for (let i = 0; i < n; i++) twoToTheN *= BigInt('2');
      expect(total).toBe(twoToTheN);
    }
  });

  it('P(n,r) = C(n,r) * r! for every pair up to n = 25', () => {
    for (let n = 0; n <= 25; n++) {
      for (let r = 0; r <= n; r++) {
        expect(permutationsBig(n, r)).toBe(combinationsBig(n, r) * factorialBig(r));
      }
    }
  });

  it('handles n = 1000 without overflowing', () => {
    expect(factorialBig(1000).toString()).toHaveLength(2568);
    expect(combinationsBig(1000, 500).toString()).toHaveLength(300);
  });

  it('tuplesBig is n to the r', () => {
    expect(tuplesBig(10, 4)).toBe(BigInt('10000'));
    expect(tuplesBig(2, 10)).toBe(BigInt('1024'));
    expect(tuplesBig(5, 0)).toBe(BigInt('1'));
  });

  it('multisetsBig counts selections with repetition', () => {
    // 3 scoops from 5 flavours, repeats allowed = C(7,3) = 35
    expect(multisetsBig(5, 3)).toBe(BigInt('35'));
    expect(multisetsBig(5, 0)).toBe(BigInt('1'));
    expect(multisetsBig(0, 3)).toBe(BigInt('0'));
    // Unlike the no-repetition cases this stays positive when r > n.
    expect(multisetsBig(3, 5)).toBe(BigInt('21'));
  });
});

describe('formatBig', () => {
  it('groups short values in threes', () => {
    expect(formatBig(BigInt('2598960')).exact).toBe('2 598 960');
  });
  it('gives scientific notation past the exact limit', () => {
    const d = formatBig(factorialBig(100));
    expect(d.exact).toBeNull();
    expect(d.digits).toBe(158);
    expect(d.approx).toMatch(/^9\.3326 × 10\^157$/);
  });
  it('always keeps the full digits for copying', () => {
    expect(formatBig(BigInt('126410606437752')).raw).toBe('126410606437752');
  });
});

describe('listing helpers', () => {
  it('lists C(4,2) in lexicographic order', () => {
    expect(listCombinationsOf(4, 2, 100)).toEqual([
      [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4],
    ]);
  });
  it('lists P(3,2) including both orders of each pair', () => {
    expect(listPermutationsOf(3, 2, 100)).toEqual([
      [1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2],
    ]);
  });
  it('respects the limit', () => {
    expect(listCombinationsOf(20, 3, 7)).toHaveLength(7);
    expect(listPermutationsOf(20, 3, 7)).toHaveLength(7);
  });
  it('returns nothing when r > n', () => {
    expect(listCombinationsOf(3, 5, 100)).toEqual([]);
    expect(listPermutationsOf(3, 5, 100)).toEqual([]);
  });
  it('counts agree with the closed forms', () => {
    for (let n = 0; n <= 7; n++) {
      for (let r = 0; r <= n; r++) {
        expect(BigInt(listCombinationsOf(n, r, 100000).length)).toBe(combinationsBig(n, r));
        expect(BigInt(listPermutationsOf(n, r, 100000).length)).toBe(permutationsBig(n, r));
      }
    }
  });
});

describe('parsePermCombInput', () => {
  it('accepts a whole number', () => expect(parsePermCombInput(' 12 ')).toBe(12));
  it('rejects a decimal', () => expect(() => parsePermCombInput('1.5')).toThrow());
  it('rejects trailing junk that parseInt would have swallowed', () => {
    expect(() => parsePermCombInput('10abc')).toThrow();
  });
  it('rejects an empty field', () => expect(() => parsePermCombInput('')).toThrow());
});

describe('analyzePermComb', () => {
  it('returns all four counting cases', () => {
    const r = analyzePermComb(5, 3);
    expect(r.cases.map(c => c.key)).toEqual(['permutations', 'combinations', 'tuples', 'multisets']);
    expect(r.cases.map(c => c.value)).toEqual([BigInt('60'), BigInt('10'), BigInt('125'), BigInt('35')]);
  });

  it('exposes the factorials behind the formulas', () => {
    const r = analyzePermComb(10, 3);
    expect(r.factorials.n.raw).toBe(factorialBig(10).toString());
    expect(r.factorials.r.raw).toBe('6');
    expect(r.factorials.nMinusR!.raw).toBe(factorialBig(7).toString());
  });

  it('reports r > n rather than throwing, and drops (n−r)!', () => {
    const r = analyzePermComb(3, 5);
    expect(r.notes).toHaveLength(1);
    expect(r.factorials.nMinusR).toBeNull();
    expect(r.cases.find(c => c.key === 'permutations')!.value).toBe(BigInt('0'));
    expect(r.cases.find(c => c.key === 'multisets')!.value).toBe(BigInt('21'));
  });

  it('builds the C(n,k) distribution for small n only', () => {
    expect(analyzePermComb(10, 3).distribution).toHaveLength(11);
    expect(analyzePermComb(100, 3).distribution).toBeNull();
  });

  it('lists selections when there are few, and not when there are many', () => {
    const small = analyzePermComb(5, 2);
    expect(small.listing!.combinations).toHaveLength(10);
    expect(small.listing!.truncated).toBe(false);
    expect(analyzePermComb(52, 5).listing).toBeNull();
  });

  it('marks a listing truncated when it hit the cap', () => {
    // C(10,5) = 252 selections, over the 120-item display cap.
    const r = analyzePermComb(10, 5);
    expect(r.listing!.truncated).toBe(true);
    expect(r.listing!.combinations).toHaveLength(120);
  });

  it('rejects out-of-range input', () => {
    expect(() => analyzePermComb(-1, 2)).toThrow();
    expect(() => analyzePermComb(2, -1)).toThrow();
    expect(() => analyzePermComb(1001, 2)).toThrow();
    expect(() => analyzePermComb(2, 1001)).toThrow();
  });

  it('handles n = r = 0', () => {
    const r = analyzePermComb(0, 0);
    expect(r.cases.map(c => c.value)).toEqual([BigInt('1'), BigInt('1'), BigInt('1'), BigInt('1')]);
  });
});
