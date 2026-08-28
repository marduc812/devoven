// ─── B1. CSS Specificity Calculator ──────────────────────────────────────────

export type SpecificityScore = { ids: number; classes: number; elements: number; score: string };

export function calculateSpecificity(selector: string): SpecificityScore {
  if (!selector.trim()) throw new Error('Empty selector');
  let ids = 0, classes = 0, elements = 0;

  // Strip pseudo-elements and strings to avoid false matches
  let s = selector
    .replace(/::[\w-]+/g, ' ') // pseudo-elements → element
    .replace(/:not\(([^)]+)\)/g, ' $1 ') // :not() contents count
    .replace(/\[[^\]]+\]/g, ' [attr] ') // attributes
    .replace(/"[^"]*"|'[^']*'/g, ''); // quoted strings

  // Count IDs (#foo)
  ids = (s.match(/#[\w-]+/g) ?? []).length;
  s = s.replace(/#[\w-]+/g, '');

  // Count classes (.foo), attributes ([attr]), pseudo-classes (:hover)
  classes = (s.match(/\.[\w-]+/g) ?? []).length +
    (s.match(/\[attr\]/g) ?? []).length +
    (s.match(/:[\w-]+(?:\([^)]*\))?/g) ?? []).length;
  s = s.replace(/\.[\w-]+/g, '').replace(/\[attr\]/g, '').replace(/:[\w-]+(?:\([^)]*\))?/g, '');

  // Count elements (div, span, etc.) — exclude universal selector *
  elements = (s.match(/\b[a-zA-Z][\w-]*/g) ?? []).filter(e => e !== '*').length;

  const score = `(${ids}, ${classes}, ${elements})`;
  return { ids, classes, elements, score };
}

export function compareSpecificity(a: SpecificityScore, b: SpecificityScore): 'A wins' | 'B wins' | 'Equal' {
  if (a.ids !== b.ids) return a.ids > b.ids ? 'A wins' : 'B wins';
  if (a.classes !== b.classes) return a.classes > b.classes ? 'A wins' : 'B wins';
  if (a.elements !== b.elements) return a.elements > b.elements ? 'A wins' : 'B wins';
  return 'Equal';
}

// ─── B2. Semver Comparator ────────────────────────────────────────────────────

export type SemVer = { major: number; minor: number; patch: number; prerelease: string; build: string; valid: boolean };

export function parseSemver(version: string): SemVer {
  const v = version.trim().replace(/^v/, '');
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
  if (!match) return { major: 0, minor: 0, patch: 0, prerelease: '', build: '', valid: false };
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4] ?? '',
    build: match[5] ?? '',
    valid: true,
  };
}

export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a), pb = parseSemver(b);
  if (!pa.valid || !pb.valid) throw new Error('Invalid semver string');
  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  // Prerelease: version without prerelease > version with prerelease
  if (pa.prerelease && !pb.prerelease) return -1;
  if (!pa.prerelease && pb.prerelease) return 1;
  if (pa.prerelease < pb.prerelease) return -1;
  if (pa.prerelease > pb.prerelease) return 1;
  return 0;
}

export function semverSatisfies(version: string, range: string): boolean {
  // Simple range: ^1.2.3 (compatible), ~1.2.3 (patch), >=1.0.0, >1.0.0, <=2.0.0, <2.0.0, =1.0.0
  const v = parseSemver(version);
  if (!v.valid) return false;
  const trimmed = range.trim();

  if (trimmed.startsWith('^')) {
    const min = parseSemver(trimmed.slice(1));
    if (!min.valid) return false;
    if (v.major !== min.major) return false;
    return compareSemver(version, trimmed.slice(1)) >= 0;
  }
  if (trimmed.startsWith('~')) {
    const min = parseSemver(trimmed.slice(1));
    if (!min.valid) return false;
    if (v.major !== min.major || v.minor !== min.minor) return false;
    return compareSemver(version, trimmed.slice(1)) >= 0;
  }
  if (trimmed.startsWith('>=')) return compareSemver(version, trimmed.slice(2)) >= 0;
  if (trimmed.startsWith('>')) return compareSemver(version, trimmed.slice(1)) > 0;
  if (trimmed.startsWith('<=')) return compareSemver(version, trimmed.slice(2)) <= 0;
  if (trimmed.startsWith('<')) return compareSemver(version, trimmed.slice(1)) < 0;
  if (trimmed.startsWith('=')) return compareSemver(version, trimmed.slice(1)) === 0;
  return compareSemver(version, trimmed) === 0;
}

export function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const v = parseSemver(version);
  if (!v.valid) throw new Error('Invalid semver');
  if (type === 'major') return `${v.major + 1}.0.0`;
  if (type === 'minor') return `${v.major}.${v.minor + 1}.0`;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}
