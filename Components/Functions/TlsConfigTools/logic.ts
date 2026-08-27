// TLS Configuration Generator — pure TypeScript, no browser APIs

export type TlsProfile = 'modern' | 'intermediate' | 'old';

export const TLS_PROFILES: { id: TlsProfile; name: string; description: string }[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'TLS 1.3 only. For clients that support TLS 1.3+ (Firefox 63+, Chrome 70+, Safari 12.1+).',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'TLS 1.2 + 1.3. Recommended for most servers. Good balance of security and compatibility.',
  },
  {
    id: 'old',
    name: 'Old (Legacy)',
    description: 'TLS 1.0-1.3. For maximum compatibility with old clients. Not recommended for new deployments.',
  },
];

export type TlsConfigResult = {
  profile: TlsProfile;
  minTlsVersion: string;
  maxTlsVersion: string;
  cipherSuites: string[];
  browserCompatibility: string[];
  nginx: string;
  apache: string;
  haproxy: string;
  notes: string[];
};

const MODERN_CIPHERS: string[] = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
];

const INTERMEDIATE_CIPHERS: string[] = [
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'DHE-RSA-AES128-GCM-SHA256',
  'DHE-RSA-AES256-GCM-SHA384',
];

const OLD_CIPHERS: string[] = [
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'DHE-RSA-AES128-GCM-SHA256',
  'DHE-RSA-AES256-GCM-SHA384',
  'AES128-GCM-SHA256',
  'AES256-GCM-SHA384',
  'AES128-SHA',
  'AES256-SHA',
];

export function generateTlsConfig(profile: TlsProfile): TlsConfigResult {
  let minTlsVersion: string;
  let maxTlsVersion: string;
  let cipherSuites: string[];
  let browserCompatibility: string[];
  let notes: string[];

  if (profile === 'modern') {
    minTlsVersion = 'TLS 1.3';
    maxTlsVersion = 'TLS 1.3';
    cipherSuites = MODERN_CIPHERS;
    browserCompatibility = [
      'Firefox 63+',
      'Chrome 70+',
      'Safari 12.1+',
      'Edge 79+',
      'Android 10+',
      'iOS 12.2+',
    ];
    notes = [
      'TLS 1.3 cipher suites are negotiated differently — they cannot be configured in nginx ssl_ciphers.',
      'The ssl_ciphers directive is ignored for TLS 1.3; shown here for reference.',
      'Requires OpenSSL 1.1.1 or LibreSSL 3.4+.',
      'HSTS max-age of 63072000 (2 years) is recommended.',
    ];
  } else if (profile === 'intermediate') {
    minTlsVersion = 'TLS 1.2';
    maxTlsVersion = 'TLS 1.3';
    cipherSuites = INTERMEDIATE_CIPHERS;
    browserCompatibility = [
      'Firefox 27+',
      'Chrome 30+',
      'Safari 9+',
      'Edge 14+',
      'IE 11+ (no TLS 1.3)',
      'Android 5.0+',
      'iOS 9+',
    ];
    notes = [
      'Recommended for most production deployments.',
      'Drops support for TLS 1.0 and TLS 1.1 (deprecated per RFC 8996).',
      'DHE key exchange requires a 2048-bit DH parameter file.',
      'Generate: openssl dhparam -out /etc/nginx/dhparam.pem 2048',
    ];
  } else {
    minTlsVersion = 'TLS 1.0';
    maxTlsVersion = 'TLS 1.3';
    cipherSuites = OLD_CIPHERS;
    browserCompatibility = [
      'Firefox 1+',
      'Chrome 1+',
      'Safari 1+',
      'IE 8+ on Windows 7+',
      'Android 2.3+',
      'iOS 4+',
      'Java 7+',
    ];
    notes = [
      'WARNING: TLS 1.0 and TLS 1.1 are deprecated (RFC 8996) and have known vulnerabilities.',
      'Only use this profile if you must support legacy clients.',
      'PCI DSS compliance requires TLS 1.2 minimum since 2018.',
      'Consider migrating legacy clients to support at least TLS 1.2.',
    ];
  }

  const cipherString = cipherSuites.join(':');
  const protocols = profile === 'modern' ? 'TLSv1.3' :
                    profile === 'intermediate' ? 'TLSv1.2 TLSv1.3' :
                    'TLSv1 TLSv1.1 TLSv1.2 TLSv1.3';

  const apacheProtocols = profile === 'modern' ? '+TLSv1.3' :
                          profile === 'intermediate' ? '+TLSv1.2 +TLSv1.3' :
                          '+TLSv1 +TLSv1.1 +TLSv1.2 +TLSv1.3';

  const hstsMaxAge = profile === 'old' ? '31536000' : '63072000';

  const nginx = [
    '# Nginx TLS Configuration (' + profile + ' profile)',
    '# Based on Mozilla SSL Configuration Generator',
    '',
    'server {',
    '    listen 443 ssl http2;',
    '    listen [::]:443 ssl http2;',
    '',
    '    ssl_certificate /path/to/fullchain.pem;',
    '    ssl_certificate_key /path/to/privkey.pem;',
    '',
    '    ssl_protocols ' + protocols + ';',
    profile !== 'modern' ? '    ssl_ciphers ' + cipherString + ';' : '    # ssl_ciphers not needed for TLS 1.3 only',
    '    ssl_prefer_server_ciphers ' + (profile === 'modern' ? 'off' : 'off') + ';',
    '',
    '    ssl_session_timeout 1d;',
    '    ssl_session_cache shared:MozSSL:10m;  # about 40000 sessions',
    '    ssl_session_tickets off;',
    '',
    profile !== 'modern' ? '    # DH parameters (for DHE ciphers)' : '',
    profile !== 'modern' ? '    ssl_dhparam /etc/nginx/dhparam.pem;' : '',
    '',
    '    # OCSP Stapling',
    '    ssl_stapling on;',
    '    ssl_stapling_verify on;',
    '    resolver 1.1.1.1 8.8.8.8 valid=300s;',
    '    resolver_timeout 5s;',
    '',
    '    # HSTS (ngx_http_headers_module required)',
    '    add_header Strict-Transport-Security "max-age=' + hstsMaxAge + '; includeSubDomains; preload" always;',
    '',
    '    # Other security headers',
    '    add_header X-Content-Type-Options nosniff;',
    '    add_header X-Frame-Options DENY;',
    '}',
  ].filter(function(l) { return l !== ''; }).join('\n');

  const apache = [
    '# Apache TLS Configuration (' + profile + ' profile)',
    '# Based on Mozilla SSL Configuration Generator',
    '',
    '<VirtualHost *:443>',
    '    SSLEngine on',
    '    SSLCertificateFile /path/to/fullchain.pem',
    '    SSLCertificateKeyFile /path/to/privkey.pem',
    '',
    '    SSLProtocol all ' + (profile === 'modern' ? '-SSLv3 -TLSv1 -TLSv1.1 -TLSv1.2' :
                              profile === 'intermediate' ? '-SSLv3 -TLSv1 -TLSv1.1' :
                              '-SSLv3'),
    profile !== 'modern' ? '    SSLCipherSuite ' + cipherString : '    # Cipher suite negotiated by TLS 1.3',
    '    SSLHonorCipherOrder off',
    '    SSLSessionTickets off',
    '',
    '    # OCSP Stapling',
    '    SSLUseStapling On',
    '    SSLStaplingCache "shmcb:logs/ssl_stapling(32768)"',
    '',
    '    # HSTS',
    '    Header always set Strict-Transport-Security "max-age=' + hstsMaxAge + '; includeSubDomains; preload"',
    '',
    '    # Other security headers',
    '    Header always set X-Content-Type-Options nosniff',
    '    Header always set X-Frame-Options DENY',
    '</VirtualHost>',
  ].join('\n');

  const haproxy = [
    '# HAProxy TLS Configuration (' + profile + ' profile)',
    '',
    'frontend https_front',
    '    bind *:443 ssl crt /etc/haproxy/certs/' + (profile !== 'modern' ? 'ssl-ciphers ' + cipherString : ''),
    '    bind *:443 ssl crt /etc/haproxy/certs/cert.pem alpn h2,http/1.1 \\',
    '        ssl-min-ver ' + (profile === 'modern' ? 'TLSv1.3' :
                              profile === 'intermediate' ? 'TLSv1.2' : 'TLSv1.0'),
    '    http-response set-header Strict-Transport-Security "max-age=' + hstsMaxAge + '; includeSubDomains; preload"',
  ].join('\n');

  return {
    profile,
    minTlsVersion,
    maxTlsVersion,
    cipherSuites,
    browserCompatibility,
    nginx,
    apache,
    haproxy,
    notes,
  };
}
