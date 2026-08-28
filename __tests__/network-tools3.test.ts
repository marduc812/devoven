import {
  parseCookieHeader,
  parseSetCookieHeader,
  formatParsedCookies,
  formatSetCookie,
} from '@/Components/Functions/NetworkTools3/logic';

describe('parseCookieHeader', () => {
  it('parses single cookie', () => {
    const r = parseCookieHeader('session=abc123');
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({name: 'session', value: 'abc123'});
  });
  it('parses multiple cookies', () => {
    expect(parseCookieHeader('a=1; b=2; c=3')).toHaveLength(3);
  });
  it('handles empty input', () => expect(parseCookieHeader('')).toHaveLength(0));
  it('handles cookie with no value', () => {
    const r = parseCookieHeader('flag');
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('flag');
    expect(r[0].value).toBe('');
  });
  it('trims whitespace around names and values', () => {
    const r = parseCookieHeader(' token = xyz ');
    expect(r[0].name).toBe('token');
    expect(r[0].value).toBe('xyz');
  });
});

describe('formatParsedCookies', () => {
  it('returns no cookies message for empty array', () => {
    expect(formatParsedCookies([])).toBe('No cookies found');
  });
  it('formats cookies as name = value', () => {
    const result = formatParsedCookies([{name: 'session', value: 'abc'}]);
    expect(result).toBe('session = abc');
  });
});

describe('parseSetCookieHeader', () => {
  it('parses basic Set-Cookie header', () => {
    const r = parseSetCookieHeader('session=abc; Path=/; HttpOnly');
    expect(r.name).toBe('session');
    expect(r.value).toBe('abc');
    expect(r.path).toBe('/');
    expect(r.httpOnly).toBe(true);
    expect(r.secure).toBe(false);
  });
  it('parses Secure flag', () => {
    const r = parseSetCookieHeader('token=xyz; Secure');
    expect(r.secure).toBe(true);
  });
  it('throws on empty header', () => {
    expect(() => parseSetCookieHeader('')).toThrow('Empty Set-Cookie header');
  });
  it('parses Max-Age', () => {
    const r = parseSetCookieHeader('id=1; Max-Age=3600');
    expect(r.maxAge).toBe(3600);
  });
  it('parses SameSite attribute', () => {
    const r = parseSetCookieHeader('x=y; SameSite=Strict');
    expect(r.sameSite).toBe('Strict');
  });
});

describe('formatSetCookie', () => {
  it('formats basic parsed set-cookie', () => {
    const cookie = parseSetCookieHeader('session=abc; Path=/; HttpOnly');
    const result = formatSetCookie(cookie);
    expect(result).toContain('Name:      session');
    expect(result).toContain('Value:     abc');
    expect(result).toContain('HttpOnly:  true');
  });
});
