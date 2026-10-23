export type FindingKind = 'Secret' | 'URL' | 'Path';

export type Finding = {
  kind: FindingKind;
  label: string;
  value: string;
  source: string;
  line: number | null;
  dependency: boolean;
};

export type Inspection = {
  sourceCount: number;
  contentCount: number;
  applicationSources: string[];
  dependencySourceCount: number;
  findings: Finding[];
};

const knownSecrets: { label: string; pattern: RegExp }[] = [
  { label: 'AWS access key ID', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { label: 'GitHub token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: 'Stripe secret key', pattern: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/g },
  { label: 'Slack token', pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { label: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
];

// A named assignment catches service keys that do not have a fixed prefix.
const assignedSecret = /\b(?:api[_-]?key|secret|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd|private[_-]?key)\b["'`]?\s*[=:]\s*(["'`])([^"'`\s]{8,})\1/gi;
const absoluteUrl = /\bhttps?:\/\/[^\s"'`<>\\]+/gi;
const quotedPath = /["'`]((?:\/|\.\.?\/)[^"'`\s<>]+)["'`]/g;

function isDependency(source: string): boolean {
  return /(?:^|\/)node_modules\//.test(source);
}

function isSynthetic(source: string): boolean {
  return source.trimStart().startsWith('[synthetic:');
}

function cleanValue(value: string): string {
  return value.replace(/[),;]+$/, '');
}

function isPlaceholder(value: string): boolean {
  return /^(?:your[_-]?|example|sample|dummy|placeholder|changeme|undefined|null|password123)/i.test(value)
    || /^(.)\1{7,}$/.test(value);
}

export function inspectSourceMap(input: string): Inspection {
  let map: unknown;
  try {
    map = JSON.parse(input.replace(/^\)\]\}'\s*/, ''));
  } catch {
    throw new Error('Enter a valid JSON source map.');
  }
  if (!map || typeof map !== 'object' || !('sources' in map) ||
      !Array.isArray(map.sources) || !map.sources.every((source) => typeof source === 'string')) {
    throw new Error('The JSON must contain a source map "sources" array.');
  }

  const sourceMap = map as { sources: string[]; sourcesContent?: unknown; sourceRoot?: unknown };
  const contents = Array.isArray(sourceMap.sourcesContent) ? sourceMap.sourcesContent : [];
  const sourceRoot = typeof sourceMap.sourceRoot === 'string' ? sourceMap.sourceRoot : '';
  const findings: Finding[] = [];
  const seen = new Set<string>();

  function add(kind: FindingKind, label: string, value: string, source: string, line: number | null) {
    const cleaned = cleanValue(value);
    const key = JSON.stringify([kind, cleaned, source, line]);
    if (!cleaned || seen.has(key)) return;
    seen.add(key);
    findings.push({ kind, label, value: cleaned, source, line, dependency: isDependency(source) });
  }

  function scanLine(lineText: string, source: string, line: number) {
    for (const { label, pattern } of knownSecrets) {
      for (const match of lineText.matchAll(pattern)) add('Secret', label, match[0], source, line);
    }
    for (const match of lineText.matchAll(assignedSecret)) {
      const value = match[2];
      if (!isPlaceholder(value)) add('Secret', 'Possible credential', value, source, line);
    }
    for (const match of lineText.matchAll(absoluteUrl)) {
      add('URL', 'Absolute URL', match[0], source, line);
    }
    // Module imports describe bundled files, not routes exposed by the app.
    if (!/^\s*(?:import|export)\b/.test(lineText) && !/\brequire\s*\(/.test(lineText)) {
      for (const match of lineText.matchAll(quotedPath)) {
        if (!/^\/\//.test(match[1]) && match[1] !== '/' && match[1] !== './' && match[1] !== '../') {
          add('Path', 'Referenced path', match[1], source, line);
        }
      }
    }
  }

  sourceMap.sources.forEach((name, index) => {
    const source = sourceRoot + name || `Source ${index + 1}`;
    const content = contents[index];
    if (typeof content !== 'string') return;
    content.split(/\r\n|\n|\r/).forEach((lineText, lineIndex) => {
      scanLine(lineText, source, lineIndex + 1);
    });
  });

  return {
    sourceCount: sourceMap.sources.length,
    contentCount: sourceMap.sources.filter((_, index) => typeof contents[index] === 'string').length,
    applicationSources: sourceMap.sources.map((name) => sourceRoot + name).filter((name) => !isDependency(name) && !isSynthetic(name)),
    dependencySourceCount: sourceMap.sources.filter((name) => isDependency(sourceRoot + name)).length,
    findings,
  };
}
