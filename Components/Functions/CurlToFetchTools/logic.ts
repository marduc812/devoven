// Pure TypeScript — no browser APIs.
// Converts a curl command string to a JavaScript fetch() call.

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  auth: string | null;
}

function tokenizeCurl(cmd: string): string[] {
  // Split curl command respecting quoted strings
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let i = 0;

  // Strip leading 'curl ' and handle line continuations
  const normalized = cmd.replace(/\\\n/g, ' ').trim();

  while (i < normalized.length) {
    const ch = normalized[i];

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      i++;
      continue;
    }
    if (ch === ' ' && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function parseCurl(cmd: string): ParsedCurl {
  const tokens = tokenizeCurl(cmd);
  if (tokens.length === 0 || (tokens[0].toLowerCase() !== 'curl')) {
    throw new Error('Input must start with "curl"');
  }

  let url = '';
  let method = 'GET';
  const headers: Record<string, string> = {};
  let body: string | null = null;
  let auth: string | null = null;

  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      i++;
      if (i < tokens.length) method = tokens[i].toUpperCase();
    } else if (token === '-H' || token === '--header') {
      i++;
      if (i < tokens.length) {
        const colonIdx = tokens[i].indexOf(':');
        if (colonIdx > -1) {
          const key = tokens[i].slice(0, colonIdx).trim();
          const val = tokens[i].slice(colonIdx + 1).trim();
          headers[key] = val;
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      i++;
      if (i < tokens.length) {
        body = tokens[i];
        if (method === 'GET') method = 'POST';
      }
    } else if (token === '-u' || token === '--user') {
      i++;
      if (i < tokens.length) {
        auth = tokens[i];
      }
    } else if (token === '--compressed') {
      headers['Accept-Encoding'] = 'gzip, deflate, br';
    } else if (token === '--insecure' || token === '-k') {
      // ignored in fetch context
    } else if (token === '-L' || token === '--location') {
      // redirect, fetch follows by default
    } else if (token === '-s' || token === '--silent') {
      // silent mode, not applicable to fetch
    } else if (token === '-v' || token === '--verbose') {
      // verbose, not applicable to fetch
    } else if (!token.startsWith('-')) {
      if (!url) url = token;
    }

    i++;
  }

  return { url, method, headers, body: body, auth };
}

function jsString(val: string): string {
  return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function jsonBodyOrString(body: string): string {
  try {
    JSON.parse(body);
    return 'JSON.parse(' + jsString(body) + ')';
  } catch {
    return jsString(body);
  }
}

export function curlToFetch(cmd: string): string {
  if (!cmd.trim()) return '';

  const parsed = parseCurl(cmd.trim());

  if (!parsed.url) throw new Error('No URL found in curl command');

  const lines: string[] = [];
  lines.push('const response = await fetch(' + jsString(parsed.url) + ', {');

  // Method
  if (parsed.method !== 'GET') {
    lines.push('  method: ' + jsString(parsed.method) + ',');
  }

  // Auth header
  if (parsed.auth) {
    const encoded = Buffer.from(parsed.auth).toString('base64');
    parsed.headers['Authorization'] = 'Basic ' + encoded;
  }

  // Headers
  const headerKeys = Object.keys(parsed.headers);
  if (headerKeys.length > 0) {
    lines.push('  headers: {');
    for (const key of headerKeys) {
      lines.push('    ' + jsString(key) + ': ' + jsString(parsed.headers[key]) + ',');
    }
    lines.push('  },');
  }

  // Body
  if (parsed.body !== null) {
    const contentType = parsed.headers['Content-Type'] || parsed.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      lines.push('  body: JSON.stringify(' + jsonBodyOrString(parsed.body) + '),');
    } else {
      lines.push('  body: ' + jsString(parsed.body) + ',');
    }
  }

  lines.push('});');
  lines.push('');

  // Add response handling
  const contentType = parsed.headers['Accept'] || parsed.headers['accept'] || '';
  if (contentType.includes('application/json') || (parsed.headers['Content-Type'] || '').includes('json')) {
    lines.push('const data = await response.json();');
  } else {
    lines.push('const data = await response.text();');
  }
  lines.push('console.log(data);');

  return lines.join('\n');
}
