import { analyzePassword } from '@/Components/Functions/PasswordStrengthTools/logic';

describe('analyzePassword', () => {
  it('returns null for an empty password', () => {
    expect(analyzePassword('')).toBeNull();
  });

  it('flags a common password', () => {
    expect(analyzePassword('password')?.score).toBe('Weak');
  });

  it('flags a password built out of common fragments', () => {
    const result = analyzePassword('p@$$w0rd12345');
    expect(result?.score).toBe('Weak');
    expect(result?.warnings.join(' ')).toMatch(/Composed of common fragments/);
  });

  it('still scores a long password, without walking every way to split it', () => {
    // The fragment split is cubic in the length. `?from=` puts a password of
    // any length on screen with no interaction, so the split has to be capped:
    // unbounded, a few thousand characters lock the tab up for minutes.
    const started = Date.now();
    const result = analyzePassword('Aa1!'.repeat(5000));
    const elapsed = Date.now() - started;

    expect(result?.length).toBe(20000);
    expect(result?.entropy).toBeGreaterThan(100);
    expect(elapsed).toBeLessThan(500);
  });
});
