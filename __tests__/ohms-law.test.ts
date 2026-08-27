import {
  parseElectricalValue,
  parseOhmsInput,
  solveOhmsLaw,
  formatEngineering,
  getResistorColorCode,
  analyzeOhms,
  nearestE24,
  describeBands,
  OHMS_FORMULAS,
  E24_SERIES,
} from '@/Components/Functions/OhmsLawTools/logic';

describe('parseElectricalValue', () => {
  it('parses "12V"', () => expect(parseElectricalValue('12V')).toBeCloseTo(12));
  it('parses "2A"', () => expect(parseElectricalValue('2A')).toBeCloseTo(2));
  it('parses "4.7kΩ"', () => expect(parseElectricalValue('4.7kΩ')).toBeCloseTo(4700));
  it('parses "100R"', () => expect(parseElectricalValue('100R')).toBeCloseTo(100));
  it('parses "2.2k"', () => expect(parseElectricalValue('2.2k')).toBeCloseTo(2200));
  it('parses "500mA"', () => expect(parseElectricalValue('500mA')).toBeCloseTo(0.5));
  it('parses "1"', () => expect(parseElectricalValue('1')).toBeCloseTo(1));
});

describe('parseOhmsInput', () => {
  it('parses V and I', () => {
    const r = parseOhmsInput('V=12V\nI=2A');
    expect(r.V).toBeCloseTo(12);
    expect(r.I).toBeCloseTo(2);
    expect(r.R).toBeNull();
  });
  it('parses R and P', () => {
    const r = parseOhmsInput('R=100\nP=5');
    expect(r.R).toBeCloseTo(100);
    expect(r.P).toBeCloseTo(5);
  });
  it('ignores comment lines', () => {
    const r = parseOhmsInput('# comment\nV=9');
    expect(r.V).toBeCloseTo(9);
  });
});

describe('solveOhmsLaw', () => {
  it('solves from V and I', () => {
    const r = solveOhmsLaw({ V: 12, I: 2, R: null, P: null });
    expect(r.R).toBeCloseTo(6);
    expect(r.P).toBeCloseTo(24);
  });
  it('solves from V and R', () => {
    const r = solveOhmsLaw({ V: 10, I: null, R: 5, P: null });
    expect(r.I).toBeCloseTo(2);
    expect(r.P).toBeCloseTo(20);
  });
  it('solves from I and R', () => {
    const r = solveOhmsLaw({ V: null, I: 3, R: 4, P: null });
    expect(r.V).toBeCloseTo(12);
    expect(r.P).toBeCloseTo(36);
  });
  it('solves from R and P', () => {
    const r = solveOhmsLaw({ V: null, I: null, R: 4, P: 25 });
    expect(r.V).toBeCloseTo(10);
    expect(r.I).toBeCloseTo(2.5);
  });
  it('throws when fewer than 2 values provided', () => {
    expect(() => solveOhmsLaw({ V: 12, I: null, R: null, P: null })).toThrow();
  });
});

describe('formatEngineering', () => {
  it('formats 1000 Ω as "1 kΩ"', () => {
    expect(formatEngineering(1000, 'Ω')).toContain('k');
  });
  it('formats 0.001 A as mA range', () => {
    expect(formatEngineering(0.001, 'A')).toContain('m');
  });
  it('handles 0', () => {
    expect(formatEngineering(0, 'V')).toBe('0 V');
  });
});

describe('getResistorColorCode', () => {
  it('returns 4 bands for 1000 Ω', () => {
    const bands = getResistorColorCode(1000);
    expect(bands).not.toBeNull();
    expect(bands!.length).toBe(4);
  });
  it('returns null for 0', () => {
    expect(getResistorColorCode(0)).toBeNull();
  });
  it('first two bands for 47Ω are yellow and violet', () => {
    const bands = getResistorColorCode(47);
    expect(bands).not.toBeNull();
    expect(bands![0]).toBe('yellow');
    expect(bands![1]).toBe('violet');
  });
});

describe('parseElectricalValue SI prefixes', () => {
  it('reads M as mega and m as milli', () => {
    expect(parseElectricalValue('1MΩ')).toBeCloseTo(1e6);
    expect(parseElectricalValue('1mΩ')).toBeCloseTo(1e-3);
  });
  it('accepts both micro signs', () => {
    expect(parseElectricalValue('500μA')).toBeCloseTo(500e-6);
    expect(parseElectricalValue('500µA')).toBeCloseTo(500e-6);
    expect(parseElectricalValue('500uA')).toBeCloseTo(500e-6);
  });
  it('reads nano', () => expect(parseElectricalValue('47n')).toBeCloseTo(47e-9));
  it('reads giga in either case', () => {
    expect(parseElectricalValue('2G')).toBeCloseTo(2e9);
    expect(parseElectricalValue('2g')).toBeCloseTo(2e9);
  });
  it('reads kilo in either case', () => {
    expect(parseElectricalValue('2k')).toBeCloseTo(2000);
    expect(parseElectricalValue('2K')).toBeCloseTo(2000);
  });
  it('still reads a spelled-out unit', () => {
    expect(parseElectricalValue('100 ohm')).toBeCloseTo(100);
    expect(parseElectricalValue('1 Mohm')).toBeCloseTo(1e6);
    expect(parseElectricalValue('100 OHM')).toBeCloseTo(100);
  });
  it('rejects nonsense', () => expect(() => parseElectricalValue('abc')).toThrow());
});

describe('nearestE24', () => {
  it('snaps to a preferred value', () => {
    expect(nearestE24(100)!.value).toBeCloseTo(100);
    expect(nearestE24(4700)!.value).toBeCloseTo(4700);
    expect(nearestE24(4600)!.value).toBeCloseTo(4700);
  });
  it('crosses a decade boundary when the neighbour is nearer', () => {
    // 9.6 is closer to 10 (next decade) than to 9.1.
    expect(nearestE24(9.6)!.value).toBeCloseTo(10);
    expect(nearestE24(9.4)!.value).toBeCloseTo(9.1);
  });
  it('reports how far off the exact value is', () => {
    expect(nearestE24(100)!.errorPercent).toBeCloseTo(0);
    expect(nearestE24(4600)!.errorPercent).toBeGreaterThan(0);
  });
  it('returns null for a non-positive or non-finite resistance', () => {
    expect(nearestE24(0)).toBeNull();
    expect(nearestE24(-5)).toBeNull();
    expect(nearestE24(Infinity)).toBeNull();
  });
  it('always picks the nearest value in the series', () => {
    // Brute-force the same answer from a much wider candidate set, so the
    // three-decade window the implementation searches is proved sufficient.
    const allCandidates: number[] = [];
    for (let exp = -3; exp <= 8; exp++) {
      for (const step of E24_SERIES) allCandidates.push(step * Math.pow(10, exp));
    }
    for (let i = 1; i <= 400; i++) {
      const ohms = Math.pow(10, -1 + (i / 400) * 6); // 0.1 Ω up to 100 kΩ, log-spaced
      const brute = allCandidates.reduce((best, c) =>
        Math.abs(c - ohms) < Math.abs(best - ohms) ? c : best
      );
      expect(nearestE24(ohms)!.value).toBeCloseTo(brute, 9);
    }
  });

  it('never lands more than 8% away — the widest E24 gap is 1.3 to 1.5', () => {
    for (let i = 1; i <= 400; i++) {
      const ohms = Math.pow(10, -1 + (i / 400) * 6);
      expect(nearestE24(ohms)!.errorPercent).toBeLessThan(8);
    }
    // The worst case is the midpoint of that gap.
    expect(nearestE24(1.4)!.errorPercent).toBeCloseTo(7.14, 1);
  });
});

describe('describeBands', () => {
  it('labels each band with its role and meaning', () => {
    const bands = describeBands(getResistorColorCode(4700)!);
    expect(bands.map(b => b.role)).toEqual(['1st digit', '2nd digit', 'Multiplier', 'Tolerance']);
    expect(bands[0]).toMatchObject({ color: 'yellow', meaning: '4' });
    expect(bands[1]).toMatchObject({ color: 'violet', meaning: '7' });
    expect(bands[2]).toMatchObject({ color: 'red', meaning: '× 100' });
    expect(bands[3].meaning).toBe('± 5%');
  });
});

describe('analyzeOhms', () => {
  it('marks the given values and names the identity behind each derived one', () => {
    const r = analyzeOhms({ V: 12, I: 2, R: null, P: null });
    const byKey = Object.fromEntries(r.quantities.map(q => [q.key, q]));
    expect(byKey.V.given).toBe(true);
    expect(byKey.I.given).toBe(true);
    expect(byKey.R.given).toBe(false);
    expect(byKey.R.formula).toBe('R = V / I');
    expect(byKey.P.formula).toBe('P = V × I');
    expect(byKey.R.value).toBeCloseTo(6);
    expect(byKey.P.value).toBeCloseTo(24);
  });

  it('names the right identity for each starting pair', () => {
    const formulaFor = (known: Parameters<typeof analyzeOhms>[0], key: string) =>
      analyzeOhms(known).quantities.find(q => q.key === key)!.formula;

    expect(formulaFor({ V: 10, I: null, R: 5, P: null }, 'P')).toBe('P = V² / R');
    expect(formulaFor({ V: 10, I: null, R: null, P: 20 }, 'R')).toBe('R = V² / P');
    expect(formulaFor({ V: null, I: 3, R: 4, P: null }, 'P')).toBe('P = I² × R');
    expect(formulaFor({ V: null, I: 3, R: null, P: 36 }, 'R')).toBe('R = P / I²');
    expect(formulaFor({ V: null, I: null, R: 4, P: 25 }, 'V')).toBe('V = √(P × R)');
    expect(formulaFor({ V: null, I: null, R: 4, P: 25 }, 'I')).toBe('I = √(P / R)');
  });

  it('every named formula is one of the twelve on the wheel', () => {
    const pairs: Parameters<typeof analyzeOhms>[0][] = [
      { V: 12, I: 2, R: null, P: null },
      { V: 10, I: null, R: 5, P: null },
      { V: 10, I: null, R: null, P: 20 },
      { V: null, I: 3, R: 4, P: null },
      { V: null, I: 3, R: null, P: 36 },
      { V: null, I: null, R: 4, P: 25 },
    ];
    for (const known of pairs) {
      for (const q of analyzeOhms(known).quantities) {
        if (q.formula) expect(OHMS_FORMULAS[q.key]).toContain(q.formula);
      }
    }
  });

  it('every starting pair recovers the same circuit', () => {
    const V = 12, I = 2, R = 6, P = 24;
    const pairs: Parameters<typeof analyzeOhms>[0][] = [
      { V, I, R: null, P: null },
      { V, I: null, R, P: null },
      { V, I: null, R: null, P },
      { V: null, I, R, P: null },
      { V: null, I, R: null, P },
      { V: null, I: null, R, P },
    ];
    for (const known of pairs) {
      const r = analyzeOhms(known);
      expect(r.V).toBeCloseTo(V);
      expect(r.I).toBeCloseTo(I);
      expect(r.R).toBeCloseTo(R);
      expect(r.P).toBeCloseTo(P);
      expect(r.notes).toEqual([]);
    }
  });

  it('flags an over-specified input that contradicts itself', () => {
    // V = I × R would need R = 6, not 10.
    const r = analyzeOhms({ V: 12, I: 2, R: 10, P: null });
    expect(r.notes.some(n => n.includes('V = I × R'))).toBe(true);
  });

  it('stays quiet when a third value is consistent', () => {
    expect(analyzeOhms({ V: 12, I: 2, R: 6, P: null }).notes).toEqual([]);
  });

  it('describes the resistor and its nearest E24 part', () => {
    const r = analyzeOhms({ V: null, I: null, R: 4700, P: 1 });
    expect(r.bands!.map(b => b.color)).toEqual(['yellow', 'violet', 'red', 'gold']);
    expect(r.e24!.value).toBeCloseTo(4700);
  });

  it('has no bands when the resistance is out of range', () => {
    const r = analyzeOhms({ V: 1, I: 1e-12, R: null, P: null });
    expect(r.bands).toBeNull();
  });

  it('reports a non-finite result rather than printing Infinity', () => {
    const r = analyzeOhms({ V: 12, I: 0, R: null, P: null });
    expect(r.notes.some(n => n.includes('Resistance'))).toBe(true);
  });

  it('throws when fewer than two values are known', () => {
    expect(() => analyzeOhms({ V: 12, I: null, R: null, P: null })).toThrow();
  });
});
