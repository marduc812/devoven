import { evaluate, evaluateInput } from '@/Components/Functions/MathEvalTools/logic';
describe('evaluate', () => {
  it('adds', () => expect(evaluate('2+3')).toBe(5));
  it('subtracts', () => expect(evaluate('10-3')).toBe(7));
  it('multiplies', () => expect(evaluate('4*5')).toBe(20));
  it('divides', () => expect(evaluate('10/4')).toBe(2.5));
  it('handles power', () => expect(evaluate('2**10')).toBe(1024));
  it('handles modulo', () => expect(evaluate('10%3')).toBe(1));
  it('respects parentheses', () => expect(evaluate('(2+3)*4')).toBe(20));
  it('handles unary minus', () => expect(evaluate('-5+10')).toBe(5));
  it('uses pi constant', () => expect(evaluate('pi')).toBeCloseTo(3.14159265));
  it('evaluates sqrt(16)', () => expect(evaluate('sqrt(16)')).toBe(4));
  it('evaluates abs(-5)', () => expect(evaluate('abs(-5)')).toBe(5));
  it('throws for division by zero', () => expect(() => evaluate('1/0')).toThrow('Division by zero'));
  it('throws for invalid expression', () => expect(() => evaluate('??')).toThrow());
});
describe('evaluateInput', () => {
  it('evaluates multiple lines', () => {
    const r = evaluateInput('2+3\n4*5');
    expect(r).toContain('2+3 = 5');
    expect(r).toContain('4*5 = 20');
  });
  it('shows error for invalid line without crashing', () => {
    const r = evaluateInput('2+2\ninvalid');
    expect(r).toContain('2+2 = 4');
    expect(r).toContain('Error');
  });
});
