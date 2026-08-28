import {
  generateSecurityHeaders,
  calculateSecurityScore,
  headersToText,
  headersToNginxConfig,
  headersToApacheConfig,
  SecurityRequirements,
} from '../Components/Functions/SecurityHeadersTools/logic';

const defaultReq: SecurityRequirements = {
  isSpa: false,
  hasExternalFonts: false,
  hasEmbeds: false,
  hasAnalytics: false,
  hasCdn: false,
  hasImages: true,
  hasVideos: false,
  allowsEmbedding: false,
  hasPayments: false,
  hasWebRtc: false,
  customDomains: '',
};

describe('SecurityHeadersTools logic', () => {
  test('generates core headers', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const names = headers.map(h => h.name);
    expect(names).toContain('Content-Security-Policy');
    expect(names).toContain('X-Frame-Options');
    expect(names).toContain('X-Content-Type-Options');
    expect(names).toContain('Referrer-Policy');
    expect(names).toContain('Strict-Transport-Security');
    expect(names).toContain('Permissions-Policy');
  });

  test('COEP is require-corp when no embeds', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, hasEmbeds: false, hasVideos: false });
    const coep = headers.find(h => h.name === 'Cross-Origin-Embedder-Policy');
    expect(coep?.value).toBe('require-corp');
  });

  test('COEP is unsafe-none when embeds present', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, hasEmbeds: true });
    const coep = headers.find(h => h.name === 'Cross-Origin-Embedder-Policy');
    expect(coep?.value).toBe('unsafe-none');
  });

  test('X-Frame-Options is DENY when embedding not allowed', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, allowsEmbedding: false });
    const xfo = headers.find(h => h.name === 'X-Frame-Options');
    expect(xfo?.value).toBe('DENY');
  });

  test('X-Frame-Options is SAMEORIGIN when embedding allowed', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, allowsEmbedding: true });
    const xfo = headers.find(h => h.name === 'X-Frame-Options');
    expect(xfo?.value).toBe('SAMEORIGIN');
  });

  test('CSP includes analytics domains when analytics enabled', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, hasAnalytics: true });
    const csp = headers.find(h => h.name === 'Content-Security-Policy');
    expect(csp?.value).toContain('google-analytics.com');
  });

  test('CSP includes Google Fonts when external fonts enabled', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, hasExternalFonts: true });
    const csp = headers.find(h => h.name === 'Content-Security-Policy');
    expect(csp?.value).toContain('fonts.googleapis.com');
  });

  test('calculateSecurityScore returns value between 0-100', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const score = calculateSecurityScore(headers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('score is higher with default (no embeds, no spa)', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const score = calculateSecurityScore(headers);
    expect(score).toBeGreaterThan(50);
  });

  test('headersToText returns one header per line', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const text = headersToText(headers);
    const lines = text.split('\n').filter(Boolean);
    expect(lines.length).toBe(headers.length);
    expect(lines[0]).toContain(': ');
  });

  test('headersToNginxConfig returns add_header lines', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const nginx = headersToNginxConfig(headers);
    expect(nginx).toContain('add_header');
  });

  test('headersToApacheConfig returns Header always set lines', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const apache = headersToApacheConfig(headers);
    expect(apache).toContain('Header always set');
  });

  test('custom domains appear in CSP', () => {
    const headers = generateSecurityHeaders({ ...defaultReq, customDomains: 'https://api.example.com' });
    const csp = headers.find(h => h.name === 'Content-Security-Policy');
    expect(csp?.value).toContain('https://api.example.com');
  });

  test('HSTS includes preload', () => {
    const headers = generateSecurityHeaders(defaultReq);
    const hsts = headers.find(h => h.name === 'Strict-Transport-Security');
    expect(hsts?.value).toContain('preload');
    expect(hsts?.value).toContain('max-age=');
  });
});
