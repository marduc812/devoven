export interface SecurityRequirements {
  isSpa: boolean;
  hasExternalFonts: boolean;
  hasEmbeds: boolean; // iframes from third parties
  hasAnalytics: boolean;
  hasCdn: boolean;
  hasImages: boolean;
  hasVideos: boolean;
  allowsEmbedding: boolean; // allow this site to be embedded
  hasPayments: boolean;
  hasWebRtc: boolean;
  customDomains: string; // comma-separated external domains
}

export interface SecurityHeader {
  name: string;
  value: string;
  description: string;
  risk: string;
  score: number; // 0-10 contribution to security score
}

export const HEADER_DESCRIPTIONS: Record<string, { description: string; risk: string }> = {
  'Content-Security-Policy': {
    description: 'Defines approved sources for content (scripts, styles, images, etc.). Prevents XSS attacks by blocking unauthorized script execution.',
    risk: 'Cross-Site Scripting (XSS), code injection, data exfiltration',
  },
  'X-Frame-Options': {
    description: 'Controls whether the page can be embedded in an iframe. Prevents clickjacking attacks.',
    risk: 'Clickjacking, UI redressing attacks',
  },
  'X-Content-Type-Options': {
    description: 'Prevents browsers from MIME-sniffing a response away from the declared Content-Type. Stops drive-by download attacks.',
    risk: 'MIME confusion attacks, drive-by downloads',
  },
  'Referrer-Policy': {
    description: 'Controls how much referrer information is sent with requests. Protects user privacy and prevents sensitive URL leakage.',
    risk: 'Privacy leakage, sensitive URL exposure in referrer header',
  },
  'Permissions-Policy': {
    description: 'Controls which browser features and APIs can be used (camera, microphone, geolocation, etc.). Limits attack surface.',
    risk: 'Unauthorized access to browser APIs, feature abuse',
  },
  'Strict-Transport-Security': {
    description: 'Forces HTTPS connections. Prevents protocol downgrade attacks and cookie hijacking over HTTP.',
    risk: 'SSL stripping, HTTP downgrade attacks, man-in-the-middle',
  },
  'Cross-Origin-Embedder-Policy': {
    description: 'Prevents documents from loading cross-origin resources that haven\'t opted in. Required to enable SharedArrayBuffer and high-res timers.',
    risk: 'Spectre-based side-channel attacks, cross-origin data leakage',
  },
  'Cross-Origin-Opener-Policy': {
    description: 'Isolates the browsing context group from cross-origin popups. Prevents cross-origin attacks via window references.',
    risk: 'Cross-origin information leakage via window.opener',
  },
  'Cross-Origin-Resource-Policy': {
    description: 'Prevents other origins from reading your resources. Protects images and scripts from cross-site leaks.',
    risk: 'Cross-site leaks, unauthorized resource inclusion',
  },
};

export function generateSecurityHeaders(req: SecurityRequirements): SecurityHeader[] {
  const headers: SecurityHeader[] = [];
  const extraDomains = req.customDomains
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  // Build CSP
  const cspParts: string[] = ["default-src 'self'"];

  // Script sources
  const scriptSrc: string[] = ["'self'"];
  if (req.isSpa) scriptSrc.push("'unsafe-inline'", "'unsafe-eval'"); // SPAs often need this (prefer nonces in production)
  if (req.hasAnalytics) scriptSrc.push('https://www.googletagmanager.com', 'https://www.google-analytics.com');
  extraDomains.forEach(d => scriptSrc.push(d));
  cspParts.push(`script-src ${scriptSrc.join(' ')}`);

  // Style sources
  const styleSrc: string[] = ["'self'", "'unsafe-inline'"];
  if (req.hasExternalFonts) styleSrc.push('https://fonts.googleapis.com');
  cspParts.push(`style-src ${styleSrc.join(' ')}`);

  // Font sources
  if (req.hasExternalFonts) {
    cspParts.push("font-src 'self' https://fonts.gstatic.com");
  } else {
    cspParts.push("font-src 'self'");
  }

  // Image sources
  const imgSrc: string[] = ["'self'", 'data:'];
  if (req.hasCdn) imgSrc.push('https:');
  if (req.hasAnalytics) imgSrc.push('https://www.google-analytics.com');
  extraDomains.forEach(d => imgSrc.push(d));
  cspParts.push(`img-src ${imgSrc.join(' ')}`);

  // Frame sources
  if (req.hasEmbeds) {
    const frameSrc: string[] = ["'self'"];
    if (req.hasVideos) frameSrc.push('https://www.youtube.com', 'https://player.vimeo.com');
    extraDomains.forEach(d => frameSrc.push(d));
    cspParts.push(`frame-src ${frameSrc.join(' ')}`);
  } else {
    cspParts.push("frame-src 'none'");
  }

  // Connect sources
  const connectSrc: string[] = ["'self'"];
  if (req.hasAnalytics) connectSrc.push('https://www.google-analytics.com', 'https://analytics.google.com');
  if (req.hasWebRtc) connectSrc.push('wss:');
  extraDomains.forEach(d => connectSrc.push(d));
  cspParts.push(`connect-src ${connectSrc.join(' ')}`);

  // Media
  if (req.hasVideos) {
    cspParts.push("media-src 'self' https:");
  }

  // Object (legacy plugins)
  cspParts.push("object-src 'none'");

  // Base URI
  cspParts.push("base-uri 'self'");

  // Form action
  cspParts.push("form-action 'self'");

  // Frame ancestors (controls embedding)
  if (req.allowsEmbedding) {
    cspParts.push("frame-ancestors 'self' https:");
  } else {
    cspParts.push("frame-ancestors 'none'");
  }

  // Upgrade
  cspParts.push('upgrade-insecure-requests');

  headers.push({
    name: 'Content-Security-Policy',
    value: cspParts.join('; '),
    description: HEADER_DESCRIPTIONS['Content-Security-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Content-Security-Policy'].risk,
    score: 30,
  });

  // X-Frame-Options
  headers.push({
    name: 'X-Frame-Options',
    value: req.allowsEmbedding ? 'SAMEORIGIN' : 'DENY',
    description: HEADER_DESCRIPTIONS['X-Frame-Options'].description,
    risk: HEADER_DESCRIPTIONS['X-Frame-Options'].risk,
    score: 10,
  });

  // X-Content-Type-Options
  headers.push({
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    description: HEADER_DESCRIPTIONS['X-Content-Type-Options'].description,
    risk: HEADER_DESCRIPTIONS['X-Content-Type-Options'].risk,
    score: 10,
  });

  // Referrer-Policy
  headers.push({
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    description: HEADER_DESCRIPTIONS['Referrer-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Referrer-Policy'].risk,
    score: 10,
  });

  // Permissions-Policy
  const featureRestrictions: string[] = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    req.hasPayments ? 'payment=(self)' : 'payment=()',
    req.hasWebRtc ? 'camera=(self), microphone=(self)' : 'camera=(), microphone=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'usb=()',
    'interest-cohort=()',
  ];
  headers.push({
    name: 'Permissions-Policy',
    value: featureRestrictions.join(', '),
    description: HEADER_DESCRIPTIONS['Permissions-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Permissions-Policy'].risk,
    score: 10,
  });

  // HSTS
  headers.push({
    name: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
    description: HEADER_DESCRIPTIONS['Strict-Transport-Security'].description,
    risk: HEADER_DESCRIPTIONS['Strict-Transport-Security'].risk,
    score: 15,
  });

  // COEP - only safe if no cross-origin resources without CORP/CORS headers
  const coepSafe = !req.hasEmbeds && !req.hasVideos;
  headers.push({
    name: 'Cross-Origin-Embedder-Policy',
    value: coepSafe ? 'require-corp' : 'unsafe-none',
    description: HEADER_DESCRIPTIONS['Cross-Origin-Embedder-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Cross-Origin-Embedder-Policy'].risk,
    score: coepSafe ? 5 : 0,
  });

  // COOP
  headers.push({
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    description: HEADER_DESCRIPTIONS['Cross-Origin-Opener-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Cross-Origin-Opener-Policy'].risk,
    score: 5,
  });

  // CORP
  headers.push({
    name: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
    description: HEADER_DESCRIPTIONS['Cross-Origin-Resource-Policy'].description,
    risk: HEADER_DESCRIPTIONS['Cross-Origin-Resource-Policy'].risk,
    score: 5,
  });

  return headers;
}

export function calculateSecurityScore(headers: SecurityHeader[]): number {
  return Math.min(100, headers.reduce((sum, h) => sum + h.score, 0));
}

export function headersToText(headers: SecurityHeader[]): string {
  return headers.map(h => `${h.name}: ${h.value}`).join('\n');
}

export function headersToNginxConfig(headers: SecurityHeader[]): string {
  return headers.map(h => `add_header ${h.name} "${h.value.replace(/"/g, '\\"')}";`).join('\n');
}

export function headersToApacheConfig(headers: SecurityHeader[]): string {
  return headers.map(h => `Header always set ${h.name} "${h.value.replace(/"/g, '\\"')}"`).join('\n');
}
