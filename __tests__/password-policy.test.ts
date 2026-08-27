import {
  checkPolicy,
  DEFAULT_RULES,
} from '@/Components/Functions/PasswordPolicyTools/logic';

describe('DEFAULT_RULES', () => {
  it('has at least 9 rules', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThanOrEqual(9);
  });

  it('each rule has id, label and check function', () => {
    for (const rule of DEFAULT_RULES) {
      expect(typeof rule.id).toBe('string');
      expect(typeof rule.label).toBe('string');
      expect(typeof rule.check).toBe('function');
    }
  });
});

describe('checkPolicy', () => {
  it('strong password passes most rules', () => {
    const result = checkPolicy('MyS3cur3P@ssw0rd!');
    expect(result.passed.length).toBeGreaterThan(result.failed.length);
    expect(result.score).toBeGreaterThan(50);
  });

  it('empty string fails all rules', () => {
    const result = checkPolicy('');
    expect(result.failed.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(50);
  });

  it('simple short password is weak', () => {
    const result = checkPolicy('abc');
    expect(result.strength).toMatch(/Weak|Very Weak/);
  });

  it('password with uppercase and special chars scores higher', () => {
    const r1 = checkPolicy('abc');
    const r2 = checkPolicy('Abc!1234567890');
    expect(r2.score).toBeGreaterThan(r1.score);
  });

  it('password with spaces fails no_space rule', () => {
    const result = checkPolicy('my password');
    expect(result.failed.some(f => f.includes('space'))).toBe(true);
  });

  it('password with repeated chars fails no_repeat rule', () => {
    const result = checkPolicy('aaa password');
    expect(result.failed.some(f => f.includes('repeated'))).toBe(true);
  });

  it('password with sequential digits fails no_sequential rule', () => {
    const result = checkPolicy('abc123def');
    expect(result.failed.some(f => f.includes('sequential'))).toBe(true);
  });

  it('very strong password is rated Very Strong or Strong', () => {
    const result = checkPolicy('X#9mKp@2qR!vN5z');
    expect(result.strength).toMatch(/Strong/);
  });

  it('returns correct strength label', () => {
    const result = checkPolicy('weak');
    expect(['Very Strong', 'Strong', 'Moderate', 'Weak', 'Very Weak']).toContain(result.strength);
  });
});
