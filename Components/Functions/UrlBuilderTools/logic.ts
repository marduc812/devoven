export interface UrlComponents {
  protocol: string;
  hostname: string;
  port?: string;
  pathname?: string;
  params?: Record<string, string>;
  hash?: string;
}

export function buildUrl(components: UrlComponents): string {
  const { protocol, hostname, port, pathname, params, hash } = components;
  if (!protocol || !hostname) throw new Error('Protocol and hostname are required');

  let url = `${protocol}://${hostname}`;
  if (port) url += `:${port}`;
  url += pathname ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : '/';

  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  if (hash) url += `#${hash}`;
  return url;
}

export function parseUrlInput(input: string): string {
  // Input format (one property per line):
  // protocol: https
  // host: example.com
  // port: 8080
  // path: /api/v1/users
  // param: key=value
  // hash: section

  const lines = input.trim().split('\n');
  const props: Record<string, string[]> = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (!props[key]) props[key] = [];
    props[key].push(value);
  }

  const params: Record<string, string> = {};
  for (const param of props['param'] ?? []) {
    const eqIdx = param.indexOf('=');
    if (eqIdx === -1) { params[param] = ''; continue; }
    params[param.slice(0, eqIdx).trim()] = param.slice(eqIdx + 1).trim();
  }

  const url = buildUrl({
    protocol: props['protocol']?.[0] ?? 'https',
    hostname: props['host']?.[0] ?? props['hostname']?.[0] ?? '',
    port: props['port']?.[0],
    pathname: props['path']?.[0] ?? props['pathname']?.[0],
    params,
    hash: props['hash']?.[0],
  });

  return url;
}
