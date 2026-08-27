export interface CorsConfig {
  allowedOrigins: string;       // comma-separated, or '*'
  allowedMethods: string[];
  allowedHeaders: string;       // comma-separated
  exposedHeaders: string;       // comma-separated
  allowCredentials: boolean;
  maxAge: number;               // seconds, 0 = omit header
  useReflectOrigin: boolean;    // dynamically reflect request Origin
}

export interface CorsOutput {
  headers: Record<string, string>;
  warnings: string[];
  expressCode: string;
  nginxConfig: string;
  apacheConfig: string;
  requestType: 'simple' | 'preflight' | 'both';
}

export interface HeaderExplanation {
  name: string;
  value: string;
  description: string;
}

export const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: 'https://example.com',
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: 'Content-Type, Authorization',
  exposedHeaders: '',
  allowCredentials: false,
  maxAge: 86400,
  useReflectOrigin: false,
};

function parseOrigins(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function buildCorsHeaders(config: CorsConfig): CorsOutput {
  const warnings: string[] = [];
  const headers: Record<string, string> = {};

  // Origin handling
  const origins = parseOrigins(config.allowedOrigins);
  const isWildcard = origins.length === 1 && origins[0] === '*';

  if (isWildcard && config.allowCredentials) {
    warnings.push('Wildcard (*) origin cannot be combined with credentials. The browser will block the request. Use a specific origin with credentials.');
  }

  if (config.useReflectOrigin && !isWildcard) {
    warnings.push('Reflecting the request Origin dynamically is risky. Validate against an allowlist; do not blindly reflect any origin. See CORS misconfiguration attacks.');
  }

  if (isWildcard && config.useReflectOrigin) {
    warnings.push('Both wildcard and reflect-origin are enabled. Reflect-origin overrides wildcard. This is a dangerous pattern — validate origins explicitly.');
  }

  if (config.useReflectOrigin) {
    headers['Access-Control-Allow-Origin'] = '<reflect Origin header>';
    headers['Vary'] = 'Origin';
  } else if (isWildcard) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origins.length === 1) {
    headers['Access-Control-Allow-Origin'] = origins[0];
    headers['Vary'] = 'Origin';
  } else {
    headers['Access-Control-Allow-Origin'] = '<conditionally set to one of: ' + origins.join(', ') + '>';
    headers['Vary'] = 'Origin';
  }

  if (config.allowedMethods.length > 0) {
    headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
  }

  const allowedHeadersClean = config.allowedHeaders.trim();
  if (allowedHeadersClean) {
    headers['Access-Control-Allow-Headers'] = allowedHeadersClean;
  }

  const exposedHeadersClean = config.exposedHeaders.trim();
  if (exposedHeadersClean) {
    headers['Access-Control-Expose-Headers'] = exposedHeadersClean;
  }

  if (config.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  if (config.maxAge > 0) {
    headers['Access-Control-Max-Age'] = String(config.maxAge);
  }

  // Determine request type
  const preflightMethods = ['PUT', 'PATCH', 'DELETE'];
  const hasPreflightMethod = config.allowedMethods.some(m => preflightMethods.includes(m));
  const hasCustomHeaders = allowedHeadersClean !== '' && !['Content-Type'].includes(allowedHeadersClean);
  const requestType: CorsOutput['requestType'] =
    hasPreflightMethod || hasCustomHeaders ? 'both' : 'simple';

  const expressCode = buildExpressCode(config, origins, isWildcard, warnings);
  const nginxConfig = buildNginxConfig(config, origins, isWildcard);
  const apacheConfig = buildApacheConfig(config, origins, isWildcard);

  return { headers, warnings, expressCode, nginxConfig, apacheConfig, requestType };
}

function buildExpressCode(config: CorsConfig, origins: string[], isWildcard: boolean, _warnings: string[]): string {
  const lines: string[] = [];
  lines.push("const cors = require('cors');");
  lines.push('');

  if (isWildcard && !config.allowCredentials) {
    lines.push('app.use(cors());');
  } else {
    lines.push('const corsOptions = {');

    if (config.useReflectOrigin) {
      lines.push('  // DANGER: validate against an allowlist, do not blindly reflect');
      lines.push('  origin: function (origin, callback) {');
      lines.push('    const allowlist = [' + origins.map(o => `'${o}'`).join(', ') + '];');
      lines.push('    if (!origin || allowlist.includes(origin)) {');
      lines.push('      callback(null, origin || true);');
      lines.push('    } else {');
      lines.push("      callback(new Error('Not allowed by CORS'));");
      lines.push('    }');
      lines.push('  },');
    } else if (isWildcard) {
      lines.push("  origin: '*',");
    } else if (origins.length === 1) {
      lines.push(`  origin: '${origins[0]}',`);
    } else {
      lines.push('  origin: [' + origins.map(o => `'${o}'`).join(', ') + '],');
    }

    if (config.allowedMethods.length > 0) {
      lines.push(`  methods: ['${config.allowedMethods.join("', '")}'],`);
    }
    if (config.allowedHeaders.trim()) {
      lines.push(`  allowedHeaders: ['${config.allowedHeaders.split(',').map(s => s.trim()).join("', '")}'],`);
    }
    if (config.exposedHeaders.trim()) {
      lines.push(`  exposedHeaders: ['${config.exposedHeaders.split(',').map(s => s.trim()).join("', '")}'],`);
    }
    if (config.allowCredentials) {
      lines.push('  credentials: true,');
    }
    if (config.maxAge > 0) {
      lines.push(`  maxAge: ${config.maxAge},`);
    }
    lines.push('};');
    lines.push('');
    lines.push('app.use(cors(corsOptions));');
    lines.push('// Handle preflight for all routes');
    lines.push("app.options('*', cors(corsOptions));");
  }

  return lines.join('\n');
}

function buildNginxConfig(config: CorsConfig, origins: string[], isWildcard: boolean): string {
  const lines: string[] = [];

  if (!isWildcard && origins.length > 1) {
    lines.push('# Map multiple allowed origins');
    lines.push('map $http_origin $cors_origin {');
    lines.push('  default "";');
    origins.forEach(o => lines.push(`  "${o}" "${o}";`));
    lines.push('}');
    lines.push('');
  }

  lines.push('location / {');

  const originValue = isWildcard
    ? '"*"'
    : origins.length === 1
    ? `"${origins[0]}"`
    : '$cors_origin';

  if (config.useReflectOrigin) {
    lines.push('  # Validate Origin before reflecting — this example just reflects, add validation in real code');
    lines.push('  add_header Access-Control-Allow-Origin $http_origin always;');
    lines.push('  add_header Vary Origin always;');
  } else {
    lines.push(`  add_header Access-Control-Allow-Origin ${originValue} always;`);
    if (origins.length !== 1 || config.useReflectOrigin) {
      lines.push('  add_header Vary Origin always;');
    }
  }

  if (config.allowedMethods.length > 0) {
    lines.push(`  add_header Access-Control-Allow-Methods '${config.allowedMethods.join(', ')}' always;`);
  }
  if (config.allowedHeaders.trim()) {
    lines.push(`  add_header Access-Control-Allow-Headers '${config.allowedHeaders}' always;`);
  }
  if (config.exposedHeaders.trim()) {
    lines.push(`  add_header Access-Control-Expose-Headers '${config.exposedHeaders}' always;`);
  }
  if (config.allowCredentials) {
    lines.push("  add_header Access-Control-Allow-Credentials 'true' always;");
  }
  if (config.maxAge > 0) {
    lines.push(`  add_header Access-Control-Max-Age ${config.maxAge} always;`);
  }
  lines.push('');
  lines.push('  if ($request_method = OPTIONS) {');
  lines.push('    return 204;');
  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

function buildApacheConfig(config: CorsConfig, origins: string[], isWildcard: boolean): string {
  const lines: string[] = [];
  lines.push('# Add to .htaccess or VirtualHost block');
  lines.push('<IfModule mod_headers.c>');

  if (!isWildcard && origins.length > 1) {
    lines.push('  SetEnvIf Origin "^(' + origins.map(o => o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$" ORIGIN_OK=$0');
    lines.push('  Header set Access-Control-Allow-Origin "%{ORIGIN_OK}e" env=ORIGIN_OK');
  } else if (config.useReflectOrigin) {
    lines.push('  # DANGER: Reflect origin — add allowlist validation');
    lines.push('  Header echo Origin');
  } else {
    const originVal = isWildcard ? '*' : origins[0] || '*';
    lines.push(`  Header set Access-Control-Allow-Origin "${originVal}"`);
  }

  if (config.allowedMethods.length > 0) {
    lines.push(`  Header set Access-Control-Allow-Methods "${config.allowedMethods.join(', ')}"`);
  }
  if (config.allowedHeaders.trim()) {
    lines.push(`  Header set Access-Control-Allow-Headers "${config.allowedHeaders}"`);
  }
  if (config.exposedHeaders.trim()) {
    lines.push(`  Header set Access-Control-Expose-Headers "${config.exposedHeaders}"`);
  }
  if (config.allowCredentials) {
    lines.push('  Header set Access-Control-Allow-Credentials "true"');
  }
  if (config.maxAge > 0) {
    lines.push(`  Header set Access-Control-Max-Age "${config.maxAge}"`);
  }
  lines.push('</IfModule>');

  return lines.join('\n');
}

export function getHeaderExplanations(): HeaderExplanation[] {
  return [
    {
      name: 'Access-Control-Allow-Origin',
      value: 'https://example.com or *',
      description: 'Specifies which origin(s) are allowed to read the response. A single specific origin or wildcard *. Cannot be * when credentials are included.',
    },
    {
      name: 'Access-Control-Allow-Methods',
      value: 'GET, POST, PUT',
      description: 'Lists the HTTP methods allowed when accessing the resource in cross-origin requests. Applies to preflight requests.',
    },
    {
      name: 'Access-Control-Allow-Headers',
      value: 'Content-Type, Authorization',
      description: 'Lists request headers that may be used in the actual request. Any header outside the CORS-safelisted set requires explicit listing here.',
    },
    {
      name: 'Access-Control-Expose-Headers',
      value: 'X-Custom-Header',
      description: 'Lists response headers that browsers are allowed to access from JavaScript. By default only CORS-safelisted headers are exposed.',
    },
    {
      name: 'Access-Control-Allow-Credentials',
      value: 'true',
      description: 'Indicates whether the request can include user credentials (cookies, HTTP authentication, TLS certificates). Requires specific origin, not wildcard.',
    },
    {
      name: 'Access-Control-Max-Age',
      value: '86400',
      description: 'Indicates how long (seconds) the results of a preflight request can be cached. Reduces preflight overhead.',
    },
    {
      name: 'Vary: Origin',
      value: 'Origin',
      description: 'Tells caches that the response varies by the Origin header. Required when dynamically setting Access-Control-Allow-Origin to prevent cache poisoning.',
    },
  ];
}
