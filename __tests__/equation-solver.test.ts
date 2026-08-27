import { solveLinear, solveQuadratic, solveSystem2x2, solveEquation } from '@/Components/Functions/EquationSolverTools/logic';

describe('solveLinear', () => {
  it('2x + 3 = 7 → x = 2', () => {
    const r = solveLinear('2x + 3 = 7');
    expect(r.answer).toContain('x = 2');
  });
  it('x = 5', () => {
    const r = solveLinear('x = 5');
    expect(r.answer).toContain('5');
  });
  it('3x = 9 → x = 3', () => {
    const r = solveLinear('3x = 9');
    expect(r.answer).toContain('x = 3');
  });
  it('throws without =', () => expect(() => solveLinear('2x + 3')).toThrow());
});

describe('solveQuadratic', () => {
  it('x^2 - 5x + 6 = 0 → x=2, x=3', () => {
    const r = solveQuadratic('x^2 - 5x + 6 = 0');
    expect(r.answer).toContain('x');
    expect(r.steps.length).toBeGreaterThan(2);
  });
  it('complex roots', () => {
    const r = solveQuadratic('x^2 + 1 = 0');
    expect(r.answer).toContain('i');
  });
  it('double root', () => {
    const r = solveQuadratic('x^2 - 2x + 1 = 0');
    expect(r.answer.toLowerCase()).toContain('double');
  });
});

describe('solveSystem2x2', () => {
  it('2x + y = 5 and x - y = 1 → x=2, y=1', () => {
    const r = solveSystem2x2('2x + y = 5', 'x - y = 1');
    expect(r.answer).toContain('x = 2');
    expect(r.answer).toContain('y = 1');
  });
  it('singular system', () => {
    const r = solveSystem2x2('x + y = 2', '2x + 2y = 4');
    expect(r.answer.toLowerCase()).toContain('no unique');
  });
});

describe('solveEquation', () => {
  it('returns empty for empty input', () => expect(solveEquation('')).toBe(''));
  it('detects linear', () => expect(solveEquation('x + 1 = 3')).toContain('Linear'));
  it('detects quadratic via ^2', () => expect(solveEquation('x^2 + 2x + 1 = 0')).toContain('Quadratic'));
  it('detects system from two lines', () => {
    expect(solveEquation('x + y = 5\nx - y = 1')).toContain('System');
  });
});
