import {
  parseInput,
  computeContinuedFraction,
  computeConvergents,
  formatNotation,
  computeContinuedFractionResult,
} from '@/Components/Functions/ContinuedFractionTools/logic';

describe('parseInput', () => {
  it('parses decimal', () => {
    expect(parseInput('3.14159')).toBeCloseTo(3.14159);
  });
  it('parses fraction', () => {
    expect(parseInput('22/7')).toBeCloseTo(22 / 7);
  });
  it('parses negative fraction', () => {
    expect(parseInput('-1/4')).toBeCloseTo(-0.25);
  });
  it('throws on zero denominator', () => {
    expect(() => parseInput('1/0')).toThrow();
  });
  it('throws on invalid input', () => {
    expect(() => parseInput('abc')).toThrow();
  });
});

describe('computeContinuedFraction', () => {
  it('computes CF for integer', () => {
    expect(computeContinuedFraction(3, 10)).toEqual([3]);
  });
  it('computes CF for 1/2', () => {
    const coeffs = computeContinuedFraction(0.5, 10);
    expect(coeffs[0]).toBe(0);
    expect(coeffs[1]).toBe(2);
  });
  it('computes CF for phi (golden ratio)', () => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const coeffs = computeContinuedFraction(phi, 10);
    expect(coeffs[0]).toBe(1);
    // all subsequent terms should be 1
    for (let i = 1; i < Math.min(coeffs.length, 8); i++) {
      expect(coeffs[i]).toBe(1);
    }
  });
  it('computes CF for 22/7', () => {
    const coeffs = computeContinuedFraction(22 / 7, 10);
    expect(coeffs[0]).toBe(3);
    expect(coeffs[1]).toBe(7);
  });
});

describe('formatNotation', () => {
  it('formats single term', () => {
    expect(formatNotation([3])).toBe('[3]');
  });
  it('formats multiple terms', () => {
    expect(formatNotation([3, 7, 15])).toBe('[3; 7, 15]');
  });
  it('handles empty', () => {
    expect(formatNotation([])).toBe('[]');
  });
});

describe('computeConvergents', () => {
  it('returns convergents for 22/7', () => {
    const coeffs = [3, 7];
    const cvs = computeConvergents(coeffs, 22 / 7);
    expect(cvs.length).toBe(2);
    expect(cvs[1].p).toBe(22);
    expect(cvs[1].q).toBe(7);
  });
});

describe('computeContinuedFractionResult', () => {
  it('returns empty string for empty input', () => {
    expect(computeContinuedFractionResult('')).toBe('');
  });
  it('includes CF notation in output', () => {
    const result = computeContinuedFractionResult('22/7');
    expect(result).toContain('[3');
    expect(result).toContain('Convergents');
  });
  it('includes famous constants reference', () => {
    const result = computeContinuedFractionResult('3.14159');
    expect(result).toContain('Famous Constants');
    expect(result).toContain('pi');
  });
});
