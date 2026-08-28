export const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'] as const;
export type CommitType = typeof COMMIT_TYPES[number];

export interface CommitOptions {
  type: CommitType;
  scope?: string;
  breaking?: boolean;
  description: string;
  body?: string;
  footer?: string;
}

export function buildCommitMessage(opts: CommitOptions): string {
  const { type, scope, breaking, description, body, footer } = opts;
  if (!description.trim()) throw new Error('Description is required');

  const header = `${type}${scope ? `(${scope})` : ''}${breaking ? '!' : ''}: ${description}`;
  const parts = [header];
  if (body) parts.push('', body);
  if (footer) parts.push('', footer);
  if (breaking && !footer?.includes('BREAKING CHANGE')) {
    parts.push('', `BREAKING CHANGE: ${description}`);
  }
  return parts.join('\n');
}

export function parseCommitInput(input: string): string {
  // Input format:
  // type: feat
  // scope: auth
  // breaking: true
  // description: add OAuth2 support
  // body: Implements RFC 6749 authorization code flow
  // footer: Closes #123

  const lines = input.trim().split('\n');
  const props: Record<string, string> = {};
  const bodyLines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (inBody) { bodyLines.push(line); continue; }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { inBody = true; bodyLines.push(line); continue; }
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (['type','scope','breaking','description','body','footer'].includes(key)) {
      props[key] = value;
    } else {
      inBody = true;
      bodyLines.push(line);
    }
  }

  const type = (props['type'] || 'feat') as CommitType;
  if (!COMMIT_TYPES.includes(type)) throw new Error(`Unknown type: ${type}. Use: ${COMMIT_TYPES.join(', ')}`);

  return buildCommitMessage({
    type,
    scope: props['scope'],
    breaking: props['breaking'] === 'true',
    description: props['description'] || '',
    body: props['body'] || bodyLines.join('\n') || undefined,
    footer: props['footer'],
  });
}

export function getCommitTemplate(): string {
  return [
    `type: feat`,
    `scope: ui`,
    `breaking: false`,
    `description: add dark mode toggle`,
    `body: Implements theme switching with localStorage persistence`,
    `footer: Closes #42`,
  ].join('\n');
}
