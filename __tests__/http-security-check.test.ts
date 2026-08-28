import {
  parseHttpHeaders,
  parseHeaderLines,
  auditHeaderValues,
  analyzeSecurityHeaders,
  gradeScore,
} from '@/Components/Functions/HttpSecurityCheckTools/logic';

const fullHeaders = `
HTTP/1.1 200 OK
Content-Type: text/html
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=()
X-XSS-Protection: 1; mode=block
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
`.trim();

const minimalHeaders = `
Content-Type: application/json
`.trim();

describe('parseHttpHeaders', () => {
  it('parses header names and values', () => {
    const result = parseHttpHeaders('Content-Type: text/html');
    expect(result.headers['content-type']).toBe('text/html');
  });
  it('skips HTTP status line', () => {
    const result = parseHttpHeaders('HTTP/1.1 200 OK\nContent-Type: text/html');
    expect(result.headers['http/1.1 200 ok']).toBeUndefined();
  });
  it('detects present security headers', () => {
    const result = parseHttpHeaders(fullHeaders);
    const csp = result.securityResults.find(r => r.header === 'content-security-policy');
    expect(csp?.present).toBe(true);
  });
  it('detects missing security headers', () => {
    const result = parseHttpHeaders(minimalHeaders);
    const csp = result.securityResults.find(r => r.header === 'content-security-policy');
    expect(csp?.present).toBe(false);
  });
  it('returns score 100 for full security headers', () => {
    const result = parseHttpHeaders(fullHeaders);
    expect(result.score).toBe(100);
  });
  it('returns low score for minimal headers', () => {
    const result = parseHttpHeaders(minimalHeaders);
    expect(result.score).toBeLessThan(50);
  });
  it('includes recommendations for missing headers', () => {
    const result = parseHttpHeaders(minimalHeaders);
    const csp = result.securityResults.find(r => r.header === 'content-security-policy');
    expect(csp?.recommendation).toBeTruthy();
  });
  it('severity is critical for CSP', () => {
    const result = parseHttpHeaders(minimalHeaders);
    const csp = result.securityResults.find(r => r.header === 'content-security-policy');
    expect(csp?.severity).toBe('critical');
  });
  it('summary contains score', () => {
    const result = parseHttpHeaders(minimalHeaders);
    expect(result.summary).toContain('Security Score');
  });
});

const weakValues = `
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
Strict-Transport-Security: max-age=3600
X-Frame-Options: ALLOW-FROM https://example.com
X-Content-Type-Options: sniff
Referrer-Policy: unsafe-url
X-XSS-Protection: 1; mode=block
Server: nginx/1.18.0
X-Powered-By: PHP/7.4.3
Set-Cookie: session=abc123; Path=/
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
`.trim();

describe('parseHeaderLines', () => {
  it('keeps duplicate headers that the map form collapses', () => {
    const raw = 'Set-Cookie: a=1\nSet-Cookie: b=2';
    expect(parseHeaderLines(raw)).toHaveLength(2);
    expect(Object.keys(parseHttpHeaders(raw).headers)).toHaveLength(1);
  });
  it('skips the status line and blank lines', () => {
    expect(parseHeaderLines('HTTP/2 200\n\nContent-Type: text/html')).toEqual([
      { name: 'Content-Type', value: 'text/html' },
    ]);
  });
  it('keeps the original casing of the name', () => {
    expect(parseHeaderLines('X-Frame-Options: DENY')[0].name).toBe('X-Frame-Options');
  });
  it('splits on the first colon only, so a URL value survives', () => {
    expect(parseHeaderLines('Location: https://example.com/a')[0].value).toBe('https://example.com/a');
  });
});

describe('auditHeaderValues', () => {
  const warn = (raw: string) => auditHeaderValues(parseHeaderLines(raw));
  const messages = (raw: string) => warn(raw).map(w => w.message).join(' | ');

  it('flags unsafe-inline and unsafe-eval in a CSP', () => {
    const m = messages("Content-Security-Policy: script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(m).toContain('unsafe-inline');
    expect(m).toContain('unsafe-eval');
  });

  it('flags a wildcard source list', () => {
    expect(messages("Content-Security-Policy: default-src *")).toContain('set to *');
  });

  it('does not mistake a hostname wildcard for a bare wildcard', () => {
    const m = messages("Content-Security-Policy: default-src 'self' *.example.com; object-src 'none'; frame-ancestors 'none'");
    expect(m).not.toContain('set to *');
  });

  it('flags a short HSTS max-age but not a long one', () => {
    expect(messages('Strict-Transport-Security: max-age=3600')).toContain('under the six months');
    expect(messages('Strict-Transport-Security: max-age=63072000; includeSubDomains')).toBe('');
  });

  it('flags an HSTS header with no max-age at all', () => {
    expect(messages('Strict-Transport-Security: includeSubDomains')).toContain('No max-age');
  });

  it('flags the dropped ALLOW-FROM value', () => {
    expect(messages('X-Frame-Options: ALLOW-FROM https://example.com')).toContain('ALLOW-FROM');
    expect(messages('X-Frame-Options: DENY')).toBe('');
    expect(messages('X-Frame-Options: sameorigin')).toBe('');
  });

  it('flags X-Content-Type-Options set to anything but nosniff', () => {
    expect(messages('X-Content-Type-Options: sniff')).toContain('nosniff');
    expect(messages('X-Content-Type-Options: nosniff')).toBe('');
  });

  it('flags a leaky Referrer-Policy', () => {
    expect(messages('Referrer-Policy: unsafe-url')).toContain('leaks the full URL');
    expect(messages('Referrer-Policy: strict-origin-when-cross-origin')).toBe('');
  });

  it('flags the legacy XSS auditor being switched on', () => {
    expect(messages('X-XSS-Protection: 1; mode=block')).toContain('legacy XSS auditor');
    expect(messages('X-XSS-Protection: 0')).toBe('');
  });

  it('flags wildcard CORS combined with credentials', () => {
    const m = messages('Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true');
    expect(m).toContain('Wildcard origin');
    expect(messages('Access-Control-Allow-Origin: *')).toBe('');
  });

  it('flags every missing cookie flag, per cookie', () => {
    const warnings = warn('Set-Cookie: a=1; Path=/\nSet-Cookie: b=2; Path=/; Secure; HttpOnly; SameSite=Lax');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('Secure, HttpOnly, SameSite');
    expect(warnings[0].level).toBe('high');
  });

  it('drops to medium when only Secure is present', () => {
    const warnings = warn('Set-Cookie: a=1; Secure');
    expect(warnings[0].level).toBe('medium');
  });

  it('says nothing about a header that is absent', () => {
    expect(warn('Content-Type: text/html')).toEqual([]);
  });
});

describe('gradeScore', () => {
  it('maps the bands', () => {
    expect(gradeScore(100)).toBe('A');
    expect(gradeScore(90)).toBe('A');
    expect(gradeScore(85)).toBe('B');
    expect(gradeScore(75)).toBe('C');
    expect(gradeScore(65)).toBe('D');
    expect(gradeScore(45)).toBe('E');
    expect(gradeScore(0)).toBe('F');
  });
});

describe('analyzeSecurityHeaders', () => {
  it('grades a fully covered response an A', () => {
    const a = analyzeSecurityHeaders(fullHeaders);
    expect(a.parsed.score).toBe(100);
    expect(a.grade).toBe('A');
    expect(a.missing).toEqual([]);
  });

  it('splits present from missing', () => {
    const a = analyzeSecurityHeaders(minimalHeaders);
    expect(a.present).toEqual([]);
    expect(a.missing).toHaveLength(a.parsed.securityResults.length);
  });

  it('tallies missing headers by severity', () => {
    const a = analyzeSecurityHeaders(minimalHeaders);
    expect(a.missingBySeverity.critical).toBe(2);
    expect(a.missingBySeverity.high).toBe(2);
    expect(a.missingBySeverity.medium).toBe(2);
    expect(a.missingBySeverity.low).toBe(3);
  });

  it('separates version disclosure from other headers', () => {
    const a = analyzeSecurityHeaders(weakValues);
    expect(a.disclosures.map(d => d.name)).toEqual(['Server', 'X-Powered-By']);
    expect(a.otherHeaders.map(h => h.name)).not.toContain('Server');
    expect(a.otherHeaders.map(h => h.name)).toContain('Set-Cookie');
  });

  it('never lists a checked security header among the others', () => {
    const a = analyzeSecurityHeaders(fullHeaders);
    const checked = a.parsed.securityResults.map(r => r.header);
    for (const other of a.otherHeaders) {
      expect(checked).not.toContain(other.name.toLowerCase());
    }
  });

  it('scores presence high while still reporting weak values', () => {
    const a = analyzeSecurityHeaders(weakValues);
    expect(a.present.length).toBeGreaterThan(0);
    expect(a.warnings.length).toBeGreaterThan(3);
  });

  it('counts every pasted header, status line excluded', () => {
    expect(analyzeSecurityHeaders('HTTP/1.1 200 OK\nA: 1\nB: 2').totalHeaders).toBe(2);
  });
});
