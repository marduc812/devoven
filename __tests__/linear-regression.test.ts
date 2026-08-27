import {
  parsePairs,
  computeRegression,
  formatPrediction,
  processLinearRegression,
} from '../Components/Functions/LinearRegressionTools/logic';

describe('parsePairs', () => {
  it('parses comma-separated pairs', () => {
    const { xs, ys } = parsePairs('1,2\n3,4\n5,6');
    expect(xs).toEqual([1, 3, 5]);
    expect(ys).toEqual([2, 4, 6]);
  });

  it('parses tab-separated pairs', () => {
    const { xs, ys } = parsePairs('1\t2\n3\t4');
    expect(xs).toEqual([1, 3]);
    expect(ys).toEqual([2, 4]);
  });

  it('throws on fewer than 2 pairs', () => {
    expect(() => parsePairs('1,2')).toThrow();
  });

  it('throws on non-numeric values', () => {
    expect(() => parsePairs('a,b\n1,2')).toThrow();
  });

  it('ignores empty lines', () => {
    const { xs, ys } = parsePairs('\n1,2\n\n3,4\n');
    expect(xs.length).toBe(2);
    expect(ys.length).toBe(2);
  });
});

describe('computeRegression', () => {
  it('computes correct slope and intercept for y=2x+1', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [3, 5, 7, 9, 11];
    const r = computeRegression(xs, ys);
    expect(r.slope).toBeCloseTo(2, 5);
    expect(r.intercept).toBeCloseTo(1, 5);
    expect(r.rSquared).toBeCloseTo(1, 5);
  });

  it('has R²=1 for perfect linear relationship', () => {
    const xs = [0, 1, 2, 3];
    const ys = [0, 3, 6, 9];
    const r = computeRegression(xs, ys);
    expect(r.rSquared).toBeCloseTo(1, 5);
  });

  it('has R²=0 for constant Y', () => {
    const xs = [1, 2, 3, 4];
    const ys = [5, 5, 5, 5];
    const r = computeRegression(xs, ys);
    expect(r.rSquared).toBeCloseTo(0, 5);
  });

  it('computes residuals correctly', () => {
    const xs = [1, 2];
    const ys = [1, 3];
    const r = computeRegression(xs, ys);
    expect(r.residuals.length).toBe(2);
    // slope=2, intercept=-1, predicted(1)=1, predicted(2)=3
    expect(r.residuals[0].residual).toBeCloseTo(0, 5);
    expect(r.residuals[1].residual).toBeCloseTo(0, 5);
  });
});

describe('formatPrediction', () => {
  it('formats a prediction line', () => {
    const xs = [1, 2, 3];
    const ys = [2, 4, 6];
    const r = computeRegression(xs, ys);
    const pred = formatPrediction(r, 5);
    expect(pred).toContain('Y =');
    expect(pred).toContain('10');
  });
});

describe('processLinearRegression', () => {
  it('returns output for valid input', () => {
    const input = '1,2\n2,4\n3,6\n4,8';
    const result = processLinearRegression(input);
    expect(result).toContain('Slope');
    expect(result).toContain('Y-Intercept');
    expect(result).toContain('R²');
    expect(result).toContain('Residuals Table');
  });

  it('handles predict: line', () => {
    const input = '1,2\n2,4\n3,6\npredict: 10';
    const result = processLinearRegression(input);
    expect(result).toContain('Prediction');
    expect(result).toContain('20');
  });

  it('throws on insufficient data', () => {
    expect(() => processLinearRegression('1,2')).toThrow();
  });
});
