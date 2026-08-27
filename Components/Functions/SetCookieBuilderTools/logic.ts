// Set-Cookie Header Builder logic

export type CookieAttributes = {
  name: string;
  value: string;
  path: string;
  domain: string;
  maxAge: string;
  expires: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | '';
};

export type CookieSecurityAnalysis = {
  warnings: string[];
  score: number; // 0-100
};

export function buildSetCookieHeader(attrs: CookieAttributes): string {
  if (!attrs.name) return '';

  const parts: string[] = [`${attrs.name}=${attrs.value}`];

  if (attrs.path) parts.push(`Path=${attrs.path}`);
  if (attrs.domain) parts.push(`Domain=${attrs.domain}`);
  if (attrs.maxAge !== '') parts.push(`Max-Age=${attrs.maxAge}`);
  if (attrs.expires) parts.push(`Expires=${new Date(attrs.expires).toUTCString()}`);
  if (attrs.httpOnly) parts.push('HttpOnly');
  if (attrs.secure) parts.push('Secure');
  if (attrs.sameSite) parts.push(`SameSite=${attrs.sameSite}`);

  return `Set-Cookie: ${parts.join('; ')}`;
}

export function analyzeSetCookie(attrs: CookieAttributes): CookieSecurityAnalysis {
  const warnings: string[] = [];
  let score = 100;

  if (!attrs.httpOnly) {
    warnings.push('Missing HttpOnly flag — cookie accessible via JavaScript (XSS risk)');
    score -= 30;
  }
  if (!attrs.secure) {
    warnings.push('Missing Secure flag — cookie sent over plain HTTP');
    score -= 30;
  }
  if (!attrs.sameSite) {
    warnings.push('Missing SameSite attribute — vulnerable to CSRF attacks');
    score -= 20;
  }
  if (attrs.sameSite === 'None' && !attrs.secure) {
    warnings.push('SameSite=None requires Secure flag');
    score -= 10;
  }
  if (!attrs.path) {
    warnings.push('No Path set — cookie sent for all paths');
  }
  if (!attrs.maxAge && !attrs.expires) {
    warnings.push('No expiry set — session cookie (expires when browser closes)');
  }

  return { warnings, score: Math.max(0, score) };
}

export type ParsedCookieHeader = {
  name: string;
  value: string;
  attributes: Record<string, string | boolean>;
  security: CookieSecurityAnalysis;
  formatted: string;
};

export function parseSetCookieString(raw: string): ParsedCookieHeader | null {
  const line = raw.trim().replace(/^Set-Cookie:\s*/i, '');
  if (!line) return null;

  const parts = line.split(';').map(p => p.trim());
  const [nameValuePart, ...attrParts] = parts;

  const eqIdx = (nameValuePart || '').indexOf('=');
  if (eqIdx === -1) return null;

  const name = nameValuePart.slice(0, eqIdx).trim();
  const value = nameValuePart.slice(eqIdx + 1).trim();

  const attributes: Record<string, string | boolean> = {};

  for (const attr of attrParts) {
    const eqI = attr.indexOf('=');
    if (eqI === -1) {
      attributes[attr.toLowerCase()] = true;
    } else {
      attributes[attr.slice(0, eqI).trim().toLowerCase()] = attr.slice(eqI + 1).trim();
    }
  }

  const cookieAttrs: CookieAttributes = {
    name,
    value,
    path: (attributes['path'] as string) || '',
    domain: (attributes['domain'] as string) || '',
    maxAge: (attributes['max-age'] as string) || '',
    expires: '',
    httpOnly: !!attributes['httponly'],
    secure: !!attributes['secure'],
    sameSite: ((attributes['samesite'] as string) || '') as CookieAttributes['sameSite'],
  };

  const security = analyzeSetCookie(cookieAttrs);

  const lines: string[] = [
    `Name:      ${name}`,
    `Value:     ${value}`,
  ];

  for (const [k, v] of Object.entries(attributes)) {
    lines.push(`${k.charAt(0).toUpperCase() + k.slice(1).padEnd(9)} ${v === true ? '(flag)' : v}`);
  }

  lines.push('');
  lines.push(`Security Score: ${security.score}/100`);
  if (security.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of security.warnings) {
      lines.push(`  - ${w}`);
    }
  } else {
    lines.push('No security issues found.');
  }

  return { name, value, attributes, security, formatted: lines.join('\n') };
}
