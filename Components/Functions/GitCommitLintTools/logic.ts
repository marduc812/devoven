// Git Commit Message Linter logic

export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'chore'
  | 'ci'
  | 'build'
  | 'revert';

export const COMMIT_TYPES: CommitType[] = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert',
];

export const COMMIT_TYPE_DESCRIPTIONS: Record<CommitType, string> = {
  feat: 'New feature',
  fix: 'Bug fix',
  docs: 'Documentation changes',
  style: 'Formatting, missing semicolons, etc. (no code change)',
  refactor: 'Code refactoring (no feature/fix)',
  perf: 'Performance improvement',
  test: 'Adding or fixing tests',
  chore: 'Build process or auxiliary tool changes',
  ci: 'CI/CD configuration changes',
  build: 'Build system changes',
  revert: 'Reverts a previous commit',
};

export type ParsedCommit = {
  type: string | null;
  scope: string | null;
  isBreaking: boolean;
  subject: string;
  body: string;
  footer: string;
  raw: string;
};

export type LintIssue = {
  severity: 'error' | 'warning' | 'info';
  message: string;
};

export type LintResult = {
  valid: boolean;
  parsed: ParsedCommit;
  issues: LintIssue[];
  score: number; // 0-100
  formatted: string;
};

// Conventional commits header regex: type(scope)!: subject
const HEADER_RE = /^([a-z]+)(\([^)]+\))?(!)?: (.+)$/;

export function parseCommit(raw: string): ParsedCommit {
  const lines = raw.split('\n');
  const header = lines[0] || '';
  const rest = lines.slice(1);

  // Find body (after blank line following header)
  let bodyStart = -1;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].trim() === '') {
      bodyStart = i + 1;
      break;
    }
  }

  let body = '';
  let footer = '';

  if (bodyStart >= 0) {
    const bodyLines = rest.slice(bodyStart);
    // Footer starts with token: or BREAKING CHANGE:
    const footerStart = bodyLines.findIndex(l => /^(BREAKING CHANGE:|[\w-]+: |[\w-]+ #)/.test(l));
    if (footerStart >= 0) {
      body = bodyLines.slice(0, footerStart).join('\n').trim();
      footer = bodyLines.slice(footerStart).join('\n').trim();
    } else {
      body = bodyLines.join('\n').trim();
    }
  }

  const match = HEADER_RE.exec(header);
  if (!match) {
    return { type: null, scope: null, isBreaking: false, subject: header, body, footer, raw };
  }

  return {
    type: match[1],
    scope: match[2] ? match[2].slice(1, -1) : null,
    isBreaking: match[3] === '!' || footer.startsWith('BREAKING CHANGE:'),
    subject: match[4],
    body,
    footer,
    raw,
  };
}

const IMPERATIVE_NON_STARTERS = [
  'added', 'fixed', 'updated', 'changed', 'removed', 'created',
  'modified', 'deleted', 'implemented', 'refactored', 'improved',
  'adjusted', 'cleaned', 'moved', 'renamed', 'replaced', 'used',
];

export function lintCommit(raw: string): LintResult {
  const parsed = parseCommit(raw);
  const issues: LintIssue[] = [];
  const header = raw.split('\n')[0] || '';

  // 1. Type check
  if (!parsed.type) {
    issues.push({ severity: 'error', message: 'Missing commit type (e.g. feat, fix, docs)' });
  } else if (!(COMMIT_TYPES as string[]).includes(parsed.type)) {
    issues.push({
      severity: 'error',
      message: `Unknown type "${parsed.type}". Valid: ${COMMIT_TYPES.join(', ')}`,
    });
  }

  // 2. Subject length
  if (header.length > 72) {
    issues.push({
      severity: 'error',
      message: `Header too long (${header.length} chars). Max: 72`,
    });
  } else if (header.length > 50) {
    issues.push({
      severity: 'warning',
      message: `Header is ${header.length} chars. Recommended max: 50`,
    });
  }

  // 3. Subject
  if (parsed.subject) {
    // Should not end with period
    if (parsed.subject.endsWith('.')) {
      issues.push({ severity: 'warning', message: 'Subject should not end with a period' });
    }

    // Should not start with capital
    if (/^[A-Z]/.test(parsed.subject)) {
      issues.push({ severity: 'warning', message: 'Subject should start with lowercase' });
    }

    // Imperative mood check
    const firstWord = parsed.subject.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (IMPERATIVE_NON_STARTERS.includes(firstWord)) {
      issues.push({
        severity: 'warning',
        message: `Subject "${firstWord}" is past tense. Use imperative mood (e.g. "add" not "added")`,
      });
    }

    if (!parsed.subject.trim()) {
      issues.push({ severity: 'error', message: 'Subject is empty' });
    }
  }

  // 4. Body blank line
  const lines = raw.split('\n');
  if (lines.length > 1 && lines[1].trim() !== '') {
    issues.push({ severity: 'error', message: 'Second line must be blank (separate header from body)' });
  }

  // 5. Breaking change
  if (parsed.isBreaking) {
    issues.push({ severity: 'info', message: 'Breaking change detected — bump major version' });
  }

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  const score = Math.max(0, 100 - errors * 25 - warnings * 10);
  const valid = errors === 0;

  // Formatted output
  const formattedLines: string[] = [];
  formattedLines.push('=== Conventional Commit Lint Report ===\n');
  formattedLines.push(`Score: ${score}/100 | Valid: ${valid ? 'YES' : 'NO'}`);
  formattedLines.push('');

  formattedLines.push('--- Parsed Commit ---');
  formattedLines.push(`Type:     ${parsed.type || '(missing)'}`);
  if (parsed.type && (COMMIT_TYPES as string[]).includes(parsed.type)) {
    formattedLines.push(`          ${COMMIT_TYPE_DESCRIPTIONS[parsed.type as CommitType]}`);
  }
  formattedLines.push(`Scope:    ${parsed.scope || '(none)'}`);
  formattedLines.push(`Breaking: ${parsed.isBreaking ? 'YES' : 'No'}`);
  formattedLines.push(`Subject:  ${parsed.subject || '(empty)'}`);
  if (parsed.body) formattedLines.push(`Body:\n${parsed.body}`);
  if (parsed.footer) formattedLines.push(`Footer:\n${parsed.footer}`);

  if (issues.length > 0) {
    formattedLines.push('');
    formattedLines.push('--- Issues ---');
    for (const issue of issues) {
      const prefix =
        issue.severity === 'error' ? '[ERROR]' :
        issue.severity === 'warning' ? '[WARN] ' :
        '[INFO] ';
      formattedLines.push(`${prefix} ${issue.message}`);
    }
  } else {
    formattedLines.push('');
    formattedLines.push('No issues found. Commit message is valid!');
  }

  return { valid, parsed, issues, score, formatted: formattedLines.join('\n') };
}
