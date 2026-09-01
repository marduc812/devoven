// Defanging turns a live indicator into something that cannot be clicked,
// resolved or auto-linked by a mail client or ticketing system:
// http://evil.com  ->  hxxp://evil[.]com
// Fanging reverses it, and has to tolerate every dialect an analyst may paste.

export type DotStyle = 'brackets' | 'parens' | 'word';
export type DefangScope = 'indicators' | 'everything';

export type DefangOptions = {
  dotStyle: DotStyle;
  scheme: boolean;    // http:// -> hxxp://
  separator: boolean; // ://     -> [://]
  at: boolean;        // @       -> [@]
  scope: DefangScope;
};

export const defaultDefangOptions: DefangOptions = {
  dotStyle: 'brackets',
  scheme: true,
  separator: false,
  at: true,
  scope: 'indicators',
};

const DOT_REPLACEMENT: Record<DotStyle, string> = {
  brackets: '[.]',
  parens: '(.)',
  word: '[dot]',
};

// Suffixes that look like a TLD but are almost always a filename. `.com` is
// deliberately absent: a COM executable is rarer than a .com domain.
const FILE_SUFFIXES = new Set([
  'bat', 'bin', 'conf', 'csv', 'dat', 'dll', 'doc', 'docx', 'exe', 'gif', 'htm',
  'html', 'ini', 'jar', 'jpeg', 'jpg', 'js', 'json', 'log', 'md', 'msi', 'pdf',
  'php', 'png', 'ps1', 'py', 'rar', 'sh', 'so', 'svg', 'tmp', 'ts', 'tsx', 'txt',
  'xls', 'xlsx', 'xml', 'yaml', 'yml', 'zip',
]);

const URL_SOURCE = String.raw`\b(?:https?|ftps?):\/\/[^\s<>"'\`]+`;
const EMAIL_SOURCE = String.raw`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`;
const IPV4_SOURCE = String.raw`\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b`;
// Three or more groups, so a clock time or a MAC-style pair never matches.
const IPV6_SOURCE = String.raw`\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b|::(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4}\b`;
const DOMAIN_SOURCE = String.raw`\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}\b`;

// URL first so its own dots and @ are handled once, domain last so it only
// catches what nothing more specific claimed.
function indicatorRegex(): RegExp {
  return new RegExp(
    [URL_SOURCE, EMAIL_SOURCE, IPV6_SOURCE, IPV4_SOURCE, DOMAIN_SOURCE].join('|'),
    'g',
  );
}

// "visit http://evil.com." should not swallow the full stop.
function splitTrailing(match: string): [string, string] {
  const trailing = /[.,;:!?)\]}'"]+$/.exec(match);
  if (!trailing) return [match, ''];
  return [match.slice(0, trailing.index), match.slice(trailing.index)];
}

function isFilename(token: string): boolean {
  const suffix = token.slice(token.lastIndexOf('.') + 1).toLowerCase();
  return FILE_SUFFIXES.has(suffix);
}

function isBareIpv6(token: string): boolean {
  return token.includes(':') && !token.includes('://') && !token.includes('.');
}

function applyDefang(text: string, opts: DefangOptions, ipv6 = false): string {
  let out = text;
  if (opts.scheme) {
    out = out.replace(/\bhttp(s?):\/\//gi, (_m, s: string) => `hxxp${s.toLowerCase()}://`);
    out = out.replace(/\bftp(s?):\/\//gi, (_m, s: string) => `fxp${s.toLowerCase()}://`);
  }
  if (opts.separator) out = out.replace(/:\/\//g, '[://]');
  if (ipv6) out = out.replace(/:/g, '[:]');
  out = out.replace(/\./g, DOT_REPLACEMENT[opts.dotStyle]);
  if (opts.at) out = out.replace(/@/g, '[@]');
  return out;
}

export function findIndicators(text: string): string[] {
  const found: string[] = [];
  text.replace(indicatorRegex(), (match) => {
    const [core] = splitTrailing(match);
    if (core && !isFilename(core)) found.push(core);
    return match;
  });
  return [...new Set(found)];
}

export function defangText(text: string, options?: Partial<DefangOptions>): string {
  const opts = { ...defaultDefangOptions, ...options };
  if (!text) return '';
  if (opts.scope === 'everything') return applyDefang(text, opts);

  return text.replace(indicatorRegex(), (match) => {
    const [core, trailing] = splitTrailing(match);
    if (!core || isFilename(core)) return match;
    return applyDefang(core, opts, isBareIpv6(core)) + trailing;
  });
}

export function fangText(text: string): string {
  if (!text) return '';
  let out = text;
  // Brackets, parens, braces or angle brackets, with or without inner spaces.
  out = out.replace(/[[({<]\s*(?::\/\/)\s*[\])}>]/g, '://');
  out = out.replace(/[[({<]\s*:\s*[\])}>]\/\//g, '://');
  out = out.replace(/[[({<]\s*(?:\.|dot|d0t)\s*[\])}>]/gi, '.');
  out = out.replace(/[[({<]\s*(?:@|at)\s*[\])}>]/gi, '@');
  out = out.replace(/[[({<]\s*:\s*[\])}>]/g, ':');
  // hxxp, hXXp, h**p, h__p, and the same for ftp.
  out = out.replace(/\bh(?:xx|\*\*|__)p(s?)\b/gi, (_m, s: string) => `http${s.toLowerCase()}`);
  out = out.replace(/\bf(?:x|\*|_)p(s?)\b/gi, (_m, s: string) => `ftp${s.toLowerCase()}`);
  return out;
}

export function describeDefang(text: string, scope: DefangScope): string {
  if (!text.trim()) return '';
  if (scope === 'everything') return '';
  const count = findIndicators(text).length;
  if (count === 0) return 'no indicators found';
  return `${count} indicator${count === 1 ? '' : 's'}`;
}
