import { gcd, modInverse, affineEncrypt, affineDecrypt, processAffine } from '@/Components/Functions/AffineCipherTools/logic';

describe('gcd', () => {
  it('gcd(5, 26) = 1', () => expect(gcd(5, 26)).toBe(1));
  it('gcd(4, 26) = 2', () => expect(gcd(4, 26)).toBe(2));
  it('gcd(1, 26) = 1', () => expect(gcd(1, 26)).toBe(1));
});

describe('modInverse', () => {
  it('5 * 21 mod 26 = 1', () => expect(modInverse(5, 26)).toBe(21));
  it('7 * 15 mod 26 = 1', () => expect(modInverse(7, 26)).toBe(15));
  it('throws for non-coprime', () => expect(() => modInverse(4, 26)).toThrow());
});

describe('affineEncrypt / affineDecrypt', () => {
  it('encrypts HELLO with a=5 b=8', () => {
    expect(affineEncrypt('HELLO', 5, 8)).toBe('RCLLA');
  });
  it('decrypts back to original', () => {
    const enc = affineEncrypt('HELLO', 5, 8);
    expect(affineDecrypt(enc, 5, 8)).toBe('HELLO');
  });
  it('preserves case', () => {
    const enc = affineEncrypt('Hello', 5, 8);
    expect(enc[0]).toBe('R');
    expect(enc[1]).toBe('c');
  });
  it('preserves non-alpha', () => {
    expect(affineEncrypt('A!B', 5, 8)).toContain('!');
  });
  it('throws for invalid a', () => {
    expect(() => affineEncrypt('test', 4, 8)).toThrow();
  });
  it('identity with a=1 b=0', () => {
    expect(affineEncrypt('ABC', 1, 0)).toBe('ABC');
  });
});

describe('processAffine', () => {
  it('encrypt mode returns result and steps', () => {
    const r = processAffine('Hello', 5, 8, 'encrypt');
    expect(r).toContain('---');
    expect(r).toContain('Step-by-step');
  });
  it('returns empty for empty input', () => {
    expect(processAffine('', 5, 8, 'encrypt')).toBe('');
  });
});
