import type {
  AuthInfo,
  CollectionView,
  EnvironmentSummary,
  KeyValue,
  Parsed,
  ParsedRequest,
  RawAuth,
  RawBody,
  RawCollection,
  RawEnvironment,
  RawItem,
  RawKeyValue,
  RawRequest,
  RawUrl,
  RequestBody,
  RequestGroup,
  ResolvedText,
  Unresolved,
  VariableEntry,
  VariableMap,
  VariableSource,
} from './types';

export const SECRET_MASK = '••••••••';

/** `{{key}}` — no nesting inside the braces, which is what Postman itself accepts. */
const VARIABLE_PATTERN = /\{\{([^{}]*)\}\}/g;

/** Substitution passes before we call a chain circular. */
const MAX_RESOLUTION_DEPTH = 5;

/* ------------------------------------------------------------------ */
/* File parsing                                                        */
/* ------------------------------------------------------------------ */

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Descriptions are sometimes `{ content, type }` rather than a bare string.
  const record = asRecord(value);
  if (record && typeof record.content === 'string') return record.content;
  return '';
};

const parseJson = (text: string): Parsed<unknown> => {
  if (!text.trim()) return { ok: false, error: 'The file is empty.' };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: `That file is not valid JSON — ${(e as Error).message}` };
  }
};

const looksLikeEnvironment = (doc: Record<string, unknown>): boolean =>
  Array.isArray(doc.values) && !('item' in doc);

/** Collection v1 kept a flat `requests` array and no `info` block. */
const looksLikeCollectionV1 = (doc: Record<string, unknown>): boolean =>
  Array.isArray(doc.requests) && !('item' in doc);

const schemaVersion = (schema: string): string => {
  const match = /collection\/v(\d+(?:\.\d+)*)/.exec(schema);
  return match ? `v${match[1]}` : '';
};

export const parseCollectionFile = (text: string): Parsed<RawCollection> => {
  const json = parseJson(text);
  if (!json.ok) return json;

  const doc = asRecord(json.value);
  if (!doc) return { ok: false, error: 'That JSON is not a Postman collection — expected an object at the top level.' };

  if (looksLikeEnvironment(doc)) {
    return {
      ok: false,
      error: 'That looks like a Postman environment export, not a collection. Drop it on the environment pane instead.',
    };
  }

  if (looksLikeCollectionV1(doc)) {
    return {
      ok: false,
      error: 'That is a Collection v1 export. Re-export it from Postman as Collection v2.1 and try again.',
    };
  }

  if (!Array.isArray(doc.item)) {
    return { ok: false, error: 'That JSON has no "item" array, so it is not a Postman collection.' };
  }

  return { ok: true, value: doc as RawCollection };
};

export const parseEnvironmentFile = (text: string): Parsed<EnvironmentSummary> => {
  const json = parseJson(text);
  if (!json.ok) return json;

  const doc = asRecord(json.value);
  if (!doc) return { ok: false, error: 'That JSON is not a Postman environment — expected an object at the top level.' };

  if (Array.isArray(doc.item)) {
    return {
      ok: false,
      error: 'That looks like a Postman collection, not an environment. Drop it on the collection pane instead.',
    };
  }

  if (!Array.isArray(doc.values)) {
    return { ok: false, error: 'That JSON has no "values" array, so it is not a Postman environment or globals export.' };
  }

  const env = doc as RawEnvironment;
  const scope: VariableSource = env._postman_variable_scope === 'globals' ? 'globals' : 'environment';

  return {
    ok: true,
    value: {
      name: asString(env.name) || (scope === 'globals' ? 'Globals' : 'Environment'),
      scope,
      values: toVariableEntries(env.values, scope),
    },
  };
};

/* ------------------------------------------------------------------ */
/* Variables                                                           */
/* ------------------------------------------------------------------ */

const toVariableEntries = (rows: RawKeyValue[] | undefined, source: VariableSource): VariableEntry[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    // `enabled: false` is how environments disable a row; `disabled: true` is the collection spelling.
    .filter(row => row && typeof row.key === 'string' && row.key !== '' && row.enabled !== false && row.disabled !== true)
    .map(row => ({
      key: row.key as string,
      value: asString(row.value),
      source,
      secret: row.type === 'secret',
    }));
};

export const collectionVariables = (collection: RawCollection): VariableEntry[] =>
  toVariableEntries(collection.variable, 'collection');

/**
 * Postman resolves narrowest-scope-first: environment beats collection, and a
 * globals export sits below both. Later entries win, so callers pass them in
 * ascending order of precedence.
 */
export const buildVariableMap = (...groups: VariableEntry[][]): VariableMap => {
  const map: VariableMap = new Map();
  for (const group of groups) {
    for (const entry of group) map.set(entry.key, entry);
  }
  return map;
};

const emptyUnresolved = (): Unresolved => ({ missing: [], dynamic: [], circular: [] });

export const mergeUnresolved = (parts: Unresolved[]): Unresolved => {
  const missing = new Set<string>();
  const dynamic = new Set<string>();
  const circular = new Set<string>();
  for (const part of parts) {
    part.missing.forEach(k => missing.add(k));
    part.dynamic.forEach(k => dynamic.add(k));
    part.circular.forEach(k => circular.add(k));
  }
  return { missing: [...missing], dynamic: [...dynamic], circular: [...circular] };
};

/**
 * Follows a variable's value from key to key. Returns every name in the loop when
 * the chain closes on itself, and nothing when it merely runs into a dead end —
 * a chain ending at an undefined name is a *missing* variable, already reported
 * as such, not a cycle.
 */
const traceCycle = (start: string, map: VariableMap): string[] => {
  const singleToken = /\{\{([^{}]*)\}\}/;
  const seen: string[] = [];
  let cursor = start;

  while (map.has(cursor)) {
    if (seen.includes(cursor)) return seen;
    seen.push(cursor);
    const next = singleToken.exec(map.get(cursor)!.value);
    if (!next) return [];
    cursor = next[1].trim();
  }

  return [];
};

/**
 * Substitutes `{{key}}` tokens repeatedly, so a variable whose value is itself a
 * template resolves too. Stops after MAX_RESOLUTION_DEPTH passes; anything still
 * substitutable at that point is a cycle and is reported rather than expanded.
 */
export const resolveVariables = (input: string, map: VariableMap): ResolvedText => {
  const missing = new Set<string>();
  const dynamic = new Set<string>();

  const substitute = (source: string, mask: boolean): string => {
    let text = source;
    for (let pass = 0; pass < MAX_RESOLUTION_DEPTH; pass++) {
      let changed = false;
      text = text.replace(VARIABLE_PATTERN, (token, rawKey: string) => {
        const key = rawKey.trim();
        // `{{$randomInt}}` and friends are generated when Postman sends the
        // request — no environment can supply them, so they are not "missing".
        if (key.startsWith('$')) {
          dynamic.add(key);
          return token;
        }
        const entry = map.get(key);
        if (!entry) {
          missing.add(key);
          return token;
        }
        changed = true;
        if (mask && entry.secret) return SECRET_MASK;
        return entry.value;
      });
      if (!changed) break;
    }
    return text;
  };

  const text = substitute(input, false);
  const masked = substitute(input, true);

  // Anything still resolvable after the depth cap is a self-referential chain.
  const circular = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const key = match[1].trim();
    if (key.startsWith('$') || !map.has(key)) continue;
    traceCycle(key, map).forEach(name => circular.add(name));
  }

  return {
    text,
    masked,
    // A non-global copy: `.test()` on the shared pattern would carry lastIndex
    // between calls and start reporting false.
    hasTokens: /\{\{[^{}]*\}\}/.test(text),
    missing: [...missing],
    dynamic: [...dynamic],
    circular: [...circular],
  };
};

const resolveKeyValues = (
  rows: RawKeyValue[] | undefined,
  map: VariableMap,
  kindOf?: (row: RawKeyValue) => 'text' | 'file'
): KeyValue[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(row => row && (typeof row.key === 'string' || typeof row.value !== 'undefined'))
    .map(row => {
      const raw = row.type === 'file' ? filePathOf(row) : asString(row.value);
      return {
        key: asString(row.key),
        raw,
        value: resolveVariables(raw, map),
        disabled: row.disabled === true || row.enabled === false,
        ...(kindOf ? { kind: kindOf(row) } : {}),
      };
    });
};

const filePathOf = (row: RawKeyValue): string => {
  if (Array.isArray(row.src)) return row.src.join(', ');
  if (typeof row.src === 'string') return row.src;
  return asString(row.value);
};

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

const joinUrlParts = (url: RawUrl): string => {
  const host = Array.isArray(url.host) ? url.host.join('.') : asString(url.host);
  const path = Array.isArray(url.path) ? url.path.join('/') : asString(url.path).replace(/^\//, '');
  const protocol = asString(url.protocol);
  const port = asString(url.port);

  let composed = '';
  if (protocol) composed += `${protocol}://`;
  composed += host;
  if (port) composed += `:${port}`;
  if (path) composed += `/${path}`;

  const query = (url.query ?? [])
    .filter(row => row && row.disabled !== true && typeof row.key === 'string')
    .map(row => `${row.key}=${asString(row.value)}`)
    .join('&');
  if (query) composed += `?${query}`;

  const hash = asString(url.hash);
  if (hash) composed += `#${hash}`;

  return composed;
};

/** A leading segment counts as a host if it could not be a path segment instead. */
const looksLikeHost = (segment: string): boolean => {
  if (!segment) return false;
  // A bare `{{baseUrl}}` is the overwhelmingly common Postman idiom.
  if (/^\{\{[^{}]+\}\}/.test(segment)) return true;
  const withoutPort = segment.split(':')[0];
  return withoutPort === 'localhost' || /^\[.+\]$/.test(segment) || /[a-z0-9-]\.[a-z0-9-]/i.test(withoutPort);
};

export type SplitUrl = { origin: string; path: string; queryString: string };

/**
 * Splits a URL that may still contain `{{…}}` tokens, so `new URL()` is not an
 * option — a template is not a valid URL until an environment fills it in.
 */
export const splitUrl = (raw: string): SplitUrl => {
  const trimmed = raw.trim();
  if (!trimmed) return { origin: '', path: '/', queryString: '' };

  const withoutFragment = trimmed.split('#')[0];
  const queryAt = withoutFragment.indexOf('?');
  const queryString = queryAt === -1 ? '' : withoutFragment.slice(queryAt + 1);
  const beforeQuery = queryAt === -1 ? withoutFragment : withoutFragment.slice(0, queryAt);

  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\//i.exec(beforeQuery);
  if (schemeMatch) {
    const rest = beforeQuery.slice(schemeMatch[0].length);
    const slashAt = rest.indexOf('/');
    const authority = slashAt === -1 ? rest : rest.slice(0, slashAt);
    const path = slashAt === -1 ? '' : rest.slice(slashAt);
    return { origin: `${schemeMatch[0]}${authority}`, path: path || '/', queryString };
  }

  const slashAt = beforeQuery.indexOf('/');
  const head = slashAt === -1 ? beforeQuery : beforeQuery.slice(0, slashAt);
  if (looksLikeHost(head)) {
    const path = slashAt === -1 ? '' : beforeQuery.slice(slashAt);
    return { origin: head, path: path || '/', queryString };
  }

  return { origin: '', path: beforeQuery.startsWith('/') ? beforeQuery : `/${beforeQuery}`, queryString };
};

const parseQueryString = (queryString: string, map: VariableMap): KeyValue[] => {
  if (!queryString) return [];
  return queryString
    .split('&')
    .filter(Boolean)
    .map(pair => {
      const equalsAt = pair.indexOf('=');
      const key = equalsAt === -1 ? pair : pair.slice(0, equalsAt);
      const raw = equalsAt === -1 ? '' : pair.slice(equalsAt + 1);
      return { key, raw, value: resolveVariables(raw, map), disabled: false };
    });
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

/** Postman writes auth params as an array of rows in v2.1, an object in v2.0. */
const authParam = (auth: RawAuth, scheme: string, name: string): string => {
  const section = auth[scheme];
  if (Array.isArray(section)) {
    const row = (section as RawKeyValue[]).find(item => item && item.key === name);
    return row ? asString(row.value) : '';
  }
  const record = asRecord(section);
  return record ? asString(record[name]) : '';
};

const keyValueOf = (key: string, raw: string, map: VariableMap): KeyValue => ({
  key,
  raw,
  value: resolveVariables(raw, map),
  disabled: false,
});

export const describeAuth = (auth: RawAuth | undefined, map: VariableMap, inherited: boolean): AuthInfo | undefined => {
  if (!auth || typeof auth.type !== 'string' || auth.type === 'noauth') return undefined;
  const type = auth.type;

  if (type === 'bearer') {
    const token = authParam(auth, 'bearer', 'token');
    const header = keyValueOf('Authorization', `Bearer ${token}`, map);
    return { type, inherited, summary: header.value.masked, header };
  }

  if (type === 'basic') {
    const username = resolveVariables(authParam(auth, 'basic', 'username'), map);
    const password = resolveVariables(authParam(auth, 'basic', 'password'), map);
    return {
      type,
      inherited,
      summary: `${username.masked || '(no username)'}:${password.masked ? SECRET_MASK : '(no password)'}`,
      basic: { username, password },
    };
  }

  if (type === 'apikey') {
    const key = authParam(auth, 'apikey', 'key') || 'X-API-Key';
    const value = authParam(auth, 'apikey', 'value');
    const target = authParam(auth, 'apikey', 'in') === 'query' ? 'query' : 'header';
    const pair = keyValueOf(key, value, map);
    return target === 'query'
      ? { type, inherited, summary: `${key}=${pair.value.masked} (query)`, queryParam: pair }
      : { type, inherited, summary: `${key}: ${pair.value.masked}`, header: pair };
  }

  if (type === 'oauth2') {
    const token = authParam(auth, 'oauth2', 'accessToken');
    if (token) {
      const header = keyValueOf('Authorization', `Bearer ${token}`, map);
      return { type, inherited, summary: header.value.masked, header };
    }
    return { type, inherited, summary: 'OAuth 2.0 — no access token stored in the collection' };
  }

  return { type, inherited, summary: `${type} (not expanded)` };
};

/* ------------------------------------------------------------------ */
/* Bodies                                                              */
/* ------------------------------------------------------------------ */

export const describeBody = (body: RawBody | undefined, map: VariableMap): RequestBody | undefined => {
  if (!body || !body.mode || body.disabled === true) return undefined;

  switch (body.mode) {
    case 'raw':
      return {
        mode: 'raw',
        language: body.options?.raw?.language ?? 'text',
        text: resolveVariables(asString(body.raw), map),
      };
    case 'urlencoded':
      return { mode: 'urlencoded', entries: resolveKeyValues(body.urlencoded, map) };
    case 'formdata':
      return {
        mode: 'formdata',
        entries: resolveKeyValues(body.formdata, map, row => (row.type === 'file' ? 'file' : 'text')),
      };
    case 'graphql': {
      const query = asString(body.graphql?.query);
      const variables = asString(body.graphql?.variables);
      const combined = variables ? `${query}\n\n# variables\n${variables}` : query;
      return { mode: 'graphql', language: 'graphql', text: resolveVariables(combined, map) };
    }
    case 'file':
      return { mode: 'file', text: resolveVariables(asString(body.file?.src), map) };
    default:
      return { mode: body.mode };
  }
};

/* ------------------------------------------------------------------ */
/* Walking the tree                                                    */
/* ------------------------------------------------------------------ */

const normaliseHeaders = (header: RawKeyValue[] | string | undefined, map: VariableMap): KeyValue[] => {
  if (typeof header === 'string') {
    // The spec allows a raw header block; split it the way HTTP does.
    return header
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => {
        const colonAt = line.indexOf(':');
        const key = colonAt === -1 ? line : line.slice(0, colonAt);
        const raw = colonAt === -1 ? '' : line.slice(colonAt + 1).trim();
        return { key: key.trim(), raw, value: resolveVariables(raw, map), disabled: false };
      });
  }
  return resolveKeyValues(header, map);
};

const isFolder = (item: RawItem): boolean => Array.isArray(item.item);

type WalkContext = {
  map: VariableMap;
  folders: string[];
  auth: RawAuth | undefined;
  /** Whether `auth` comes from an ancestor rather than the request itself. */
  authInherited: boolean;
};

const buildRequest = (item: RawItem, context: WalkContext, index: number): ParsedRequest | null => {
  const rawRequest: RawRequest =
    typeof item.request === 'string' ? { method: 'GET', url: item.request } : (item.request ?? {});

  const { map } = context;
  const urlSource: RawUrl | string | undefined = rawRequest.url;
  const urlObject = typeof urlSource === 'object' && urlSource !== null ? (urlSource as RawUrl) : undefined;
  const rawUrl = typeof urlSource === 'string' ? urlSource : asString(urlObject?.raw) || (urlObject ? joinUrlParts(urlObject) : '');

  const resolvedUrl = resolveVariables(rawUrl, map);
  const { origin, path, queryString } = splitUrl(resolvedUrl.text);
  const rawSplit = splitUrl(rawUrl);

  // The object form carries `disabled` flags and descriptions the raw string has
  // lost, so prefer it whenever Postman wrote both.
  const query = urlObject && Array.isArray(urlObject.query)
    ? resolveKeyValues(urlObject.query, map)
    : parseQueryString(queryString, map);

  const auth = rawRequest.auth ?? context.auth;
  const authInherited = rawRequest.auth ? false : context.authInherited;

  const headers = normaliseHeaders(rawRequest.header, map);
  const body = describeBody(rawRequest.body, map);
  const authInfo = describeAuth(auth, map, authInherited);

  const unresolved = mergeUnresolved([
    resolvedUrl,
    ...query.filter(q => !q.disabled).map(q => q.value),
    ...headers.filter(h => !h.disabled).map(h => h.value),
    ...(body?.text ? [body.text] : []),
    ...(body?.entries ?? []).filter(e => !e.disabled).map(e => e.value),
    ...(authInfo?.header ? [authInfo.header.value] : []),
    ...(authInfo?.queryParam ? [authInfo.queryParam.value] : []),
    ...(authInfo?.basic ? [authInfo.basic.username, authInfo.basic.password] : []),
  ]);

  return {
    id: `${context.folders.join('/')}#${index}`,
    name: asString(item.name) || rawUrl || '(unnamed request)',
    folders: context.folders,
    method: (asString(rawRequest.method) || 'GET').toUpperCase(),
    rawUrl,
    url: resolvedUrl,
    // An unresolved origin is shown as authored, so the group header names the
    // variable the user needs to supply.
    origin: origin || rawSplit.origin,
    originResolved: origin !== '' && !origin.includes('{{'),
    path,
    query,
    pathVariables: resolveKeyValues(urlObject?.variable, map),
    headers,
    auth: authInfo,
    body,
    description: asString(rawRequest.description) || asString(item.description),
    unresolved,
  };
};

export const flattenRequests = (collection: RawCollection, map: VariableMap): { requests: ParsedRequest[]; folders: number } => {
  const requests: ParsedRequest[] = [];
  let folders = 0;
  let counter = 0;

  const walk = (items: RawItem[], context: WalkContext) => {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      if (isFolder(item)) {
        folders += 1;
        walk(item.item as RawItem[], {
          ...context,
          folders: [...context.folders, asString(item.name) || '(unnamed folder)'],
          auth: item.auth ?? context.auth,
          authInherited: item.auth ? true : context.authInherited,
        });
        continue;
      }

      if (!item.request) continue;
      const parsed = buildRequest(item, context, counter++);
      if (parsed) requests.push(parsed);
    }
  };

  walk(collection.item ?? [], {
    map,
    folders: [],
    auth: collection.auth,
    authInherited: Boolean(collection.auth),
  });

  return { requests, folders };
};

export const folderTrail = (folders: string[]): string => folders.join(' / ');

/**
 * Groups by folder first, then by host, preserving the order the collection lists
 * them in. Folder and host are both part of the key: a folder that talks to two
 * hosts becomes two groups rather than one group with a misleading header.
 */
export const groupRequests = (requests: ParsedRequest[]): RequestGroup[] => {
  const groups = new Map<string, RequestGroup>();
  for (const request of requests) {
    const origin = request.origin || '(no host)';
    // A separator no folder name or host can contain, so keys cannot collide.
    const id = [...request.folders, origin].join('\u0000');
    const existing = groups.get(id);
    if (existing) {
      existing.requests.push(request);
    } else {
      groups.set(id, {
        id,
        folders: request.folders,
        origin,
        resolved: request.originResolved,
        requests: [request],
      });
    }
  }
  return [...groups.values()];
};

/* ------------------------------------------------------------------ */
/* Top-level view model                                                */
/* ------------------------------------------------------------------ */

export const buildCollectionView = (collectionText: string, environmentText?: string): Parsed<CollectionView> => {
  const collectionParse = parseCollectionFile(collectionText);
  if (!collectionParse.ok) return collectionParse;

  let environmentValues: VariableEntry[] = [];
  if (environmentText && environmentText.trim()) {
    const envParse = parseEnvironmentFile(environmentText);
    if (!envParse.ok) return envParse;
    environmentValues = envParse.value.values;
  }

  const collection = collectionParse.value;
  const collectionVars = collectionVariables(collection);
  const map = buildVariableMap(collectionVars, environmentValues);

  const { requests, folders } = flattenRequests(collection, map);
  const groups = groupRequests(requests);
  const unresolved = mergeUnresolved(requests.map(r => r.unresolved));
  const hosts = new Set(groups.map(group => group.origin));

  return {
    ok: true,
    value: {
      name: asString(collection.info?.name) || 'Untitled collection',
      description: asString(collection.info?.description),
      schemaVersion: schemaVersion(asString(collection.info?.schema)),
      groups,
      stats: {
        requests: requests.length,
        folders,
        hosts: hosts.size,
        missingVariables: unresolved.missing.sort(),
        dynamicVariables: unresolved.dynamic.sort(),
        circularVariables: unresolved.circular.sort(),
      },
      variables: [...map.values()],
      hasSecrets: [...map.values()].some(entry => entry.secret),
    },
  };
};

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

/** `Folder / Subfolder — https://host`, or just the host at the collection root. */
export const groupHeading = (group: RequestGroup): string =>
  group.folders.length > 0 ? `${folderTrail(group.folders)} — ${group.origin}` : group.origin;

export const toOverviewText = (view: CollectionView): string => {
  const lines: string[] = [view.name, ''];
  for (const group of view.groups) {
    const heading = groupHeading(group);
    lines.push(group.resolved ? heading : `${heading}  (unresolved)`);
    for (const request of group.requests) {
      lines.push(`  ${request.method.padEnd(7)} ${request.path}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
};

/** Single-quote shell escaping: close, insert an escaped quote, reopen. */
const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

const contentTypeOf = (headers: KeyValue[]): string | undefined =>
  headers.find(h => !h.disabled && h.key.toLowerCase() === 'content-type')?.value.text;

/**
 * Builds a runnable cURL command. Uses real secret values — this is a command the
 * user is about to run, so masking it would only produce a broken paste.
 */
export const toCurl = (request: ParsedRequest): string => {
  const query = request.query.filter(entry => !entry.disabled);
  const authQuery = request.auth?.queryParam ? [request.auth.queryParam] : [];
  const allQuery = [...query, ...authQuery];

  let url = `${request.origin}${request.path}`;
  if (allQuery.length > 0) {
    url += `?${allQuery.map(entry => `${entry.key}=${entry.value.text}`).join('&')}`;
  }

  const parts = [`curl -X ${request.method} ${shellQuote(url)}`];

  for (const header of request.headers) {
    if (header.disabled) continue;
    parts.push(`-H ${shellQuote(`${header.key}: ${header.value.text}`)}`);
  }

  if (request.auth?.header) {
    const { key, value } = request.auth.header;
    const alreadySet = request.headers.some(h => !h.disabled && h.key.toLowerCase() === key.toLowerCase());
    if (!alreadySet) parts.push(`-H ${shellQuote(`${key}: ${value.text}`)}`);
  }

  if (request.auth?.basic) {
    parts.push(`-u ${shellQuote(`${request.auth.basic.username.text}:${request.auth.basic.password.text}`)}`);
  }

  const body = request.body;
  if (body) {
    if (body.mode === 'raw' && body.text?.text) {
      if (!contentTypeOf(request.headers) && body.language === 'json') {
        parts.push(`-H ${shellQuote('Content-Type: application/json')}`);
      }
      parts.push(`-d ${shellQuote(body.text.text)}`);
    } else if (body.mode === 'urlencoded') {
      const encoded = (body.entries ?? [])
        .filter(entry => !entry.disabled)
        .map(entry => `${entry.key}=${entry.value.text}`)
        .join('&');
      if (!contentTypeOf(request.headers)) {
        parts.push(`-H ${shellQuote('Content-Type: application/x-www-form-urlencoded')}`);
      }
      parts.push(`-d ${shellQuote(encoded)}`);
    } else if (body.mode === 'formdata') {
      for (const entry of body.entries ?? []) {
        if (entry.disabled) continue;
        const value = entry.kind === 'file' ? `@${entry.value.text}` : entry.value.text;
        parts.push(`-F ${shellQuote(`${entry.key}=${value}`)}`);
      }
    } else if (body.mode === 'graphql' && body.text?.text) {
      if (!contentTypeOf(request.headers)) {
        parts.push(`-H ${shellQuote('Content-Type: application/json')}`);
      }
      parts.push(`-d ${shellQuote(JSON.stringify({ query: body.text.text }))}`);
    } else if (body.mode === 'file' && body.text?.text) {
      parts.push(`--data-binary ${shellQuote(`@${body.text.text}`)}`);
    }
  }

  return parts.join(' \\\n  ');
};

/** Case-insensitive match across method, path, name and folder trail. */
export const filterGroups = (groups: RequestGroup[], query: string): RequestGroup[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups
    .map(group => ({
      ...group,
      requests: group.requests.filter(request =>
        [request.method, request.path, request.name, request.folders.join(' '), group.origin]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      ),
    }))
    .filter(group => group.requests.length > 0);
};
