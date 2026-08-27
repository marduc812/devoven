import { buildDohQuery, validateDomain, DOH_PROVIDERS } from '@/Components/Functions/DohSimulatorTools/logic';

describe('validateDomain', () => {
  it('returns null for valid domain', () => {
    expect(validateDomain('example.com')).toBeNull();
  });

  it('returns null for subdomain', () => {
    expect(validateDomain('sub.example.com')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateDomain('')).not.toBeNull();
  });

  it('returns error for label starting with hyphen', () => {
    expect(validateDomain('-bad.example.com')).not.toBeNull();
  });

  it('accepts hyphen in middle of label', () => {
    expect(validateDomain('my-app.example.com')).toBeNull();
  });
});

describe('buildDohQuery', () => {
  it('builds URLs for all 3 providers', () => {
    const result = buildDohQuery('example.com', 'A');
    expect(result.providers).toHaveLength(DOH_PROVIDERS.length);
  });

  it('includes domain and type in GET URL', () => {
    const result = buildDohQuery('example.com', 'MX');
    const cfUrl = result.providers.find(p => p.provider === 'Cloudflare')!;
    expect(cfUrl.getUrl).toContain('example.com');
    expect(cfUrl.getUrl).toContain('MX');
  });

  it('strips trailing dot from domain', () => {
    const result = buildDohQuery('example.com.', 'A');
    expect(result.domain).toBe('example.com');
  });

  it('includes JSON response format', () => {
    const result = buildDohQuery('example.com', 'A');
    const parsed = JSON.parse(result.jsonResponseFormat);
    expect(parsed.Status).toBe(0);
    expect(Array.isArray(parsed.Question)).toBe(true);
  });

  it('throws on empty domain', () => {
    expect(() => buildDohQuery('', 'A')).toThrow();
  });

  it('includes curl example', () => {
    const result = buildDohQuery('example.com', 'A');
    expect(result.curlExample).toContain('curl');
  });

  it('includes protocol info', () => {
    const result = buildDohQuery('example.com', 'A');
    expect(result.protocol).toContain('RFC 8484');
  });

  it('supports AAAA record type', () => {
    const result = buildDohQuery('example.com', 'AAAA');
    expect(result.type).toBe('AAAA');
    const cfUrl = result.providers.find(p => p.provider === 'Cloudflare')!;
    expect(cfUrl.getUrl).toContain('AAAA');
  });
});
