export type TtlUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export interface TtlResult {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  cacheControl: string;
  expires: string;
  cloudflareCacheControl: string;
  fastlySurrogateControl: string;
  varnishBereqHttp: string;
}

export interface CacheControlDirective {
  directive: string;
  value: string | null;
  description: string;
}

export function toSeconds(value: number, unit: TtlUnit): number {
  switch (unit) {
    case 'seconds': return value;
    case 'minutes': return value * 60;
    case 'hours': return value * 3600;
    case 'days': return value * 86400;
  }
}

export function formatExpires(nowMs: number, ttlSeconds: number): string {
  const d = new Date(nowMs + ttlSeconds * 1000);
  return d.toUTCString();
}

export function calculateTtl(value: number, unit: TtlUnit, nowMs: number): TtlResult {
  if (value <= 0) throw new Error('TTL value must be greater than 0');
  const s = toSeconds(value, unit);
  const revalidate = Math.floor(s * 0.1); // 10% stale-while-revalidate
  const staleError = Math.floor(s * 0.5); // 50% stale-if-error

  const cacheControl = `max-age=${s}, s-maxage=${s}, stale-while-revalidate=${revalidate}, stale-if-error=${staleError}`;
  const expires = formatExpires(nowMs, s);

  // Cloudflare: uses standard Cache-Control but also supports cf-cache-status
  const cloudflareCacheControl = `public, max-age=${s}, s-maxage=${s}`;

  // Fastly: uses Surrogate-Control header
  const fastlySurrogateControl = `max-age=${s}`;

  // Varnish: set in VCL via beresp.ttl
  const varnishBereqHttp = `# In VCL:\nset beresp.ttl = ${s}s;\nset beresp.grace = ${revalidate}s;\nset beresp.keep = ${staleError}s;`;

  return {
    seconds: s,
    minutes: s / 60,
    hours: s / 3600,
    days: s / 86400,
    cacheControl,
    expires,
    cloudflareCacheControl,
    fastlySurrogateControl,
    varnishBereqHttp,
  };
}

export function formatTtlResult(result: TtlResult): string {
  const lines: string[] = [
    '=== TTL in All Units ===',
    `Seconds : ${result.seconds}`,
    `Minutes : ${result.minutes.toFixed(4)}`,
    `Hours   : ${result.hours.toFixed(6)}`,
    `Days    : ${result.days.toFixed(8)}`,
    '',
    '=== HTTP Headers ===',
    `Cache-Control: ${result.cacheControl}`,
    `Expires: ${result.expires}`,
    '',
    '=== CDN Equivalents ===',
    '-- Cloudflare --',
    `Cache-Control: ${result.cloudflareCacheControl}`,
    '',
    '-- Fastly --',
    `Surrogate-Control: ${result.fastlySurrogateControl}`,
    '',
    '-- Varnish --',
    result.varnishBereqHttp,
  ];
  return lines.join('\n');
}

// Directive reference table
const KNOWN_DIRECTIVES: Record<string, string> = {
  'max-age': 'Maximum time (seconds) the response can be cached by any cache (browser or CDN).',
  's-maxage': 'Overrides max-age for shared/proxy caches (CDNs). Browser ignores this.',
  'no-cache': 'Must revalidate with server before using cached copy. Does NOT mean "do not cache".',
  'no-store': 'Do NOT cache the response anywhere. Use for sensitive data.',
  'public': 'Response can be cached by any cache, including CDNs.',
  'private': 'Response is user-specific; only browser cache should store it.',
  'must-revalidate': 'Cache must revalidate with origin after max-age expires.',
  'proxy-revalidate': 'Like must-revalidate but only for shared/proxy caches.',
  'stale-while-revalidate': 'Serve stale content for N seconds while fetching fresh in background.',
  'stale-if-error': 'Serve stale content for N seconds if origin returns error.',
  'immutable': 'Response will never change during max-age. Browser skips conditional requests.',
};

export function parseCacheControl(header: string): CacheControlDirective[] {
  const parts = header.split(',').map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    const eqIdx = part.indexOf('=');
    let directive: string;
    let value: string | null = null;
    if (eqIdx !== -1) {
      directive = part.slice(0, eqIdx).trim().toLowerCase();
      value = part.slice(eqIdx + 1).trim();
    } else {
      directive = part.trim().toLowerCase();
    }
    const description = KNOWN_DIRECTIVES[directive] || 'Unknown directive.';
    return { directive, value, description };
  });
}

export function formatCacheControlParsed(directives: CacheControlDirective[]): string {
  if (directives.length === 0) return 'No directives found.';
  const lines: string[] = ['=== Cache-Control Directives ===', ''];
  for (const d of directives) {
    const valStr = d.value !== null ? ` = ${d.value}` : '';
    lines.push(`${d.directive}${valStr}`);
    lines.push(`  ${d.description}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

export type CacheTtlMode = 'calculate' | 'parse';

export function processCacheTtl(
  input: string,
  mode: CacheTtlMode,
  unit: TtlUnit,
  nowMs: number
): string {
  if (!input.trim()) return '';
  if (mode === 'parse') {
    const directives = parseCacheControl(input);
    return formatCacheControlParsed(directives);
  }
  const value = parseFloat(input.trim());
  if (isNaN(value)) throw new Error('Enter a numeric TTL value');
  const result = calculateTtl(value, unit, nowMs);
  return formatTtlResult(result);
}
