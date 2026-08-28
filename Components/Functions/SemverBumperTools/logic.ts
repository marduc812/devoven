export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export type BumpType = 'major' | 'minor' | 'patch' | 'none';

export interface CommitAnalysis {
  type: string;
  breaking: boolean;
  description: string;
  raw: string;
}

export interface SemverResult {
  currentVersion: string;
  parsedVersion: SemVer;
  bumpType: BumpType;
  newVersion: string;
  reasoning: string[];
  commits: CommitAnalysis[];
}

export function parseSemVer(version: string): SemVer {
  const clean = version.trim().replace(/^v/, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:[-.](.+))?$/);
  if (!match) throw new Error(`Invalid semver: "${version}". Expected format: MAJOR.MINOR.PATCH`);
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

export function bumpVersion(current: SemVer, bumpType: BumpType): SemVer {
  switch (bumpType) {
    case 'major': return { major: current.major + 1, minor: 0, patch: 0 };
    case 'minor': return { major: current.major, minor: current.minor + 1, patch: 0 };
    case 'patch': return { major: current.major, minor: current.minor, patch: current.patch + 1 };
    case 'none': return { major: current.major, minor: current.minor, patch: current.patch };
  }
}

export function formatVersion(v: SemVer): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

const CONVENTIONAL_COMMIT_RE = /^(\w+)(\([^)]+\))?(!)?:\s*(.+)$/;

export function parseCommit(line: string): CommitAnalysis {
  const trimmed = line.trim();
  const match = trimmed.match(CONVENTIONAL_COMMIT_RE);

  if (!match) {
    return { type: 'unknown', breaking: false, description: trimmed, raw: trimmed };
  }

  const type = match[1].toLowerCase();
  const breaking = match[3] === '!' || trimmed.toLowerCase().includes('breaking change');
  const description = match[4] || '';

  return { type, breaking, description, raw: trimmed };
}

export function determineBumpType(commits: CommitAnalysis[]): BumpType {
  if (commits.length === 0) return 'none';

  let hasBreaking = false;
  let hasFeature = false;
  let hasFix = false;

  for (const commit of commits) {
    if (commit.breaking) {
      hasBreaking = true;
    } else if (commit.type === 'feat' || commit.type === 'feature') {
      hasFeature = true;
    } else if (
      commit.type === 'fix' ||
      commit.type === 'perf' ||
      commit.type === 'refactor' ||
      commit.type === 'revert'
    ) {
      hasFix = true;
    }
  }

  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  if (hasFix) return 'patch';
  return 'none';
}

const BUMP_EXPLANATIONS: Record<BumpType, string> = {
  major: 'MAJOR bump: Breaking changes detected (feat! or "BREAKING CHANGE"). Not backward compatible.',
  minor: 'MINOR bump: New features added (feat:) with no breaking changes. Backward compatible.',
  patch: 'PATCH bump: Bug fixes, performance improvements, or refactoring. Backward compatible.',
  none: 'No bump: Only chore, docs, style, test, or ci commits. No version change needed.',
};

const TYPE_LABELS: Record<string, string> = {
  feat: 'Feature',
  feature: 'Feature',
  fix: 'Bug Fix',
  perf: 'Performance',
  refactor: 'Refactor',
  revert: 'Revert',
  chore: 'Chore',
  docs: 'Docs',
  style: 'Style',
  test: 'Test',
  ci: 'CI',
  build: 'Build',
};

export function analyzeSemver(input: string): SemverResult {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) throw new Error('Input is empty');

  const currentVersion = lines[0];
  const parsed = parseSemVer(currentVersion);

  const commitLines = lines.slice(1);
  if (commitLines.length === 0) throw new Error('Enter at least one commit message after the version');

  const commits = commitLines.map(parseCommit);
  const bumpType = determineBumpType(commits);
  const newParsed = bumpVersion(parsed, bumpType);
  const newVersion = formatVersion(newParsed);

  const reasoning: string[] = [BUMP_EXPLANATIONS[bumpType], ''];

  const byType: Record<string, CommitAnalysis[]> = {};
  for (const c of commits) {
    const label = TYPE_LABELS[c.type] || c.type;
    if (!byType[label]) byType[label] = [];
    byType[label].push(c);
  }

  reasoning.push('Commit breakdown:');
  for (const label of Object.keys(byType)) {
    const group = byType[label];
    for (const c of group) {
      const breakingTag = c.breaking ? ' [BREAKING]' : '';
      reasoning.push(`  ${label}${breakingTag}: ${c.description}`);
    }
  }

  return {
    currentVersion,
    parsedVersion: parsed,
    bumpType,
    newVersion,
    reasoning,
    commits,
  };
}

export function formatSemverResult(result: SemverResult): string {
  const bumpLabel = result.bumpType === 'none' ? 'NO BUMP' : result.bumpType.toUpperCase();
  const lines: string[] = [
    `Current Version:  ${result.currentVersion}`,
    `Bump Type:        ${bumpLabel}`,
    `New Version:      ${result.newVersion}`,
    '',
    ...result.reasoning,
  ];
  return lines.join('\n');
}
