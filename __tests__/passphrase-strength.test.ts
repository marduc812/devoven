import { evaluatePassphrase, formatPassphraseResult } from '@/Components/Functions/PassphraseStrengthTools/logic';

describe('evaluatePassphrase', () => {
  it('rates a simple password as weak', () => {
    const result = evaluatePassphrase('abc');
    expect(['Very Weak', 'Weak']).toContain(result.strength);
    expect(result.entropy).toBeGreaterThan(0);
  });

  it('rates a strong passphrase as Strong or better', () => {
    const result = evaluatePassphrase('Horse Battery Staple Correct!9');
    expect(['Strong', 'Very Strong', 'Exceptional']).toContain(result.strength);
  });

  it('detects length', () => {
    const result = evaluatePassphrase('MyP@ssw0rd!');
    expect(result.length).toBe(11);
  });

  it('calculates entropy > 0', () => {
    const result = evaluatePassphrase('password123');
    expect(result.entropy).toBeGreaterThan(0);
  });

  it('longer password has more entropy', () => {
    const short = evaluatePassphrase('abc');
    const long = evaluatePassphrase('abcdefghijklmnopqrstuvwxyz');
    expect(long.entropy).toBeGreaterThan(short.entropy);
  });

  it('password with special chars has larger charset', () => {
    const plain = evaluatePassphrase('password');
    const special = evaluatePassphrase('p@ssw0rd!');
    expect(special.charsetSize).toBeGreaterThan(plain.charsetSize);
  });

  it('returns 4 policy entries', () => {
    const result = evaluatePassphrase('TestPass1!');
    expect(result.policies.length).toBe(4);
  });

  it('policy names include NIST, PCI, HIPAA, OWASP', () => {
    const result = evaluatePassphrase('TestPass1!');
    const names = result.policies.map(p => p.name);
    expect(names.some(n => n.includes('NIST'))).toBe(true);
    expect(names.some(n => n.includes('PCI'))).toBe(true);
    expect(names.some(n => n.includes('HIPAA'))).toBe(true);
    expect(names.some(n => n.includes('OWASP'))).toBe(true);
  });

  it('5 crack time estimates', () => {
    const result = evaluatePassphrase('SomePassword1!');
    expect(result.crackTimes.length).toBe(5);
  });

  it('crack time is "Instantly" for trivial password', () => {
    const result = evaluatePassphrase('a');
    // Very low entropy — should crack instantly at GPU speeds
    const gpuTime = result.crackTimes.find(ct => ct.attackSpeed.includes('GPU'));
    expect(gpuTime).toBeDefined();
    expect(gpuTime!.timeToCrack).toBe('Instantly');
  });

  it('detects common passwords', () => {
    const result = evaluatePassphrase('password123');
    const nist = result.policies.find(p => p.name.includes('NIST'));
    expect(nist).toBeDefined();
    expect(nist!.failedRequirements.some(r => r.includes('common'))).toBe(true);
  });

  it('strengthScore is between 0 and 100', () => {
    const result = evaluatePassphrase('Test123!');
    expect(result.strengthScore).toBeGreaterThanOrEqual(0);
    expect(result.strengthScore).toBeLessThanOrEqual(100);
  });

  it('suggestions array is non-null', () => {
    const result = evaluatePassphrase('weak');
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe('formatPassphraseResult', () => {
  it('includes strength in output', () => {
    const result = evaluatePassphrase('TestPass1!');
    const output = formatPassphraseResult(result);
    expect(output).toContain('Strength:');
  });

  it('includes entropy', () => {
    const result = evaluatePassphrase('TestPass1!');
    const output = formatPassphraseResult(result);
    expect(output).toContain('Entropy:');
  });

  it('includes crack time section', () => {
    const result = evaluatePassphrase('TestPass1!');
    const output = formatPassphraseResult(result);
    expect(output).toContain('Crack time');
  });

  it('includes policy compliance section', () => {
    const result = evaluatePassphrase('TestPass1!');
    const output = formatPassphraseResult(result);
    expect(output).toContain('Policy');
  });

  it('checkmarks for met policies', () => {
    const result = evaluatePassphrase('VeryLongP@ssword123ExtraSecure!');
    const output = formatPassphraseResult(result);
    expect(output).toContain('✓');
  });
});
