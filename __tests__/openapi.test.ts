import { parseEndpointDsl, generateOpenApiSnippet } from '@/Components/Functions/OpenApiTools/logic';

describe('parseEndpointDsl', () => {
  it('parses a simple GET request', () => {
    const ep = parseEndpointDsl('GET /users');
    expect(ep.method).toBe('GET');
    expect(ep.path).toBe('/users');
    expect(ep.params).toHaveLength(0);
  });

  it('parses path params from URL', () => {
    const ep = parseEndpointDsl('GET /users/{id}');
    expect(ep.params).toHaveLength(1);
    expect(ep.params[0].name).toBe('id');
    expect(ep.params[0].location).toBe('path');
    expect(ep.params[0].required).toBe(true);
  });

  it('parses query params', () => {
    const ep = parseEndpointDsl('GET /users/{id}\nparams: id (integer, required), page (integer, optional)');
    const pageParam = ep.params.find(p => p.name === 'page');
    expect(pageParam).toBeDefined();
    expect(pageParam!.location).toBe('query');
    expect(pageParam!.required).toBe(false);
  });

  it('parses response fields', () => {
    const ep = parseEndpointDsl('GET /users/{id}\nresponse: 200 {id, name, email}');
    expect(ep.responses).toHaveLength(1);
    expect(ep.responses[0].status).toBe(200);
    expect(ep.responses[0].fields).toContain('id');
  });

  it('parses request body', () => {
    const ep = parseEndpointDsl('POST /users\nbody: {name, email}');
    expect(ep.requestBody).toBeTruthy();
  });

  it('throws on empty input', () => {
    expect(() => parseEndpointDsl('')).toThrow('Empty input');
  });

  it('throws on invalid first line', () => {
    expect(() => parseEndpointDsl('invalid line')).toThrow('First line must be');
  });
});

describe('generateOpenApiSnippet', () => {
  it('returns empty on empty input', () => {
    const result = generateOpenApiSnippet('');
    expect(result.yaml).toBe('');
    expect(result.json).toBe('');
  });

  it('generates valid yaml with openapi key', () => {
    const result = generateOpenApiSnippet('GET /users');
    expect(result.yaml).toContain('openapi');
    expect(result.error).toBeUndefined();
  });

  it('generates valid json', () => {
    const result = generateOpenApiSnippet('GET /users/{id}\nresponse: 200 {id, name}');
    const parsed = JSON.parse(result.json);
    expect(parsed.openapi).toBe('3.0.3');
    expect(parsed.paths['/users/{id}']).toBeDefined();
  });

  it('includes parameters in output', () => {
    const result = generateOpenApiSnippet('GET /users/{id}\nparams: id (integer, required)');
    expect(result.json).toContain('"in"');
  });

  it('sets error on bad input', () => {
    const result = generateOpenApiSnippet('bad input here');
    expect(result.error).toBeDefined();
  });
});
