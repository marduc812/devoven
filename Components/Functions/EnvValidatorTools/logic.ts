// Environment Variable Validator — pure TypeScript, no browser APIs
// Validates .env file contents for correctness and security issues

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface EnvVariable {
  key: string;
  value: string;
  rawValue: string;
  lineNumber: number;
  hasQuotes: boolean;
  quoteChar: '"' | "'" | '';
  comment: string;
}

export interface ValidationIssue {
  severity: IssueSeverity;
  key: string;
  line: number;
  message: string;
  category: 'syntax' | 'security' | 'style' | 'duplicate';
}

export interface ValidationResult {
  variables: EnvVariable[];
  issues: ValidationIssue[];
  stats: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
    infos: number;
    duplicates: number;
    emptyValues: number;
    sensitiveKeys: number;
  };
  summary: string;
}

const SENSITIVE_PATTERNS = [
  /^API_KEY$/i,
  /^SECRET/i,
  /^PASSWORD/i,
  /^PASSWD/i,
  /^TOKEN/i,
  /^PRIVATE_KEY/i,
  /^ACCESS_KEY/i,
  /^AUTH/i,
  /^CREDENTIAL/i,
  /^DB_PASS/i,
  /^DATABASE_PASSWORD/i,
  /^AWS_SECRET/i,
  /^STRIPE_SECRET/i,
  /^GITHUB_TOKEN/i,
  /^WEBHOOK_SECRET/i,
];

const WELL_KNOWN_KEYS: Record<string, string> = {
  PORT: 'Should be a valid port number (1–65535)',
  NODE_ENV: 'Should be: development, test, staging, or production',
  DATABASE_URL: 'Connection string format: protocol://user:pass@host:port/db',
  REDIS_URL: 'Connection string format: redis://host:port',
  LOG_LEVEL: 'Should be: debug, info, warn, error, fatal',
};

function stripQuotes(val: string): { value: string; quoteChar: '"' | "'" | '' } {
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    const qc = val[0] as '"' | "'";
    return { value: val.slice(1, -1), quoteChar: qc };
  }
  return { value: val, quoteChar: '' };
}

export function parseAndValidate(input: string): ValidationResult {
  const lines = input.split('\n');
  const variables: EnvVariable[] = [];
  const issues: ValidationIssue[] = [];
  const seenKeys: Map<string, number[]> = new Map();

  let lineNumber = 0;

  for (const rawLine of lines) {
    lineNumber++;
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for export prefix
    let working = trimmed;
    if (working.toLowerCase().startsWith('export ')) {
      working = working.slice(7).trim();
    }

    const eqIdx = working.indexOf('=');
    if (eqIdx === -1) {
      issues.push({
        severity: 'error',
        key: working,
        line: lineNumber,
        message: 'Line does not contain "=" — not a valid key=value pair.',
        category: 'syntax',
      });
      continue;
    }

    const key = working.slice(0, eqIdx).trim();
    const rawValue = working.slice(eqIdx + 1);

    // Inline comment: strip # outside quotes
    let effectiveValue = rawValue;
    let comment = '';
    let inStr = false;
    let strChar = '';
    for (let i = 0; i < rawValue.length; i++) {
      const ch = rawValue[i];
      if (!inStr && (ch === '"' || ch === "'")) {
        inStr = true;
        strChar = ch;
      } else if (inStr && ch === strChar) {
        inStr = false;
      } else if (!inStr && ch === '#') {
        comment = rawValue.slice(i + 1).trim();
        effectiveValue = rawValue.slice(0, i).trimEnd();
        break;
      }
    }

    const { value, quoteChar } = stripQuotes(effectiveValue.trim());

    // Track duplicates
    if (!seenKeys.has(key)) {
      seenKeys.set(key, [lineNumber]);
    } else {
      seenKeys.get(key)!.push(lineNumber);
    }

    variables.push({
      key,
      value,
      rawValue: effectiveValue.trim(),
      lineNumber,
      hasQuotes: quoteChar !== '',
      quoteChar,
      comment,
    });

    // --- Validation rules ---

    // Key must match [A-Z_][A-Z0-9_]*
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push({
        severity: 'error',
        key,
        line: lineNumber,
        message: `Key "${key}" contains invalid characters. Keys should only contain letters, digits, and underscores, and must not start with a digit.`,
        category: 'syntax',
      });
    }

    // Spaces in key
    if (key.includes(' ')) {
      issues.push({
        severity: 'error',
        key,
        line: lineNumber,
        message: `Key "${key}" contains spaces, which are not allowed.`,
        category: 'syntax',
      });
    }

    // Lowercase key warning
    if (key !== key.toUpperCase()) {
      issues.push({
        severity: 'info',
        key,
        line: lineNumber,
        message: `Key "${key}" is not uppercase. Convention is to use uppercase env variable names.`,
        category: 'style',
      });
    }

    // Value with spaces but no quotes
    if (!quoteChar && value.includes(' ') && !value.startsWith('#')) {
      issues.push({
        severity: 'warning',
        key,
        line: lineNumber,
        message: `Value of "${key}" contains spaces but is not quoted. Wrap in quotes: ${key}="${value}"`,
        category: 'syntax',
      });
    }

    // Empty value
    if (value === '') {
      issues.push({
        severity: 'info',
        key,
        line: lineNumber,
        message: `"${key}" has an empty value.`,
        category: 'style',
      });
    }

    // Sensitive key checks
    const isSensitive = SENSITIVE_PATTERNS.some(re => re.test(key));
    if (isSensitive) {
      if (value.length < 8 && value !== '') {
        issues.push({
          severity: 'warning',
          key,
          line: lineNumber,
          message: `"${key}" looks like a sensitive key but its value is very short (${value.length} chars). Verify this is not a weak or placeholder secret.`,
          category: 'security',
        });
      }
      // Common placeholder detection
      const lv = value.toLowerCase();
      if (['secret', 'password', 'changeme', 'test', '1234', 'admin', 'xxx', 'todo', 'fixme', 'placeholder'].includes(lv)) {
        issues.push({
          severity: 'warning',
          key,
          line: lineNumber,
          message: `"${key}" appears to have a placeholder/default secret value ("${value}"). Replace with a real secret before deploying.`,
          category: 'security',
        });
      }
    }

    // Well-known key validation
    if (key === 'PORT') {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 1 || n > 65535) {
        issues.push({
          severity: 'warning',
          key,
          line: lineNumber,
          message: `PORT value "${value}" is not a valid port number (1–65535).`,
          category: 'syntax',
        });
      }
    }

    if (key === 'NODE_ENV') {
      if (!['development', 'test', 'staging', 'production'].includes(value.toLowerCase())) {
        issues.push({
          severity: 'info',
          key,
          line: lineNumber,
          message: `NODE_ENV="${value}" is unusual. Expected: development, test, staging, or production.`,
          category: 'style',
        });
      }
    }

    // Unbalanced quotes
    if ((effectiveValue.trim().startsWith('"') && !effectiveValue.trim().endsWith('"')) ||
        (effectiveValue.trim().startsWith("'") && !effectiveValue.trim().endsWith("'"))) {
      issues.push({
        severity: 'error',
        key,
        line: lineNumber,
        message: `Value of "${key}" has an unbalanced quote.`,
        category: 'syntax',
      });
    }
  }

  // Duplicate key issues
  for (const [key, lines_] of seenKeys.entries()) {
    if (lines_.length > 1) {
      issues.push({
        severity: 'warning',
        key,
        line: lines_[0],
        message: `Key "${key}" is defined ${lines_.length} times (lines: ${lines_.join(', ')}). The last definition wins in most shells.`,
        category: 'duplicate',
      });
    }
  }

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const infos = issues.filter(i => i.severity === 'info').length;
  const duplicates = Array.from(seenKeys.values()).filter(l => l.length > 1).length;
  const emptyValues = variables.filter(v => v.value === '').length;
  const sensitiveKeys = variables.filter(v => SENSITIVE_PATTERNS.some(re => re.test(v.key))).length;

  const summaryParts: string[] = [
    `${variables.length} variable${variables.length !== 1 ? 's' : ''} parsed`,
  ];
  if (errors > 0) summaryParts.push(`${errors} error${errors !== 1 ? 's' : ''}`);
  if (warnings > 0) summaryParts.push(`${warnings} warning${warnings !== 1 ? 's' : ''}`);
  if (duplicates > 0) summaryParts.push(`${duplicates} duplicate key${duplicates !== 1 ? 's' : ''}`);
  if (sensitiveKeys > 0) summaryParts.push(`${sensitiveKeys} sensitive key${sensitiveKeys !== 1 ? 's' : ''} detected`);

  return {
    variables,
    issues,
    stats: {
      total: variables.length,
      valid: variables.length - errors,
      errors,
      warnings,
      infos,
      duplicates,
      emptyValues,
      sensitiveKeys,
    },
    summary: summaryParts.join(', '),
  };
}

export function formatValidationResult(result: ValidationResult): string {
  if (result.variables.length === 0 && result.issues.length === 0) return '';

  const lines: string[] = [];

  lines.push('=== ENV VALIDATION RESULT ===');
  lines.push('');
  lines.push('Summary: ' + result.summary);
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('✓ No issues found — .env file looks clean!');
    lines.push('');
  } else {
    lines.push('--- Issues ---');
    for (const issue of result.issues) {
      const badge = issue.severity === 'error' ? '[ERROR]' : issue.severity === 'warning' ? '[WARN] ' : '[INFO] ';
      lines.push(`${badge} Line ${issue.line} (${issue.key}): ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('--- Parsed Variables ---');
  lines.push(
    padRight('KEY', 28) + padRight('VALUE', 35) + 'QUOTES'
  );
  lines.push('-'.repeat(72));
  for (const v of result.variables) {
    const displayValue = v.value.length > 32 ? v.value.slice(0, 32) + '...' : v.value || '(empty)';
    const sensitive = SENSITIVE_PATTERNS.some(re => re.test(v.key));
    const maskedValue = sensitive && v.value.length > 0 ? v.value[0] + '*'.repeat(Math.min(v.value.length - 1, 6)) + ' [sensitive]' : displayValue;
    lines.push(padRight(v.key, 28) + padRight(maskedValue, 35) + (v.hasQuotes ? v.quoteChar + '...' + v.quoteChar : 'none'));
  }

  return lines.join('\n');
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len - 1) + ' ' : str + ' '.repeat(len - str.length);
}
