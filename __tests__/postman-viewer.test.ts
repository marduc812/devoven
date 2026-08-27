import {
  SECRET_MASK,
  buildCollectionView,
  buildVariableMap,
  describeAuth,
  filterGroups,
  groupRequests,
  parseCollectionFile,
  parseEnvironmentFile,
  resolveVariables,
  splitUrl,
  toCurl,
  toOverviewText,
} from '../Components/Functions/PostmanViewer/logic';
import type { VariableEntry } from '../Components/Functions/PostmanViewer/types';

const vars = (entries: Record<string, string>, source: 'collection' | 'environment' = 'collection'): VariableEntry[] =>
  Object.entries(entries).map(([key, value]) => ({ key, value, source, secret: false }));

const COLLECTION = JSON.stringify({
  info: {
    name: 'Example API',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [{ key: 'baseUrl', value: 'https://api.example.com' }],
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] },
  item: [
    {
      name: 'Users',
      item: [
        {
          name: 'List users',
          request: { method: 'GET', url: '{{baseUrl}}/users?limit=10' },
        },
        {
          name: 'Create user',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: '{{baseUrl}}/users',
              host: ['{{baseUrl}}'],
              path: ['users'],
            },
            body: { mode: 'raw', raw: '{"name":"test"}', options: { raw: { language: 'json' } } },
          },
        },
      ],
    },
    {
      name: 'Health',
      request: { method: 'GET', url: '{{healthUrl}}/health' },
    },
  ],
});

const ENVIRONMENT = JSON.stringify({
  name: 'Staging',
  values: [
    { key: 'baseUrl', value: 'https://staging.example.com', enabled: true },
    { key: 'token', value: 'super-secret', enabled: true, type: 'secret' },
    { key: 'unused', value: 'nope', enabled: false },
  ],
  _postman_variable_scope: 'environment',
});

describe('file parsing', () => {
  it('accepts a v2.1 collection', () => {
    const result = parseCollectionFile(COLLECTION);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid JSON with the parser message', () => {
    const result = parseCollectionFile('{nope');
    expect(result).toMatchObject({ ok: false });
    expect((result as { error: string }).error).toMatch(/not valid JSON/);
  });

  it('names the v1 format instead of failing generically', () => {
    const v1 = JSON.stringify({ id: 'abc', name: 'Old', requests: [{ url: 'https://x.test', method: 'GET' }] });
    expect(parseCollectionFile(v1)).toEqual({
      ok: false,
      error: 'That is a Collection v1 export. Re-export it from Postman as Collection v2.1 and try again.',
    });
  });

  it('tells you when an environment lands on the collection pane', () => {
    const result = parseCollectionFile(ENVIRONMENT);
    expect((result as { error: string }).error).toMatch(/environment export/);
  });

  it('tells you when a collection lands on the environment pane', () => {
    const result = parseEnvironmentFile(COLLECTION);
    expect((result as { error: string }).error).toMatch(/collection, not an environment/);
  });

  it('reads environment values and skips disabled rows', () => {
    const result = parseEnvironmentFile(ENVIRONMENT);
    expect(result.ok).toBe(true);
    const env = (result as { value: { name: string; scope: string; values: VariableEntry[] } }).value;
    expect(env.name).toBe('Staging');
    expect(env.scope).toBe('environment');
    expect(env.values.map(v => v.key)).toEqual(['baseUrl', 'token']);
    expect(env.values.find(v => v.key === 'token')?.secret).toBe(true);
  });

  it('recognises a globals export', () => {
    const globals = JSON.stringify({ name: 'Globals', values: [{ key: 'a', value: '1' }], _postman_variable_scope: 'globals' });
    const result = parseEnvironmentFile(globals);
    expect((result as { value: { scope: string } }).value.scope).toBe('globals');
  });
});

describe('variable resolution', () => {
  it('substitutes known variables', () => {
    const map = buildVariableMap(vars({ baseUrl: 'https://api.test' }));
    expect(resolveVariables('{{baseUrl}}/users', map).text).toBe('https://api.test/users');
  });

  it('resolves a variable whose value is itself a template', () => {
    const map = buildVariableMap(vars({ host: 'api.test', baseUrl: 'https://{{host}}' }));
    expect(resolveVariables('{{baseUrl}}/users', map).text).toBe('https://api.test/users');
  });

  it('reports missing variables and leaves the token in place', () => {
    const map = buildVariableMap(vars({}));
    const result = resolveVariables('{{baseUrl}}/users', map);
    expect(result.text).toBe('{{baseUrl}}/users');
    expect(result.missing).toEqual(['baseUrl']);
    expect(result.hasTokens).toBe(true);
  });

  it('classifies dynamic variables separately from missing ones', () => {
    const result = resolveVariables('{{$guid}}-{{nope}}', buildVariableMap(vars({})));
    expect(result.dynamic).toEqual(['$guid']);
    expect(result.missing).toEqual(['nope']);
  });

  it('does not hang on a circular chain, and names every key in the loop', () => {
    const map = buildVariableMap(vars({ a: '{{b}}', b: '{{a}}' }));
    const result = resolveVariables('{{a}}', map);
    expect(result.circular.sort()).toEqual(['a', 'b']);
  });

  it('calls a chain that dead-ends missing, not circular', () => {
    const map = buildVariableMap(vars({ a: '{{b}}', b: '{{nowhere}}' }));
    const result = resolveVariables('{{a}}', map);
    expect(result.circular).toEqual([]);
    expect(result.missing).toEqual(['nowhere']);
  });

  it('lets the environment override a collection variable', () => {
    const map = buildVariableMap(
      vars({ baseUrl: 'https://collection.test' }),
      vars({ baseUrl: 'https://env.test' }, 'environment')
    );
    expect(resolveVariables('{{baseUrl}}', map).text).toBe('https://env.test');
  });

  it('masks secret values but keeps the real one available', () => {
    const map = buildVariableMap([{ key: 'token', value: 'hunter2', source: 'environment', secret: true }]);
    const result = resolveVariables('Bearer {{token}}', map);
    expect(result.text).toBe('Bearer hunter2');
    expect(result.masked).toBe(`Bearer ${SECRET_MASK}`);
  });
});

describe('splitUrl', () => {
  it('splits an absolute URL', () => {
    expect(splitUrl('https://api.test:8080/users/42?x=1#frag')).toEqual({
      origin: 'https://api.test:8080',
      path: '/users/42',
      queryString: 'x=1',
    });
  });

  it('treats a leading variable token as the host', () => {
    expect(splitUrl('{{baseUrl}}/users')).toEqual({ origin: '{{baseUrl}}', path: '/users', queryString: '' });
  });

  it('treats a bare domain as the host', () => {
    expect(splitUrl('api.example.com/v1/users')).toEqual({
      origin: 'api.example.com',
      path: '/v1/users',
      queryString: '',
    });
  });

  it('treats localhost as a host', () => {
    expect(splitUrl('localhost:3000/api').origin).toBe('localhost:3000');
  });

  it('keeps a path-only URL hostless', () => {
    expect(splitUrl('/users/42')).toEqual({ origin: '', path: '/users/42', queryString: '' });
  });

  it('defaults an origin-only URL to /', () => {
    expect(splitUrl('https://api.test').path).toBe('/');
  });

  it('preserves path variables', () => {
    expect(splitUrl('https://api.test/users/:id').path).toBe('/users/:id');
  });
});

describe('auth', () => {
  const map = buildVariableMap(vars({ token: 'abc' }));

  it('expands the v2.1 array form', () => {
    const auth = describeAuth({ type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] }, map, false);
    expect(auth?.header).toMatchObject({ key: 'Authorization' });
    expect(auth?.header?.value.text).toBe('Bearer abc');
  });

  it('expands the v2.0 object form', () => {
    const auth = describeAuth({ type: 'bearer', bearer: { token: '{{token}}' } }, map, false);
    expect(auth?.header?.value.text).toBe('Bearer abc');
  });

  it('puts an apikey in the query when Postman says so', () => {
    const auth = describeAuth(
      { type: 'apikey', apikey: [{ key: 'key', value: 'api_key' }, { key: 'value', value: 'k1' }, { key: 'in', value: 'query' }] },
      map,
      false
    );
    expect(auth?.queryParam).toMatchObject({ key: 'api_key' });
    expect(auth?.header).toBeUndefined();
  });

  it('ignores noauth', () => {
    expect(describeAuth({ type: 'noauth' }, map, false)).toBeUndefined();
  });
});

describe('buildCollectionView', () => {
  it('groups requests under their folder and resolved host', () => {
    const result = buildCollectionView(COLLECTION, ENVIRONMENT);
    expect(result.ok).toBe(true);
    const view = (result as { value: ReturnType<typeof Object> }).value as import('../Components/Functions/PostmanViewer/types').CollectionView;

    const staging = view.groups.find(g => g.origin === 'https://staging.example.com');
    expect(staging?.folders).toEqual(['Users']);
    expect(staging?.resolved).toBe(true);
    expect(staging?.requests.map(r => `${r.method} ${r.path}`)).toEqual(['GET /users', 'POST /users']);
  });

  it('leaves collection-root requests in a folderless group', () => {
    const view = (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups.find(g => g.origin === '{{healthUrl}}')?.folders).toEqual([]);
  });

  it('splits one folder into a group per host, and still counts the hosts once', () => {
    const collection = JSON.stringify({
      info: { name: 'Split' },
      item: [
        {
          name: 'Mixed',
          item: [
            { name: 'a', request: { method: 'GET', url: 'https://one.test/a' } },
            { name: 'b', request: { method: 'GET', url: 'https://two.test/b' } },
          ],
        },
        { name: 'c', request: { method: 'GET', url: 'https://one.test/c' } },
      ],
    });
    const view = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups.map(g => [g.folders.join('/'), g.origin])).toEqual([
      ['Mixed', 'https://one.test'],
      ['Mixed', 'https://two.test'],
      ['', 'https://one.test'],
    ]);
    expect(view.stats.hosts).toBe(2);
  });

  it('keeps same-named folders at different depths apart', () => {
    const collection = JSON.stringify({
      info: { name: 'Nested' },
      item: [
        {
          name: 'v1',
          item: [
            { name: 'a', request: { method: 'GET', url: 'https://api.test/a' } },
            {
              name: 'v1',
              item: [{ name: 'b', request: { method: 'GET', url: 'https://api.test/b' } }],
            },
          ],
        },
      ],
    });
    const view = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups.map(g => g.folders)).toEqual([['v1'], ['v1', 'v1']]);
  });

  it('groups an unresolved host under its literal token and reports the key', () => {
    const view = (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    const unresolved = view.groups.find(g => g.origin === '{{healthUrl}}');
    expect(unresolved?.resolved).toBe(false);
    expect(view.stats.missingVariables).toContain('healthUrl');
  });

  it('falls back to collection variables with no environment', () => {
    const view = (buildCollectionView(COLLECTION) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups.map(g => g.origin)).toContain('https://api.example.com');
  });

  it('records folder trail, counts and schema version', () => {
    const view = (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.name).toBe('Example API');
    expect(view.schemaVersion).toBe('v2.1.0');
    expect(view.stats.requests).toBe(3);
    expect(view.stats.folders).toBe(1);
    expect(view.groups[0].requests[0].folders).toEqual(['Users']);
    expect(view.hasSecrets).toBe(true);
  });

  it('inherits collection-level auth into every request', () => {
    const view = (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    const request = view.groups[0].requests[0];
    expect(request.auth?.type).toBe('bearer');
    expect(request.auth?.inherited).toBe(true);
    expect(request.auth?.summary).toBe(`Bearer ${SECRET_MASK}`);
  });

  it('surfaces an environment parse failure', () => {
    const result = buildCollectionView(COLLECTION, '{oops');
    expect(result.ok).toBe(false);
  });

  it('reads a URL given only as host/path parts', () => {
    const collection = JSON.stringify({
      info: { name: 'Parts' },
      item: [{ name: 'x', request: { method: 'GET', url: { protocol: 'https', host: ['api', 'test'], path: ['v1', 'ping'] } } }],
    });
    const view = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups[0].origin).toBe('https://api.test');
    expect(view.groups[0].requests[0].path).toBe('/v1/ping');
  });

  it('prefers the object query form so disabled params stay marked', () => {
    const collection = JSON.stringify({
      info: { name: 'Q' },
      item: [
        {
          name: 'x',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.test/search?q=hi&debug=1',
              query: [
                { key: 'q', value: 'hi' },
                { key: 'debug', value: '1', disabled: true },
              ],
            },
          },
        },
      ],
    });
    const view = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(view.groups[0].requests[0].query).toHaveLength(2);
    expect(view.groups[0].requests[0].query[1].disabled).toBe(true);
  });
});

describe('exports', () => {
  const view = (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;

  it('writes the folder / host / method / path overview', () => {
    expect(toOverviewText(view)).toBe(
      [
        'Example API',
        '',
        'Users — https://staging.example.com',
        '  GET     /users',
        '  POST    /users',
        '',
        '{{healthUrl}}  (unresolved)',
        '  GET     /health',
      ].join('\n')
    );
  });

  it('builds a cURL command with real secret values', () => {
    const post = view.groups[0].requests[1];
    const curl = toCurl(post);
    expect(curl).toContain("curl -X POST 'https://staging.example.com/users'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain("-H 'Authorization: Bearer super-secret'");
    expect(curl).toContain(`-d '{"name":"test"}'`);
  });

  it('carries query parameters into the cURL URL', () => {
    expect(toCurl(view.groups[0].requests[0])).toContain("'https://staging.example.com/users?limit=10'");
  });

  it('escapes single quotes so the command stays runnable', () => {
    const collection = JSON.stringify({
      info: { name: 'Q' },
      item: [{ name: 'x', request: { method: 'POST', url: 'https://api.test/x', body: { mode: 'raw', raw: "it's" } } }],
    });
    const quoted = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(toCurl(quoted.groups[0].requests[0])).toContain(`-d 'it'\\''s'`);
  });

  it('uses -F for form-data and @ for file rows', () => {
    const collection = JSON.stringify({
      info: { name: 'F' },
      item: [
        {
          name: 'upload',
          request: {
            method: 'POST',
            url: 'https://api.test/upload',
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'name', value: 'report' },
                { key: 'file', type: 'file', src: '/tmp/a.pdf' },
              ],
            },
          },
        },
      ],
    });
    const form = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    const curl = toCurl(form.groups[0].requests[0]);
    expect(curl).toContain("-F 'name=report'");
    expect(curl).toContain("-F 'file=@/tmp/a.pdf'");
  });

  it('sends basic auth as -u', () => {
    const collection = JSON.stringify({
      info: { name: 'B' },
      auth: { type: 'basic', basic: [{ key: 'username', value: 'u' }, { key: 'password', value: 'p' }] },
      item: [{ name: 'x', request: { method: 'GET', url: 'https://api.test/x' } }],
    });
    const basic = (buildCollectionView(collection) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value;
    expect(toCurl(basic.groups[0].requests[0])).toContain("-u 'u:p'");
  });
});

describe('filterGroups', () => {
  const groups = groupRequests(
    (buildCollectionView(COLLECTION, ENVIRONMENT) as { value: import('../Components/Functions/PostmanViewer/types').CollectionView }).value.groups.flatMap(
      g => g.requests
    )
  );

  it('returns everything for an empty query', () => {
    expect(filterGroups(groups, '  ')).toBe(groups);
  });

  it('matches on method', () => {
    const filtered = filterGroups(groups, 'post');
    expect(filtered.flatMap(g => g.requests)).toHaveLength(1);
  });

  it('matches on path and drops emptied groups', () => {
    const filtered = filterGroups(groups, '/health');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].origin).toBe('{{healthUrl}}');
  });
});
