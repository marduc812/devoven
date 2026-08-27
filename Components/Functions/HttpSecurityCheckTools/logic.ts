// HTTP Security Headers Checker logic

export type SecurityHeaderResult = {
  header: string;
  present: boolean;
  value: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  recommendation: string | null;
};

export type ParsedHeaders = {
  headers: Record<string, string>;
  securityResults: SecurityHeaderResult[];
  score: number; // 0-100
  summary: string;
};

const SECURITY_HEADERS: Array<{
  header: string;
  severity: SecurityHeaderResult['severity'];
  description: string;
  recommendation: string;
}> = [
  {
    header: 'content-security-policy',
    severity: 'critical',
    description: 'Content Security Policy controls which resources the browser is allowed to load.',
    recommendation: "Add: Content-Security-Policy: default-src 'self'",
  },
  {
    header: 'strict-transport-security',
    severity: 'critical',
    description: 'HTTP Strict Transport Security (HSTS) forces HTTPS connections.',
    recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains',
  },
  {
    header: 'x-frame-options',
    severity: 'high',
    description: 'Prevents clickjacking by controlling whether the page can be embedded in a frame.',
    recommendation: 'Add: X-Frame-Options: DENY',
  },
  {
    header: 'x-content-type-options',
    severity: 'high',
    description: 'Prevents MIME type sniffing.',
    recommendation: 'Add: X-Content-Type-Options: nosniff',
  },
  {
    header: 'referrer-policy',
    severity: 'medium',
    description: 'Controls how much referrer information is included with requests.',
    recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
  },
  {
    header: 'permissions-policy',
    severity: 'medium',
    description: 'Controls browser feature permissions (formerly Feature-Policy).',
    recommendation: "Add: Permissions-Policy: geolocation=(), microphone=()",
  },
  {
    header: 'x-xss-protection',
    severity: 'low',
    description: 'Legacy XSS filter (mostly superseded by CSP but still useful for older browsers).',
    recommendation: 'Add: X-XSS-Protection: 1; mode=block',
  },
  {
    header: 'cross-origin-embedder-policy',
    severity: 'low',
    description: 'Prevents loading cross-origin resources that do not explicitly grant permission.',
    recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp',
  },
  {
    header: 'cross-origin-opener-policy',
    severity: 'low',
    description: 'Controls how the document interacts with cross-origin windows.',
    recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin',
  },
];

const SEVERITY_SCORE: Record<SecurityHeaderResult['severity'], number> = {
  critical: 25,
  high: 15,
  medium: 10,
  low: 5,
  info: 0,
};

export function parseHttpHeaders(raw: string): ParsedHeaders {
  const headers: Record<string, string> = {};

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip HTTP status line
    if (/^HTTP\//.test(trimmed)) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const name = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    headers[name] = value;
  }

  let maxScore = 0;
  let score = 0;
  const securityResults: SecurityHeaderResult[] = [];

  for (const def of SECURITY_HEADERS) {
    const headerLower = def.header.toLowerCase();
    const present = headerLower in headers;
    const value = present ? headers[headerLower] : null;

    const points = SEVERITY_SCORE[def.severity];
    maxScore += points;
    if (present) score += points;

    securityResults.push({
      header: def.header,
      present,
      value,
      severity: def.severity,
      description: def.description,
      recommendation: present ? null : def.recommendation,
    });
  }

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const missing = securityResults.filter(r => !r.present);
  const critical = missing.filter(r => r.severity === 'critical').length;
  const high = missing.filter(r => r.severity === 'high').length;

  let summary = `Security Score: ${pct}/100\n`;
  summary += `Headers Checked: ${SECURITY_HEADERS.length} | Present: ${securityResults.filter(r => r.present).length} | Missing: ${missing.length}\n`;
  if (critical > 0) summary += `CRITICAL missing: ${critical} | `;
  if (high > 0) summary += `HIGH missing: ${high}`;

  return { headers, securityResults, score: pct, summary: summary.trim() };
}

// ─── Structured audit ────────────────────────────────────────────────────────
// parseHttpHeaders answers "is the header there?". That is only half the
// question — a Content-Security-Policy full of 'unsafe-inline' is present and
// useless. Everything below grades the values, not just their presence.

/** Header lines with duplicates preserved. parseHttpHeaders collapses repeats
 *  into a map, which loses every Set-Cookie but the last. */
export function parseHeaderLines(raw: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || /^HTTP\//.test(trimmed)) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    out.push({
      name: trimmed.slice(0, colonIdx).trim(),
      value: trimmed.slice(colonIdx + 1).trim(),
    });
  }
  return out;
}

export type WarningLevel = 'high' | 'medium' | 'low';

export interface HeaderWarning {
  header: string;
  level: WarningLevel;
  message: string;
}

/** Headers that tell an attacker what software and version to look up. */
const DISCLOSURE_HEADERS = [
  'server',
  'x-powered-by',
  'x-aspnet-version',
  'x-aspnetmvc-version',
  'x-generator',
  'x-drupal-cache',
  'x-runtime',
];

const SIX_MONTHS_SECONDS = 15768000;

/** Grade the value of a header that is present. */
export function auditHeaderValues(lines: Array<{ name: string; value: string }>): HeaderWarning[] {
  const warnings: HeaderWarning[] = [];
  const get = (name: string) => lines.find(l => l.name.toLowerCase() === name)?.value ?? null;

  const csp = get('content-security-policy');
  if (csp !== null) {
    const lower = csp.toLowerCase();
    if (lower.includes("'unsafe-inline'")) {
      warnings.push({
        header: 'Content-Security-Policy',
        level: 'high',
        message: "Allows 'unsafe-inline', which lets injected <script> tags run — the main thing CSP exists to stop. Use nonces or hashes instead.",
      });
    }
    if (lower.includes("'unsafe-eval'")) {
      warnings.push({
        header: 'Content-Security-Policy',
        level: 'medium',
        message: "Allows 'unsafe-eval', so eval() and new Function() stay available to injected code.",
      });
    }
    if (/(?:^|;)\s*(?:default|script)-src[^;]*\s\*(?:\s|;|$)/.test(lower)) {
      warnings.push({
        header: 'Content-Security-Policy',
        level: 'high',
        message: 'A source list is set to *, which permits scripts from any origin.',
      });
    }
    if (!lower.includes('object-src')) {
      warnings.push({
        header: 'Content-Security-Policy',
        level: 'low',
        message: "No object-src directive — add object-src 'none' to block legacy plugin embeds.",
      });
    }
    if (!lower.includes('frame-ancestors')) {
      warnings.push({
        header: 'Content-Security-Policy',
        level: 'low',
        message: 'No frame-ancestors directive — it supersedes X-Frame-Options and is what modern browsers honour.',
      });
    }
  }

  const hsts = get('strict-transport-security');
  if (hsts !== null) {
    const maxAge = /max-age\s*=\s*"?(\d+)/i.exec(hsts);
    if (!maxAge) {
      warnings.push({
        header: 'Strict-Transport-Security',
        level: 'high',
        message: 'No max-age directive, so browsers ignore the header entirely.',
      });
    } else if (parseInt(maxAge[1], 10) < SIX_MONTHS_SECONDS) {
      warnings.push({
        header: 'Strict-Transport-Security',
        level: 'medium',
        message: `max-age is ${maxAge[1]}s — under the six months (${SIX_MONTHS_SECONDS}s) preload lists require.`,
      });
    }
    if (!/includesubdomains/i.test(hsts)) {
      warnings.push({
        header: 'Strict-Transport-Security',
        level: 'low',
        message: 'No includeSubDomains, so a subdomain can still be reached over plain HTTP.',
      });
    }
  }

  const xfo = get('x-frame-options');
  if (xfo !== null && !/^(deny|sameorigin)$/i.test(xfo.trim())) {
    warnings.push({
      header: 'X-Frame-Options',
      level: 'medium',
      message: `"${xfo}" is not a value browsers honour — only DENY and SAMEORIGIN are (ALLOW-FROM was dropped).`,
    });
  }

  const xcto = get('x-content-type-options');
  if (xcto !== null && xcto.trim().toLowerCase() !== 'nosniff') {
    warnings.push({
      header: 'X-Content-Type-Options',
      level: 'medium',
      message: `The only meaningful value is nosniff; "${xcto}" does nothing.`,
    });
  }

  const referrer = get('referrer-policy');
  if (referrer !== null && /unsafe-url|no-referrer-when-downgrade/i.test(referrer)) {
    warnings.push({
      header: 'Referrer-Policy',
      level: 'medium',
      message: `"${referrer}" leaks the full URL to other origins. strict-origin-when-cross-origin is the safe default.`,
    });
  }

  const xss = get('x-xss-protection');
  if (xss !== null && /^1/.test(xss.trim())) {
    warnings.push({
      header: 'X-XSS-Protection',
      level: 'low',
      message: 'The legacy XSS auditor introduced its own vulnerabilities and is gone from every current browser; 0 is now the recommended value.',
    });
  }

  const acao = get('access-control-allow-origin');
  const acac = get('access-control-allow-credentials');
  if (acao === '*' && acac !== null && /true/i.test(acac)) {
    warnings.push({
      header: 'Access-Control-Allow-Origin',
      level: 'high',
      message: 'Wildcard origin together with Allow-Credentials — browsers reject this pairing, and reflecting the origin instead would expose authenticated responses to any site.',
    });
  }

  for (const cookie of lines.filter(l => l.name.toLowerCase() === 'set-cookie')) {
    const name = cookie.value.split('=')[0] || 'cookie';
    const missing: string[] = [];
    if (!/;\s*secure/i.test(cookie.value)) missing.push('Secure');
    if (!/;\s*httponly/i.test(cookie.value)) missing.push('HttpOnly');
    if (!/;\s*samesite/i.test(cookie.value)) missing.push('SameSite');
    if (missing.length > 0) {
      warnings.push({
        header: 'Set-Cookie',
        level: missing.includes('Secure') ? 'high' : 'medium',
        message: `Cookie "${name}" is missing ${missing.join(', ')}.`,
      });
    }
  }

  return warnings;
}

export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export function gradeScore(score: number): SecurityGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 40) return 'E';
  return 'F';
}

export interface SecurityAudit {
  parsed: ParsedHeaders;
  grade: SecurityGrade;
  present: SecurityHeaderResult[];
  missing: SecurityHeaderResult[];
  /** Missing headers tallied by severity. */
  missingBySeverity: Record<SecurityHeaderResult['severity'], number>;
  warnings: HeaderWarning[];
  /** Headers that advertise the server software. */
  disclosures: Array<{ name: string; value: string }>;
  /** Everything else that was pasted in. */
  otherHeaders: Array<{ name: string; value: string }>;
  totalHeaders: number;
}

const SEVERITY_ORDER: SecurityHeaderResult['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];

export function analyzeSecurityHeaders(raw: string): SecurityAudit {
  const parsed = parseHttpHeaders(raw);
  const lines = parseHeaderLines(raw);
  const checked = new Set(parsed.securityResults.map(r => r.header));

  const missing = parsed.securityResults.filter(r => !r.present);
  const missingBySeverity = Object.fromEntries(
    SEVERITY_ORDER.map(s => [s, missing.filter(r => r.severity === s).length])
  ) as SecurityAudit['missingBySeverity'];

  const disclosures = lines.filter(l => DISCLOSURE_HEADERS.includes(l.name.toLowerCase()));
  const otherHeaders = lines.filter(l => {
    const lower = l.name.toLowerCase();
    return !checked.has(lower) && !DISCLOSURE_HEADERS.includes(lower);
  });

  return {
    parsed,
    grade: gradeScore(parsed.score),
    present: parsed.securityResults.filter(r => r.present),
    missing,
    missingBySeverity,
    warnings: auditHeaderValues(lines),
    disclosures,
    otherHeaders,
    totalHeaders: lines.length,
  };
}
