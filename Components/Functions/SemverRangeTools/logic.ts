// Semver Range Checker logic

export type ParsedSemver = {
  valid: boolean;
  major: number;
  minor: number;
  patch: number;
  preRelease: string;
  buildMeta: string;
  raw: string;
};

export type SemverComparison = {
  a: ParsedSemver;
  b: ParsedSemver;
  result: -1 | 0 | 1;
  label: string;
};

const SEMVER_RE =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function parseSemver(raw: string): ParsedSemver {
  const match = SEMVER_RE.exec(raw.trim());
  if (!match) {
    return { valid: false, major: 0, minor: 0, patch: 0, preRelease: '', buildMeta: '', raw };
  }
  return {
    valid: true,
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] || '',
    buildMeta: match[5] || '',
    raw,
  };
}

function comparePreRelease(a: string, b: string): -1 | 0 | 1 {
  // No pre-release is higher than pre-release
  if (!a && b) return 1;
  if (a && !b) return -1;
  if (!a && !b) return 0;

  const aParts = a.split('.');
  const bParts = b.split('.');
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const ap = aParts[i] ?? '';
    const bp = bParts[i] ?? '';
    if (!ap) return -1;
    if (!bp) return 1;

    const aNum = /^\d+$/.test(ap) ? parseInt(ap, 10) : NaN;
    const bNum = /^\d+$/.test(bp) ? parseInt(bp, 10) : NaN;

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum < bNum) return -1;
      if (aNum > bNum) return 1;
    } else {
      if (ap < bp) return -1;
      if (ap > bp) return 1;
    }
  }
  return 0;
}

export function compareSemver(a: ParsedSemver, b: ParsedSemver): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return comparePreRelease(a.preRelease, b.preRelease);
}

export function semverComparison(rawA: string, rawB: string): SemverComparison {
  const a = parseSemver(rawA);
  const b = parseSemver(rawB);
  const result = compareSemver(a, b);
  let label = '';
  if (result === -1) label = `${rawA.trim()} < ${rawB.trim()}`;
  else if (result === 1) label = `${rawA.trim()} > ${rawB.trim()}`;
  else label = `${rawA.trim()} = ${rawB.trim()}`;
  return { a, b, result, label };
}

export type SemverBumps = {
  nextPatch: string;
  nextMinor: string;
  nextMajor: string;
};

export function nextBumps(sv: ParsedSemver): SemverBumps {
  return {
    nextPatch: `${sv.major}.${sv.minor}.${sv.patch + 1}`,
    nextMinor: `${sv.major}.${sv.minor + 1}.0`,
    nextMajor: `${sv.major + 1}.0.0`,
  };
}

export type RangeCheckResult = {
  satisfied: boolean;
  reason: string;
};

/**
 * Check if `version` satisfies a simple semver range like:
 * ">=1.2.3", ">1.2.3", "<=1.2.3", "<1.2.3", "=1.2.3", "^1.2.3", "~1.2.3"
 * or compound ">=1.0.0 <2.0.0" (space-AND)
 */
export function checkRange(versionRaw: string, rangeRaw: string): RangeCheckResult {
  const version = parseSemver(versionRaw);
  if (!version.valid) return { satisfied: false, reason: 'Invalid version string' };

  const conditions = rangeRaw.trim().split(/\s+AND\s+|\s+(?=[<>=^~])/);

  for (const cond of conditions) {
    const c = cond.trim();
    if (!c) continue;

    let op = '';
    let rest = c;

    if (c.startsWith('>=')) { op = '>='; rest = c.slice(2); }
    else if (c.startsWith('<=')) { op = '<='; rest = c.slice(2); }
    else if (c.startsWith('>')) { op = '>'; rest = c.slice(1); }
    else if (c.startsWith('<')) { op = '<'; rest = c.slice(1); }
    else if (c.startsWith('=')) { op = '='; rest = c.slice(1); }
    else if (c.startsWith('^')) { op = '^'; rest = c.slice(1); }
    else if (c.startsWith('~')) { op = '~'; rest = c.slice(1); }
    else { op = '='; rest = c; }

    const target = parseSemver(rest.trim());
    if (!target.valid) return { satisfied: false, reason: `Invalid range target: ${rest}` };

    const cmp = compareSemver(version, target);

    let ok = false;
    if (op === '>=') ok = cmp >= 0;
    else if (op === '<=') ok = cmp <= 0;
    else if (op === '>') ok = cmp > 0;
    else if (op === '<') ok = cmp < 0;
    else if (op === '=') ok = cmp === 0;
    else if (op === '^') {
      // Compatible with: same major, >= target
      ok = version.major === target.major && cmp >= 0;
    } else if (op === '~') {
      // Approximately: same major.minor, >= target
      ok = version.major === target.major && version.minor === target.minor && cmp >= 0;
    }

    if (!ok) {
      return { satisfied: false, reason: `Fails condition: ${cond}` };
    }
  }

  return { satisfied: true, reason: 'All conditions satisfied' };
}

export function formatSemverReport(raw: string, rangeRaw: string): string {
  const sv = parseSemver(raw);
  if (!sv.valid) return `Error: "${raw}" is not a valid semver string`;

  const lines: string[] = [];
  lines.push('=== Semver Analysis ===\n');
  lines.push(`Input:       ${sv.raw}`);
  lines.push(`Major:       ${sv.major}`);
  lines.push(`Minor:       ${sv.minor}`);
  lines.push(`Patch:       ${sv.patch}`);
  if (sv.preRelease) lines.push(`Pre-release: ${sv.preRelease}`);
  if (sv.buildMeta) lines.push(`Build meta:  ${sv.buildMeta}`);

  const bumps = nextBumps(sv);
  lines.push('');
  lines.push('--- Next Versions ---');
  lines.push(`Next patch: ${bumps.nextPatch}`);
  lines.push(`Next minor: ${bumps.nextMinor}`);
  lines.push(`Next major: ${bumps.nextMajor}`);

  if (rangeRaw.trim()) {
    lines.push('');
    lines.push('--- Range Check ---');
    lines.push(`Range: ${rangeRaw}`);
    const result = checkRange(raw, rangeRaw);
    lines.push(`Satisfied: ${result.satisfied ? 'YES' : 'NO'}`);
    lines.push(`Reason: ${result.reason}`);
  }

  return lines.join('\n');
}
