import {
  computeTaylor,
  formatTaylor,
  computePartialSum,
  exactValue,
  termValues,
  FUNCTION_META,
  SUPPORTED_FUNCTIONS,
  MAX_TERMS,
} from '@/Components/Functions/TaylorSeriesTools/logic';

describe('computeTaylor', () => {
  it('sin(0) = 0 with any terms', () => {
    const r = computeTaylor('sin', '0');
    expect(r.exact).toBeCloseTo(0);
    expect(r.termResults[0].approximation).toBeCloseTo(0);
  });

  it('cos(0) = 1 exactly', () => {
    const r = computeTaylor('cos', '0');
    expect(r.exact).toBeCloseTo(1);
  });

  it('exp(1) approaches e with more terms', () => {
    const r = computeTaylor('exp', '1');
    expect(r.exact).toBeCloseTo(Math.E, 5);
    // More terms = less error
    const err1 = r.termResults[0].error;
    const err20 = r.termResults[5].error;
    expect(err20).toBeLessThan(err1);
  });

  it('ln1p(0) = 0', () => {
    const r = computeTaylor('ln1p', '0');
    expect(r.exact).toBeCloseTo(0);
  });

  it('geometric series at x=0.5 converges to 2', () => {
    const r = computeTaylor('geometric', '0.5');
    expect(r.exact).toBeCloseTo(2);
    // 20 terms should be very close
    expect(r.termResults[5].approximation).toBeCloseTo(2, 4);
  });

  it('arctan(1) approaches pi/4', () => {
    const r = computeTaylor('arctan', '1');
    expect(r.exact).toBeCloseTo(Math.PI / 4, 5);
  });

  it('throws for unknown function', () => {
    expect(() => computeTaylor('tan', '1')).toThrow();
  });

  it('throws for ln1p at x <= -1', () => {
    expect(() => computeTaylor('ln1p', '-1')).toThrow();
  });

  it('throws for geometric at |x| >= 1', () => {
    expect(() => computeTaylor('geometric', '1')).toThrow();
    expect(() => computeTaylor('geometric', '-1')).toThrow();
  });

  it('throws for non-numeric x', () => {
    expect(() => computeTaylor('sin', 'abc')).toThrow();
  });

  it('returns 6 term counts', () => {
    const r = computeTaylor('sin', '1');
    expect(r.termResults).toHaveLength(6);
  });
});

describe('formatTaylor', () => {
  it('includes exact value in output', () => {
    const out = formatTaylor('cos', '0');
    expect(out).toContain('Exact value');
  });

  it('includes function name', () => {
    const out = formatTaylor('exp', '2');
    expect(out).toContain('exp');
  });
});

describe('computePartialSum', () => {
  it('one term of sin(x) is x itself', () => expect(computePartialSum('sin', 0.5, 1)).toBeCloseTo(0.5, 12));
  it('one term of cos(x) is 1', () => expect(computePartialSum('cos', 2, 1)).toBe(1));
  it('two terms of eˣ is 1 + x', () => expect(computePartialSum('exp', 0.3, 2)).toBeCloseTo(1.3, 12));
  it('sums nothing for zero terms', () => expect(computePartialSum('exp', 5, 0)).toBe(0));
  it('closes on the exact value with 20 terms', () => {
    expect(computePartialSum('sin', 1, 20)).toBeCloseTo(exactValue('sin', 1), 12);
  });
  it('diverges outside the radius of convergence', () => {
    // The arctan series only converges for |x| <= 1.
    expect(Math.abs(computePartialSum('arctan', 2, 20))).toBeGreaterThan(100);
  });
});

describe('termValues', () => {
  it('returns one entry per term', () => expect(termValues('sin', 1, 6)).toHaveLength(6));

  it('running totals match the partial sums', () => {
    for (const t of termValues('exp', 0.7, 8)) {
      expect(t.partial).toBeCloseTo(computePartialSum('exp', 0.7, t.index), 12);
    }
  });

  it('term values add up to the final partial sum', () => {
    const terms = termValues('cos', 1.2, 10);
    const sum = terms.reduce((acc, t) => acc + t.value, 0);
    expect(sum).toBeCloseTo(computePartialSum('cos', 1.2, 10), 12);
  });

  it('alternating series flips sign each term', () => {
    const terms = termValues('sin', 1, 5);
    for (let i = 1; i < terms.length; i++) {
      expect(Math.sign(terms[i].value)).toBe(-Math.sign(terms[i - 1].value));
    }
  });

  it('terms shrink inside the radius of convergence', () => {
    const terms = termValues('geometric', 0.5, 6);
    for (let i = 1; i < terms.length; i++) {
      expect(Math.abs(terms[i].value)).toBeLessThan(Math.abs(terms[i - 1].value));
    }
  });

  it('numbers ln(1+x) terms from 1 even though its first loop pass adds nothing', () => {
    const terms = termValues('ln1p', 0.5, 3);
    expect(terms[0].index).toBe(1);
    expect(terms[0].value).toBe(0);
    expect(terms[1].value).toBeCloseTo(0.5, 12);
  });
});

describe('FUNCTION_META', () => {
  it('describes every supported function', () => {
    for (const f of SUPPORTED_FUNCTIONS) expect(FUNCTION_META[f.value].label).toBe(f.label);
  });
  it('plot domains are ordered low to high', () => {
    for (const f of SUPPORTED_FUNCTIONS) {
      const [lo, hi] = FUNCTION_META[f.value].domain;
      expect(lo).toBeLessThan(hi);
    }
  });
  it('keeps every plotted x inside the function domain', () => {
    for (const f of SUPPORTED_FUNCTIONS) {
      const [lo, hi] = FUNCTION_META[f.value].domain;
      for (const x of [lo, (lo + hi) / 2, hi]) {
        expect(isFinite(exactValue(f.value, x))).toBe(true);
      }
    }
  });
  it('caps the term slider at the documented maximum', () => expect(MAX_TERMS).toBe(20));
});
