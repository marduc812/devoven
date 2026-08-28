import { buildCspPolicy, validateCspSyntax, DEFAULT_CSP_CONFIG, CspConfig } from '@/Components/Functions/CspBuilderTools/logic';

describe('buildCspPolicy', () => {
  it('includes default-src self in all policies', () => {
    const output = buildCspPolicy(DEFAULT_CSP_CONFIG);
    expect(output.headerValue).toContain("default-src 'self'");
  });

  it('warns about unsafe-inline in script-src', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, hasInlineScripts: true, useNonce: false };
    const output = buildCspPolicy(config);
    expect(output.warnings.some(w => w.includes('unsafe-inline'))).toBe(true);
  });

  it('adds nonce to script-src when useNonce is true', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, useNonce: true };
    const output = buildCspPolicy(config);
    const scriptDir = output.directives.find(d => d.name === 'script-src');
    expect(scriptDir?.value).toContain("'nonce-{NONCE}'");
  });

  it('adds strict-dynamic when nonce is used', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, useNonce: true };
    const output = buildCspPolicy(config);
    const scriptDir = output.directives.find(d => d.name === 'script-src');
    expect(scriptDir?.value).toContain("'strict-dynamic'");
  });

  it('warns about unsafe-eval', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, hasUnsafeEval: true };
    const output = buildCspPolicy(config);
    expect(output.warnings.some(w => w.includes('eval'))).toBe(true);
  });

  it('sets frame-ancestors none when allowFrames is false', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, allowFrames: false };
    const output = buildCspPolicy(config);
    const dir = output.directives.find(d => d.name === 'frame-ancestors');
    expect(dir?.value).toBe("'none'");
  });

  it('sets frame-ancestors self when allowFrames is true', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, allowFrames: true };
    const output = buildCspPolicy(config);
    const dir = output.directives.find(d => d.name === 'frame-ancestors');
    expect(dir?.value).toBe("'self'");
  });

  it('includes upgrade-insecure-requests when enabled', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, upgradeInsecure: true };
    const output = buildCspPolicy(config);
    expect(output.headerValue).toContain('upgrade-insecure-requests');
  });

  it('includes report-uri when set', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, reportUri: 'https://csp.example.com/report' };
    const output = buildCspPolicy(config);
    expect(output.headerValue).toContain('report-uri');
    expect(output.headerValue).toContain('https://csp.example.com/report');
  });

  it('generates report-only header', () => {
    const output = buildCspPolicy(DEFAULT_CSP_CONFIG);
    expect(output.reportOnlyHeader).toContain('Content-Security-Policy-Report-Only');
  });

  it('nonce example is provided when useNonce is true', () => {
    const config: CspConfig = { ...DEFAULT_CSP_CONFIG, useNonce: true };
    const output = buildCspPolicy(config);
    expect(output.nonceExample).toContain('nonce');
  });
});

describe('validateCspSyntax', () => {
  it('returns error for empty policy', () => {
    const errors = validateCspSyntax('');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns no errors for valid policy', () => {
    const errors = validateCspSyntax("default-src 'self'; script-src 'self'");
    expect(errors.length).toBe(0);
  });

  it('flags uppercase directive names', () => {
    const errors = validateCspSyntax("Default-Src 'self'");
    expect(errors.some(e => e.includes('lowercase'))).toBe(true);
  });
});
