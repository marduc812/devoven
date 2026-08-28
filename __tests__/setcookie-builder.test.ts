import {
  buildSetCookieHeader,
  analyzeSetCookie,
  parseSetCookieString,
  type CookieAttributes,
} from '@/Components/Functions/SetCookieBuilderTools/logic';

const baseAttrs: CookieAttributes = {
  name: 'session',
  value: 'abc123',
  path: '/',
  domain: '',
  maxAge: '3600',
  expires: '',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
};

describe('buildSetCookieHeader', () => {
  it('returns empty string when no name', () => {
    expect(buildSetCookieHeader({ ...baseAttrs, name: '' })).toBe('');
  });
  it('includes name=value', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('session=abc123');
  });
  it('includes Path', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('Path=/');
  });
  it('includes HttpOnly when set', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('HttpOnly');
  });
  it('includes Secure when set', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('Secure');
  });
  it('includes SameSite', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('SameSite=Lax');
  });
  it('does not include HttpOnly when not set', () => {
    expect(buildSetCookieHeader({ ...baseAttrs, httpOnly: false })).not.toContain('HttpOnly');
  });
  it('includes Max-Age', () => {
    expect(buildSetCookieHeader(baseAttrs)).toContain('Max-Age=3600');
  });
  it('includes Domain when provided', () => {
    expect(buildSetCookieHeader({ ...baseAttrs, domain: 'example.com' })).toContain('Domain=example.com');
  });
  it('prefixes with Set-Cookie:', () => {
    expect(buildSetCookieHeader(baseAttrs)).toMatch(/^Set-Cookie:/);
  });
});

describe('analyzeSetCookie', () => {
  it('returns score 100 for fully secure cookie', () => {
    expect(analyzeSetCookie(baseAttrs).score).toBe(100);
  });
  it('deducts points for missing HttpOnly', () => {
    const score = analyzeSetCookie({ ...baseAttrs, httpOnly: false }).score;
    expect(score).toBeLessThan(100);
  });
  it('deducts points for missing Secure', () => {
    const score = analyzeSetCookie({ ...baseAttrs, secure: false }).score;
    expect(score).toBeLessThan(100);
  });
  it('warns about missing SameSite', () => {
    const result = analyzeSetCookie({ ...baseAttrs, sameSite: '' });
    expect(result.warnings.some(w => w.toLowerCase().includes('samesite'))).toBe(true);
  });
  it('warns about SameSite=None without Secure', () => {
    const result = analyzeSetCookie({ ...baseAttrs, sameSite: 'None', secure: false });
    expect(result.warnings.some(w => w.includes('SameSite=None'))).toBe(true);
  });
});

describe('parseSetCookieString', () => {
  it('returns null for empty string', () => {
    expect(parseSetCookieString('')).toBeNull();
  });
  it('parses name and value', () => {
    const result = parseSetCookieString('session=abc123; Path=/');
    expect(result?.name).toBe('session');
    expect(result?.value).toBe('abc123');
  });
  it('strips Set-Cookie: prefix', () => {
    const result = parseSetCookieString('Set-Cookie: tok=xyz; HttpOnly');
    expect(result?.name).toBe('tok');
  });
  it('detects HttpOnly flag', () => {
    const result = parseSetCookieString('id=1; HttpOnly; Secure');
    expect(result?.attributes['httponly']).toBe(true);
  });
  it('detects SameSite value', () => {
    const result = parseSetCookieString('id=1; SameSite=Strict');
    expect(result?.attributes['samesite']).toBe('Strict');
  });
  it('includes security analysis in formatted output', () => {
    const result = parseSetCookieString('id=1');
    expect(result?.formatted).toContain('Security Score');
  });
});
