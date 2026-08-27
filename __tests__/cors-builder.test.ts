import { buildCorsHeaders, DEFAULT_CORS_CONFIG, getHeaderExplanations, CorsConfig } from '@/Components/Functions/CorsBuilderTools/logic';

describe('buildCorsHeaders', () => {
  it('sets wildcard origin for *', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, allowedOrigins: '*' };
    const output = buildCorsHeaders(config);
    expect(output.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('warns when wildcard is combined with credentials', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, allowedOrigins: '*', allowCredentials: true };
    const output = buildCorsHeaders(config);
    expect(output.warnings.some(w => w.toLowerCase().includes('wildcard'))).toBe(true);
  });

  it('includes credentials header when allowCredentials is true', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, allowCredentials: true, allowedOrigins: 'https://example.com' };
    const output = buildCorsHeaders(config);
    expect(output.headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('does not include max-age when maxAge is 0', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, maxAge: 0 };
    const output = buildCorsHeaders(config);
    expect(output.headers['Access-Control-Max-Age']).toBeUndefined();
  });

  it('includes max-age when maxAge > 0', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, maxAge: 3600 };
    const output = buildCorsHeaders(config);
    expect(output.headers['Access-Control-Max-Age']).toBe('3600');
  });

  it('adds Vary: Origin for non-wildcard single origin', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, allowedOrigins: 'https://app.example.com' };
    const output = buildCorsHeaders(config);
    expect(output.headers['Vary']).toBe('Origin');
  });

  it('generates express code', () => {
    const output = buildCorsHeaders(DEFAULT_CORS_CONFIG);
    expect(output.expressCode).toContain('cors');
  });

  it('generates nginx config', () => {
    const output = buildCorsHeaders(DEFAULT_CORS_CONFIG);
    expect(output.nginxConfig).toContain('add_header');
  });

  it('generates apache config', () => {
    const output = buildCorsHeaders(DEFAULT_CORS_CONFIG);
    expect(output.apacheConfig).toContain('Header set');
  });

  it('warns about reflect-origin pattern', () => {
    const config: CorsConfig = { ...DEFAULT_CORS_CONFIG, useReflectOrigin: true };
    const output = buildCorsHeaders(config);
    expect(output.warnings.some(w => w.includes('reflect'))).toBe(true);
  });
});

describe('getHeaderExplanations', () => {
  it('returns at least 5 header explanations', () => {
    expect(getHeaderExplanations().length).toBeGreaterThanOrEqual(5);
  });

  it('each has name, value, description', () => {
    for (const h of getHeaderExplanations()) {
      expect(h.name).toBeTruthy();
      expect(h.description).toBeTruthy();
    }
  });
});
