// Nginx Config Generator (advanced) — pure TypeScript, no browser APIs
// Generates nginx server blocks from structured input with template support

export type NginxTemplate = 'reverse-proxy' | 'static-site' | 'php-fpm' | 'redirect';

export interface NginxOptions {
  template: NginxTemplate;
  domain: string;
  wwwRedirect: boolean;
  ssl: boolean;
  sslCertPath: string;
  sslKeyPath: string;
  proxyTarget: string;
  staticFilesPath: string;
  phpSocket: string;
  redirectTarget: string;
  gzip: boolean;
  clientMaxBodySize: string;
  accessLog: string;
  errorLog: string;
}

export const DEFAULT_OPTIONS: NginxOptions = {
  template: 'reverse-proxy',
  domain: 'example.com',
  wwwRedirect: true,
  ssl: false,
  sslCertPath: '/etc/letsencrypt/live/example.com/fullchain.pem',
  sslKeyPath: '/etc/letsencrypt/live/example.com/privkey.pem',
  proxyTarget: 'http://localhost:3000',
  staticFilesPath: '/var/www/html',
  phpSocket: '/var/run/php/php8.2-fpm.sock',
  redirectTarget: 'https://example.com$request_uri',
  gzip: true,
  clientMaxBodySize: '10m',
  accessLog: '/var/log/nginx/access.log',
  errorLog: '/var/log/nginx/error.log',
};

function parseInput(input: string): Partial<NginxOptions> {
  const opts: Partial<NginxOptions> = {};
  const lines = input.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      // Try to parse key:value
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim().toLowerCase().replace(/-/g, '_');
      const val = trimmed.slice(colonIdx + 1).trim();
      applyOption(opts, key, val);
    } else {
      const key = trimmed.slice(0, eqIdx).trim().toLowerCase().replace(/-/g, '_');
      const val = trimmed.slice(eqIdx + 1).trim();
      applyOption(opts, key, val);
    }
  }

  return opts;
}

function applyOption(opts: Partial<NginxOptions>, key: string, val: string): void {
  switch (key) {
    case 'template':
    case 'type':
      if (['reverse-proxy', 'static-site', 'php-fpm', 'redirect'].includes(val)) {
        opts.template = val as NginxTemplate;
      }
      break;
    case 'domain':
    case 'server_name':
      opts.domain = val;
      break;
    case 'www':
    case 'www_redirect':
    case 'redirect_www':
      opts.wwwRedirect = val === 'true' || val === 'yes' || val === '1';
      break;
    case 'ssl':
      opts.ssl = val === 'true' || val === 'yes' || val === '1';
      break;
    case 'ssl_cert':
    case 'ssl_certificate':
      opts.sslCertPath = val;
      break;
    case 'ssl_key':
    case 'ssl_certificate_key':
      opts.sslKeyPath = val;
      break;
    case 'proxy':
    case 'proxy_pass':
    case 'proxy_target':
    case 'target':
      opts.proxyTarget = val;
      break;
    case 'root':
    case 'static_files':
    case 'static_path':
    case 'files':
      opts.staticFilesPath = val;
      break;
    case 'php_socket':
    case 'fpm_socket':
    case 'fastcgi_pass':
      opts.phpSocket = val;
      break;
    case 'redirect':
    case 'redirect_to':
      opts.redirectTarget = val;
      break;
    case 'gzip':
      opts.gzip = val === 'true' || val === 'yes' || val === '1';
      break;
    case 'max_body':
    case 'client_max_body_size':
      opts.clientMaxBodySize = val;
      break;
    case 'access_log':
      opts.accessLog = val;
      break;
    case 'error_log':
      opts.errorLog = val;
      break;
  }
}

function gzipBlock(): string {
  return `
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;`;
}

function sslBlock(opts: NginxOptions): string {
  return `
    ssl_certificate     ${opts.sslCertPath};
    ssl_certificate_key ${opts.sslKeyPath};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;`;
}

function loggingBlock(opts: NginxOptions): string {
  return `
    access_log ${opts.accessLog};
    error_log  ${opts.errorLog};`;
}

function buildReverseProxy(opts: NginxOptions): string {
  const port = opts.ssl ? '443 ssl' : '80';
  const wwwBlock = opts.wwwRedirect ? `
server {
    listen 80;
    server_name www.${opts.domain};
    return 301 http${opts.ssl ? 's' : ''}://${opts.domain}$request_uri;
}
` : '';

  const httpsRedirect = opts.ssl ? `
server {
    listen 80;
    server_name ${opts.domain}${opts.wwwRedirect ? ' www.' + opts.domain : ''};
    return 301 https://${opts.domain}$request_uri;
}
` : '';

  return `${httpsRedirect}${wwwBlock}
server {
    listen ${port};
    server_name ${opts.domain};

    client_max_body_size ${opts.clientMaxBodySize};
${opts.ssl ? sslBlock(opts) : ''}
${opts.gzip ? gzipBlock() : ''}
${loggingBlock(opts)}

    location / {
        proxy_pass         ${opts.proxyTarget};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;
}

function buildStaticSite(opts: NginxOptions): string {
  const port = opts.ssl ? '443 ssl' : '80';
  const wwwBlock = opts.wwwRedirect ? `
server {
    listen 80;
    server_name www.${opts.domain};
    return 301 http${opts.ssl ? 's' : ''}://${opts.domain}$request_uri;
}
` : '';

  const httpsRedirect = opts.ssl ? `
server {
    listen 80;
    server_name ${opts.domain}${opts.wwwRedirect ? ' www.' + opts.domain : ''};
    return 301 https://${opts.domain}$request_uri;
}
` : '';

  return `${httpsRedirect}${wwwBlock}
server {
    listen ${port};
    server_name ${opts.domain};

    root  ${opts.staticFilesPath};
    index index.html index.htm;

    client_max_body_size ${opts.clientMaxBodySize};
${opts.ssl ? sslBlock(opts) : ''}
${opts.gzip ? gzipBlock() : ''}
${loggingBlock(opts)}

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`;
}

function buildPhpFpm(opts: NginxOptions): string {
  const port = opts.ssl ? '443 ssl' : '80';
  const wwwBlock = opts.wwwRedirect ? `
server {
    listen 80;
    server_name www.${opts.domain};
    return 301 http${opts.ssl ? 's' : ''}://${opts.domain}$request_uri;
}
` : '';

  const httpsRedirect = opts.ssl ? `
server {
    listen 80;
    server_name ${opts.domain}${opts.wwwRedirect ? ' www.' + opts.domain : ''};
    return 301 https://${opts.domain}$request_uri;
}
` : '';

  return `${httpsRedirect}${wwwBlock}
server {
    listen ${port};
    server_name ${opts.domain};

    root  ${opts.staticFilesPath};
    index index.php index.html;

    client_max_body_size ${opts.clientMaxBodySize};
${opts.ssl ? sslBlock(opts) : ''}
${opts.gzip ? gzipBlock() : ''}
${loggingBlock(opts)}

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include        fastcgi_params;
        fastcgi_pass   unix:${opts.phpSocket};
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~ /\\.ht {
        deny all;
    }
}`;
}

function buildRedirect(opts: NginxOptions): string {
  return `server {
    listen 80;
    server_name ${opts.domain}${opts.wwwRedirect ? ' www.' + opts.domain : ''};
    return 301 ${opts.redirectTarget};
}`;
}

export function generateNginxConfig(input: string, template: NginxTemplate): string {
  if (!input.trim()) {
    return generateNginxConfig(getExampleInput(template), template);
  }

  const parsed = parseInput(input);
  const opts: NginxOptions = {
    ...DEFAULT_OPTIONS,
    ...parsed,
    template,
  };

  switch (opts.template) {
    case 'reverse-proxy':
      return buildReverseProxy(opts).trim();
    case 'static-site':
      return buildStaticSite(opts).trim();
    case 'php-fpm':
      return buildPhpFpm(opts).trim();
    case 'redirect':
      return buildRedirect(opts).trim();
    default:
      return buildReverseProxy(opts).trim();
  }
}

export function getExampleInput(template: NginxTemplate): string {
  switch (template) {
    case 'reverse-proxy':
      return `domain=myapp.com
proxy_target=http://localhost:3000
ssl=false
www_redirect=true
gzip=true
client_max_body_size=20m`;
    case 'static-site':
      return `domain=mysite.com
static_files=/var/www/mysite
ssl=false
www_redirect=true
gzip=true`;
    case 'php-fpm':
      return `domain=wordpress.com
static_files=/var/www/wordpress
php_socket=/var/run/php/php8.2-fpm.sock
ssl=false
www_redirect=true`;
    case 'redirect':
      return `domain=old-domain.com
redirect_to=https://new-domain.com$request_uri
www_redirect=true`;
  }
}
