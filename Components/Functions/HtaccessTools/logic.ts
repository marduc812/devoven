// ── .htaccess Generator ───────────────────────────────────────────────────────

export interface HtaccessOptions {
  https_redirect: string;
  www_redirect: string;
  no_www_redirect: string;
  directory_listing: string;
  cors: string;
  cache: string;
  block_ips: string;
  error_404: string;
  error_500: string;
  rewrite_base: string;
  custom_redirect_from: string;
  custom_redirect_to: string;
  redirect_type: string;
}

export const HTACCESS_DEFAULTS: HtaccessOptions = {
  https_redirect: 'no',
  www_redirect: 'no',
  no_www_redirect: 'no',
  directory_listing: 'no',
  cors: 'no',
  cache: 'no',
  block_ips: '',
  error_404: '',
  error_500: '',
  rewrite_base: '/',
  custom_redirect_from: '',
  custom_redirect_to: '',
  redirect_type: '301',
};

export function parseHtaccessInput(input: string): HtaccessOptions {
  const opts: HtaccessOptions = Object.assign({}, HTACCESS_DEFAULTS);

  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key in opts) {
      (opts as unknown as Record<string, string>)[key] = val;
    }
  }
  return opts;
}

export function generateHtaccess(input: string): string {
  return buildHtaccess(parseHtaccessInput(input));
}

/** The form talks to this directly; the key=value entry point above parses into it. */
export function buildHtaccess(opts: HtaccessOptions): string {
  const sections: string[] = [];

  sections.push('# Generated .htaccess');
  sections.push('');

  const rewriteNeeded =
    opts.https_redirect === 'yes' ||
    opts.www_redirect === 'yes' ||
    opts.no_www_redirect === 'yes' ||
    (opts.custom_redirect_from !== '' && opts.custom_redirect_to !== '');

  if (rewriteNeeded) {
    sections.push('<IfModule mod_rewrite.c>');
    sections.push('    RewriteEngine On');
    sections.push('    RewriteBase ' + (opts.rewrite_base || '/'));
    sections.push('');

    if (opts.https_redirect === 'yes') {
      sections.push('    # Force HTTPS');
      sections.push('    RewriteCond %{HTTPS} off');
      sections.push('    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
      sections.push('');
    }

    if (opts.www_redirect === 'yes' && opts.no_www_redirect !== 'yes') {
      sections.push('    # Redirect to www');
      sections.push('    RewriteCond %{HTTP_HOST} !^www\\. [NC]');
      sections.push('    RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
      sections.push('');
    }

    if (opts.no_www_redirect === 'yes' && opts.www_redirect !== 'yes') {
      sections.push('    # Redirect to non-www');
      sections.push('    RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]');
      sections.push('    RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]');
      sections.push('');
    }

    if (opts.custom_redirect_from !== '' && opts.custom_redirect_to !== '') {
      const rType = opts.redirect_type === '302' ? '302' : '301';
      sections.push('    # Custom redirect');
      sections.push('    RewriteRule ^' + opts.custom_redirect_from + '$ ' + opts.custom_redirect_to + ' [L,R=' + rType + ']');
      sections.push('');
    }

    sections.push('</IfModule>');
    sections.push('');
  }

  if (opts.directory_listing === 'no') {
    sections.push('# Disable directory listing');
    sections.push('Options -Indexes');
    sections.push('');
  }

  if (opts.cors === 'yes') {
    sections.push('<IfModule mod_headers.c>');
    sections.push('    # Enable CORS');
    sections.push('    Header set Access-Control-Allow-Origin "*"');
    sections.push('    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"');
    sections.push('    Header set Access-Control-Allow-Headers "Content-Type, Authorization"');
    sections.push('</IfModule>');
    sections.push('');
  }

  if (opts.cache === 'yes') {
    sections.push('<IfModule mod_expires.c>');
    sections.push('    # Cache headers');
    sections.push('    ExpiresActive On');
    sections.push('    ExpiresByType image/jpg "access plus 1 year"');
    sections.push('    ExpiresByType image/jpeg "access plus 1 year"');
    sections.push('    ExpiresByType image/png "access plus 1 year"');
    sections.push('    ExpiresByType image/webp "access plus 1 year"');
    sections.push('    ExpiresByType image/gif "access plus 1 year"');
    sections.push('    ExpiresByType image/svg+xml "access plus 1 year"');
    sections.push('    ExpiresByType text/css "access plus 1 month"');
    sections.push('    ExpiresByType application/javascript "access plus 1 month"');
    sections.push('    ExpiresByType application/x-font-woff "access plus 1 year"');
    sections.push('    ExpiresByType font/woff2 "access plus 1 year"');
    sections.push('</IfModule>');
    sections.push('');
  }

  const blockIps = opts.block_ips
    .split(',')
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 0; });

  if (blockIps.length > 0) {
    sections.push('<RequireAll>');
    sections.push('    # Block IPs');
    sections.push('    Require all granted');
    for (const ip of blockIps) {
      sections.push('    Require not ip ' + ip);
    }
    sections.push('</RequireAll>');
    sections.push('');
  }

  if (opts.error_404 !== '') {
    sections.push('# Custom error pages');
    sections.push('ErrorDocument 404 ' + opts.error_404);
  }
  if (opts.error_500 !== '') {
    sections.push('ErrorDocument 500 ' + opts.error_500);
  }
  if (opts.error_404 !== '' || opts.error_500 !== '') {
    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

export const HTACCESS_EXAMPLE = `https_redirect=yes
www_redirect=no
no_www_redirect=yes
directory_listing=no
cors=yes
cache=yes
block_ips=192.168.1.1, 10.0.0.2
error_404=/404.html
error_500=/500.html`;
