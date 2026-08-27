// ─── B1. HTTP Cookie Parser ───────────────────────────────────────────────────

export type ParsedCookie = {name: string; value: string};
export type ParsedSetCookie = {
  name: string; value: string;
  expires?: string; maxAge?: number;
  domain?: string; path?: string;
  secure: boolean; httpOnly: boolean; sameSite?: string;
};

export function parseCookieHeader(header: string): ParsedCookie[] {
  if (!header.trim()) return [];
  return header.split(';').map(part => {
    const eq = part.indexOf('=');
    if (eq === -1) return {name: part.trim(), value: ''};
    return {name: part.slice(0, eq).trim(), value: part.slice(eq + 1).trim()};
  }).filter(c => c.name);
}

export function parseSetCookieHeader(header: string): ParsedSetCookie {
  if (!header.trim()) throw new Error('Empty Set-Cookie header');
  const parts = header.split(';').map(p => p.trim());
  const firstEq = parts[0].indexOf('=');
  const name = parts[0].slice(0, firstEq).trim();
  const value = parts[0].slice(firstEq + 1).trim();

  const attrs: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq === -1) attrs[part.toLowerCase()] = 'true';
    else attrs[part.slice(0, eq).toLowerCase().trim()] = part.slice(eq + 1).trim();
  }

  return {
    name, value,
    expires: attrs['expires'],
    maxAge: attrs['max-age'] ? parseInt(attrs['max-age']) : undefined,
    domain: attrs['domain'],
    path: attrs['path'],
    secure: 'secure' in attrs,
    httpOnly: 'httponly' in attrs,
    sameSite: attrs['samesite'],
  };
}

export function formatParsedCookies(cookies: ParsedCookie[]): string {
  if (cookies.length === 0) return 'No cookies found';
  return cookies.map(c => `${c.name} = ${c.value}`).join('\n');
}

export function formatSetCookie(c: ParsedSetCookie): string {
  return [
    `Name:      ${c.name}`,
    `Value:     ${c.value}`,
    c.expires ? `Expires:   ${c.expires}` : null,
    c.maxAge !== undefined ? `Max-Age:   ${c.maxAge}s` : null,
    c.domain ? `Domain:    ${c.domain}` : null,
    c.path ? `Path:      ${c.path}` : null,
    `Secure:    ${c.secure}`,
    `HttpOnly:  ${c.httpOnly}`,
    c.sameSite ? `SameSite:  ${c.sameSite}` : null,
  ].filter(Boolean).join('\n');
}
