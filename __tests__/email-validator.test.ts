import {
  validateEmail,
  formatEmailInfo,
} from '@/Components/Functions/EmailValidatorTools/logic';

// ─── validateEmail happy paths ────────────────────────────────────────────────

describe('validateEmail - valid emails', () => {
  it('validates a simple email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.local).toBe('user');
    expect(result.domain).toBe('example.com');
    expect(result.tld).toBe('com');
  });

  it('validates email with plus sign', () => {
    const result = validateEmail('user+tag@domain.org');
    expect(result.valid).toBe(true);
    expect(result.local).toBe('user+tag');
  });

  it('validates email with subdomain', () => {
    const result = validateEmail('test@mail.example.co.uk');
    expect(result.valid).toBe(true);
  });

  it('lowercases the email', () => {
    const result = validateEmail('User@Example.COM');
    expect(result.email).toBe('user@example.com');
  });

  it('trims whitespace', () => {
    const result = validateEmail('  user@example.com  ');
    expect(result.valid).toBe(true);
  });
});

// ─── validateEmail edge cases / invalid ──────────────────────────────────────

describe('validateEmail - invalid emails', () => {
  it('returns invalid for empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.issues).toBeDefined();
  });

  it('returns invalid for missing @', () => {
    const result = validateEmail('nodomain.com');
    expect(result.valid).toBe(false);
    expect(result.issues?.some(i => i.includes('@'))).toBe(true);
  });

  it('returns invalid for missing local part', () => {
    const result = validateEmail('@domain.com');
    expect(result.valid).toBe(false);
  });

  it('returns invalid when local part starts with dot', () => {
    const result = validateEmail('.user@example.com');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for consecutive dots in local', () => {
    const result = validateEmail('us..er@example.com');
    expect(result.valid).toBe(false);
  });

  it('detects disposable domain', () => {
    const result = validateEmail('test@mailinator.com');
    expect(result.isDisposable).toBe(true);
  });

  it('marks non-disposable domain as not disposable', () => {
    const result = validateEmail('test@gmail.com');
    expect(result.isDisposable).toBe(false);
  });

  it('returns invalid for domain without dot', () => {
    const result = validateEmail('user@localhost');
    expect(result.valid).toBe(false);
  });
});

// ─── formatEmailInfo ──────────────────────────────────────────────────────────

describe('formatEmailInfo', () => {
  it('shows checkmark for valid email', () => {
    const info = validateEmail('user@example.com');
    const output = formatEmailInfo(info);
    expect(output).toContain('✓ Valid');
  });

  it('shows cross for invalid email', () => {
    const info = validateEmail('notanemail');
    const output = formatEmailInfo(info);
    expect(output).toContain('✗ Invalid');
  });

  it('shows all fields for valid email', () => {
    const info = validateEmail('hello@example.org');
    const output = formatEmailInfo(info);
    expect(output).toContain('Local:');
    expect(output).toContain('Domain:');
    expect(output).toContain('TLD:');
  });

  it('shows issues for invalid email', () => {
    const info = validateEmail('bad..email@domain.com');
    const output = formatEmailInfo(info);
    expect(output).toContain('Issues:');
  });
});
