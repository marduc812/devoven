import { analyzeCsp, findingLabel, STRICT_POLICY } from '@/Components/Functions/CspAnalyzerTools/logic';
import { Version } from 'csp_evaluator/dist/csp';
import { Type } from 'csp_evaluator/dist/finding';

describe('CSP Analyzer', () => {
  it('explains legacy fallbacks as optional security tradeoffs', () => {
    const findings = analyzeCsp(STRICT_POLICY)[0].findings;
    for (const type of [Type.UNSAFE_INLINE_FALLBACK, Type.ALLOWLIST_FALLBACK]) {
      const finding = findings.find(f => f.type === type)!;
      expect(finding).toBeDefined();
      expect(findingLabel(finding)).toBe('Optional compatibility');
      expect(finding.description).toContain('Keep');
      expect(finding.description).toMatch(/weaken/);
    }
    expect(findings.find(f => f.type === Type.ALLOWLIST_FALLBACK)?.description).toContain('insecure transport');
  });
  it('detects unsafe scripts and wildcard sources', () => {
    const [result] = analyzeCsp("script-src 'unsafe-inline' 'unsafe-eval' *; object-src *");
    expect(result.findings.map(f => f.type)).toEqual(expect.arrayContaining([Type.SCRIPT_UNSAFE_INLINE, Type.SCRIPT_UNSAFE_EVAL, Type.PLAIN_WILDCARD]));
  });
  it('respects nonce and strict-dynamic semantics across versions', () => {
    const policy = "script-src 'nonce-YWJjZGVmZ2hpamtsbW5vcA==' 'strict-dynamic' 'unsafe-inline' https:; object-src 'none'; base-uri 'none'";
    expect(analyzeCsp(policy, Version.CSP3)[0].findings.some(f => f.type === Type.SCRIPT_UNSAFE_INLINE)).toBe(false);
    expect(analyzeCsp(policy, Version.CSP1)[0].findings.some(f => f.type === Type.SCRIPT_UNSAFE_INLINE)).toBe(true);
    expect(analyzeCsp(policy)[0].effectiveDirectives['script-src']).not.toContain('https:');
  });
  it('retains nonce case and reports short nonces', () => {
    const [result] = analyzeCsp("script-src 'nonce-AbCd'; object-src 'none'; base-uri 'none'");
    expect(result.directives['script-src']).toContain("'nonce-AbCd'");
    expect(result.findings.some(f => f.type === Type.NONCE_LENGTH)).toBe(true);
  });
  it('handles repeated enforced and report-only headers', () => {
    const results = analyzeCsp("Content-Security-Policy: default-src 'none'\nContent-Security-Policy-Report-Only: script-src *");
    expect(results).toHaveLength(2);
    expect(results.map(r => r.reportOnly)).toEqual([false, true]);
  });
  it('handles multiline and comma-separated policies', () => {
    expect(analyzeCsp("default-src 'self';\nobject-src 'none'")[0].directives['object-src']).toEqual(["'none'"]);
    expect(analyzeCsp("default-src 'none', script-src *")).toHaveLength(2);
  });
  it('reports typos and preserves the first duplicate directive', () => {
    const [result] = analyzeCsp("script-src 'none'; script-src *; typo-src 'self'");
    expect(result.directives['script-src']).toEqual(["'none'"]);
    expect(result.findings.some(f => f.type === Type.UNKNOWN_DIRECTIVE)).toBe(true);
    expect(result.findings.some(f => f.description.startsWith('Duplicate directive'))).toBe(true);
  });
  it('rejects empty policies', () => {
    expect(() => analyzeCsp(' ')).toThrow('Paste');
    expect(() => analyzeCsp('Content-Security-Policy:')).toThrow('empty');
  });
});
