// HTTP Request Builder logic — pure TypeScript, no browser APIs

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ParsedHeader {
  name: string;
  value: string;
}

export interface HttpRequestInput {
  method: HttpMethod;
  url: string;
  headersRaw: string;
  body: string;
  httpVersion: string;
}

export interface HttpRequestOutput {
  rawRequest: string;
  curlCommand: string;
  fetchCode: string;
  parsedUrl: {
    protocol: string;
    host: string;
    path: string;
    query: string;
  };
}

export function parseHeaders(headersRaw: string): ParsedHeader[] {
  if (!headersRaw.trim()) return [];
  return headersRaw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) return null;
      return {
        name: line.slice(0, colonIdx).trim(),
        value: line.slice(colonIdx + 1).trim(),
      };
    })
    .filter((h): h is ParsedHeader => h !== null);
}

export function parseUrl(rawUrl: string): { protocol: string; host: string; path: string; query: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { protocol: '', host: '', path: '/', query: '' };

  // Add protocol if missing
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : 'http://' + trimmed;

  const protocolMatch = withProtocol.match(/^(https?):\/\//i);
  const protocol = protocolMatch ? protocolMatch[1].toUpperCase() : 'HTTP';
  const rest = withProtocol.slice(protocol.length + 3);

  const slashIdx = rest.indexOf('/');
  const questionIdx = rest.indexOf('?');
  const endOfHost = slashIdx >= 0 ? slashIdx : (questionIdx >= 0 ? questionIdx : rest.length);

  const host = rest.slice(0, endOfHost);
  const pathAndQuery = rest.slice(endOfHost) || '/';

  const qIdx = pathAndQuery.indexOf('?');
  const path = qIdx >= 0 ? pathAndQuery.slice(0, qIdx) : pathAndQuery;
  const query = qIdx >= 0 ? pathAndQuery.slice(qIdx) : '';

  return { protocol, host, path: path || '/', query };
}

export function buildRawRequest(input: HttpRequestInput): HttpRequestOutput {
  const { method, url, headersRaw, body, httpVersion } = input;
  const version = httpVersion || '1.1';
  const parsed = parseUrl(url);
  const headers = parseHeaders(headersRaw);

  const requestLine = method + ' ' + parsed.path + parsed.query + ' HTTP/' + version;
  const hostHeader = 'Host: ' + parsed.host;

  const headerLines = headers.map(h => h.name + ': ' + h.value);
  const hasContentLength = headers.some(h => h.name.toLowerCase() === 'content-length');
  const hasHost = headers.some(h => h.name.toLowerCase() === 'host');

  const allHeaderLines: string[] = [];
  if (!hasHost && parsed.host) allHeaderLines.push(hostHeader);
  allHeaderLines.push(...headerLines);

  if (body && !hasContentLength) {
    const bodyBytes = Buffer.from(body, 'utf-8').length;
    allHeaderLines.push('Content-Length: ' + bodyBytes);
  }

  const rawParts: string[] = [requestLine, ...allHeaderLines, ''];
  if (body) rawParts.push(body);
  const rawRequest = rawParts.join('\r\n');

  // Build curl command
  const curlParts: string[] = ['curl'];
  if (method !== 'GET') curlParts.push('-X ' + method);
  curlParts.push('"' + url + '"');
  for (const h of headers) {
    curlParts.push('-H "' + h.name + ': ' + h.value.replace(/"/g, '\\"') + '"');
  }
  if (body) {
    const escaped = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    curlParts.push('-d "' + escaped + '"');
  }
  const curlCommand = curlParts.join(' \\\n  ');

  // Build fetch() code
  const fetchHeaders: string[] = [];
  for (const h of headers) {
    fetchHeaders.push('    "' + h.name + '": "' + h.value.replace(/"/g, '\\"') + '"');
  }
  const headersObj = fetchHeaders.length > 0 ? '  headers: {\n' + fetchHeaders.join(',\n') + '\n  },' : '';
  const bodyPart = body ? '  body: ' + JSON.stringify(body) + ',' : '';
  const methodPart = method !== 'GET' ? '  method: "' + method + '",' : '';

  const fetchOptions = [methodPart, headersObj, bodyPart].filter(Boolean).join('\n');
  const fetchCode = 'fetch("' + url + '"' +
    (fetchOptions ? ', {\n' + fetchOptions + '\n}' : '') +
    ')\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));';

  return {
    rawRequest,
    curlCommand,
    fetchCode,
    parsedUrl: parsed,
  };
}

export function buildRequestFromText(input: HttpRequestInput): string {
  try {
    if (!input.url.trim()) return '';
    const output = buildRawRequest(input);
    return [
      '=== Raw HTTP Request ===',
      output.rawRequest,
      '',
      '=== curl Command ===',
      output.curlCommand,
      '',
      '=== JavaScript fetch() ===',
      output.fetchCode,
    ].join('\n');
  } catch (e) {
    return 'Error: ' + (e instanceof Error ? e.message : 'Invalid input');
  }
}
