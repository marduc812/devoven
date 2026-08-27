// ─── Changelog Generator Logic ───────────────────────────────────────────────

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
  | 'revert'
  | 'other';

export type ParsedCommit = {
  raw: string;
  type: CommitType;
  scope?: string;
  breaking: boolean;
  description: string;
};

export type VersionBump = 'major' | 'minor' | 'patch' | 'none';

export type ChangelogResult = {
  groups: Record<CommitType, ParsedCommit[]>;
  versionBump: VersionBump;
  bumpReason: string;
  markdown: string;
};

const TYPE_LABELS: Record<CommitType, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  docs: 'Documentation',
  style: 'Styles',
  refactor: 'Code Refactoring',
  perf: 'Performance Improvements',
  test: 'Tests',
  chore: 'Chores',
  ci: 'Continuous Integration',
  build: 'Build System',
  revert: 'Reverts',
  other: 'Other Changes',
};

const TYPE_ORDER: CommitType[] = [
  'feat', 'fix', 'perf', 'refactor', 'docs',
  'style', 'test', 'build', 'ci', 'chore', 'revert', 'other',
];

export function parseCommit(line: string): ParsedCommit {
  const trimmed = line.trim();

  // Conventional commit: type(scope)!: description  or  type!: description
  const ccRegex = /^([a-z]+)(\(([^)]+)\))?(!)?\s*:\s*(.+)$/i;
  const match = trimmed.match(ccRegex);

  if (match) {
    const rawType = match[1].toLowerCase();
    const scope = match[3] ?? undefined;
    const breaking = match[4] === '!';
    const description = match[5].trim();

    const knownTypes: CommitType[] = [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'build', 'revert',
    ];
    const type: CommitType = (knownTypes as string[]).includes(rawType)
      ? (rawType as CommitType)
      : 'other';

    return { raw: trimmed, type, scope, breaking, description };
  }

  // Not conventional — put in "other"
  return {
    raw: trimmed,
    type: 'other',
    breaking: false,
    description: trimmed,
  };
}

export function parseAllCommits(input: string): ParsedCommit[] {
  return input
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(parseCommit);
}

export function determineVersionBump(commits: ParsedCommit[]): { bump: VersionBump; reason: string } {
  const hasBreaking = commits.some(c => c.breaking);
  if (hasBreaking) return { bump: 'major', reason: 'Breaking change detected (! suffix)' };

  const hasFeature = commits.some(c => c.type === 'feat');
  if (hasFeature) return { bump: 'minor', reason: 'New feature(s) added' };

  const hasFix = commits.some(c => ['fix', 'perf', 'revert'].includes(c.type));
  if (hasFix) return { bump: 'patch', reason: 'Bug fix / patch change' };

  if (commits.length === 0) return { bump: 'none', reason: 'No commits' };
  return { bump: 'patch', reason: 'Non-feature, non-fix changes' };
}

export function generateChangelog(input: string, version?: string): ChangelogResult {
  const commits = parseAllCommits(input);
  const { bump, reason } = determineVersionBump(commits);

  // Group by type
  const groups = {} as Record<CommitType, ParsedCommit[]>;
  for (const t of TYPE_ORDER) groups[t] = [];
  for (const c of commits) groups[c.type].push(c);

  // Build markdown
  const dateStr = new Date().toISOString().split('T')[0];
  const versionStr = version ? `## [${version}] - ${dateStr}` : `## [Unreleased] - ${dateStr}`;

  const lines: string[] = [versionStr, ''];

  // Bump suggestion header
  lines.push(`<!-- Suggested version bump: **${bump.toUpperCase()}** — ${reason} -->`);
  lines.push('');

  for (const type of TYPE_ORDER) {
    const list = groups[type];
    if (list.length === 0) continue;
    lines.push(`### ${TYPE_LABELS[type]}`);
    lines.push('');
    for (const c of list) {
      const breakingMark = c.breaking ? ' **BREAKING CHANGE**' : '';
      const scopePart = c.scope ? ` **${c.scope}**:` : '';
      lines.push(`- ${scopePart}${breakingMark} ${c.description}`);
    }
    lines.push('');
  }

  return {
    groups,
    versionBump: bump,
    bumpReason: reason,
    markdown: lines.join('\n').trimEnd(),
  };
}
