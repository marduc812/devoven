import { analyzeFloat } from '@/Components/Functions/FloatAnalyzerTools/logic';

describe('analyzeFloat', () => {
  it('returns null for empty string', () => expect(analyzeFloat('')).toBeNull());
  it('returns null for invalid input', () => expect(analyzeFloat('abc')).toBeNull());

  it('analyzes 0', () => {
    const r = analyzeFloat('0');
    expect(r).not.toBeNull();
    expect(r!.single.sign).toBe(0);
    expect(r!.single.storedExponent).toBe(0);
    expect(r!.double.sign).toBe(0);
  });

  it('analyzes positive number 1.0', () => {
    const r = analyzeFloat('1');
    expect(r).not.toBeNull();
    expect(r!.single.sign).toBe(0);
    expect(r!.single.unbiasedExponent).toBe(0);
    expect(r!.single.storedExponent).toBe(127);
    expect(r!.double.storedExponent).toBe(1023);
  });

  it('analyzes negative number -1.0', () => {
    const r = analyzeFloat('-1');
    expect(r).not.toBeNull();
    expect(r!.single.sign).toBe(1);
    expect(r!.double.sign).toBe(1);
  });

  it('detects NaN', () => {
    const r = analyzeFloat('NaN');
    expect(r).not.toBeNull();
    expect(r!.isNaN).toBe(true);
    expect(r!.single.specialName).toBe('NaN');
  });

  it('detects Infinity', () => {
    const r = analyzeFloat('Infinity');
    expect(r).not.toBeNull();
    expect(r!.isInfinity).toBe(true);
    expect(r!.single.specialName).toBe('+Infinity');
  });

  it('detects -Infinity', () => {
    const r = analyzeFloat('-Infinity');
    expect(r).not.toBeNull();
    expect(r!.single.specialName).toBe('-Infinity');
  });

  it('single precision fullBinary has 32 bits plus separators', () => {
    const r = analyzeFloat('2.5');
    expect(r).not.toBeNull();
    // format: "S EEEEEEEE MMMMMMMMMMMMMMMMMMMMMMM" = 1 + 1 + 8 + 1 + 23 = 34 chars
    const full = r!.single.fullBinary;
    const bits = full.replace(/\s/g, '');
    expect(bits.length).toBe(32);
  });

  it('double precision fullBinary has 64 bits', () => {
    const r = analyzeFloat('2.5');
    const full = r!.double.fullBinary;
    const bits = full.replace(/\s/g, '');
    expect(bits.length).toBe(64);
  });

  it('exponent of 2.0 is 1 (single)', () => {
    const r = analyzeFloat('2');
    expect(r!.single.unbiasedExponent).toBe(1);
    expect(r!.single.storedExponent).toBe(128);
  });
});
