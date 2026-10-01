import { CspParser } from 'csp_evaluator/dist/parser';
import { CspEvaluator, DEFAULT_CHECKS, STRICTCSP_CHECKS } from 'csp_evaluator/dist/evaluator';
import { Version } from 'csp_evaluator/dist/csp';
import { Finding, Severity, Type } from 'csp_evaluator/dist/finding';
import { checkUnknownDirective, checkMissingSemicolon, checkInvalidKeyword } from 'csp_evaluator/dist/checks/parser_checks';

export const SEVERITY_LABELS: Record<Severity, string> = {
  [Severity.HIGH]: 'High', [Severity.SYNTAX]: 'Syntax error',
  [Severity.MEDIUM]: 'Medium', [Severity.HIGH_MAYBE]: 'Potential high',
  [Severity.STRICT_CSP]: 'Hardening', [Severity.MEDIUM_MAYBE]: 'Potential medium',
  [Severity.INFO]: 'Information', [Severity.NONE]: 'Ignored source',
};

export function isCompatibilityFinding(finding: Finding): boolean {
  return finding.type === Type.UNSAFE_INLINE_FALLBACK || finding.type === Type.ALLOWLIST_FALLBACK;
}

export function findingLabel(finding: Finding): string {
  return isCompatibilityFinding(finding) ? 'Optional compatibility' : SEVERITY_LABELS[finding.severity];
}

export const EXAMPLE_POLICY = "default-src 'self'; script-src 'unsafe-inline' https:; object-src *";
export const STRICT_POLICY = "default-src 'none'; script-src 'nonce-cmFuZG9tLWV4YW1wbGUtbm9uY2U=' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

export interface PolicyAnalysis {
  policy: string;
  reportOnly: boolean;
  directives: Record<string, string[] | undefined>;
  effectiveDirectives: Record<string, string[] | undefined>;
  findings: Finding[];
}

/** Each serialized policy is evaluated independently; their combined enforcement may be stricter. */
export function analyzeCsp(input: string, version: Version = Version.CSP3, strict = true): PolicyAnalysis[] {
  if (!input.trim()) throw new Error('Paste a Content-Security-Policy header or policy to analyze.');
  // Repeated header lines and comma-separated policy lists are both valid inputs.
  const policies: Array<{ policy: string; reportOnly: boolean }> = [];
  let reportOnly = false;
  for (const line of input.trim().split(/\r?\n/)) {
    const header = line.match(/^\s*content-security-policy(-report-only)?\s*:\s*/i);
    if (header) reportOnly = Boolean(header[1]);
    const value = header ? line.slice(header[0].length) : line;
    for (const policy of value.split(',').map(part => part.trim()).filter(Boolean)) {
      if (!header && policies.length && !value.includes(',')) {
        const previous = policies[policies.length - 1];
        previous.policy += ` ${policy}`;
      } else policies.push({ policy, reportOnly });
    }
  }
  if (!policies.length) throw new Error('The policy is empty.');
  return policies.map(({ policy, reportOnly }) => {
    const parsed = new CspParser(policy).csp;
    const findings = new CspEvaluator(parsed, version).evaluate(
      [checkUnknownDirective, checkMissingSemicolon, checkInvalidKeyword],
      strict ? [...DEFAULT_CHECKS, ...STRICTCSP_CHECKS] : DEFAULT_CHECKS,
    ).filter((finding, index, all) => all.findIndex(other => other.equals(finding)) === index);
    for (const finding of findings) {
      if (finding.type === Type.UNSAFE_INLINE_FALLBACK) {
        finding.description = "Optional legacy-browser fallback: 'unsafe-inline' allows inline scripts in browsers without nonce/hash support, weakening XSS protection there. Browsers supporting nonces/hashes ignore it when those sources are present. Keep it omitted unless you explicitly need this compatibility tradeoff.";
      } else if (finding.type === Type.ALLOWLIST_FALLBACK) {
        finding.description = "Optional legacy-browser fallback: broad https: or http: sources allow scripts from any origin using those schemes in browsers without 'strict-dynamic' support. This weakens protection there; http: also permits insecure transport. Supporting browsers ignore these sources when 'strict-dynamic' is active. Keep them omitted unless needed; prefer specific trusted HTTPS origins for a fallback.";
      }
    }
    // Browsers ignore repeated directives after the first occurrence.
    const seen = new Set<string>();
    for (const part of policy.split(';')) {
      const name = part.trim().split(/\s+/)[0]?.toLowerCase();
      if (!name) continue;
      if (seen.has(name)) findings.push(new Finding(405, 'Duplicate directive: browsers use the first occurrence and ignore this one.', Severity.NONE, name));
      seen.add(name);
    }
    findings.sort((a, b) => a.severity - b.severity);
    return { policy, reportOnly, directives: parsed.directives, effectiveDirectives: parsed.getEffectiveCsp(version).directives, findings };
  });
}
