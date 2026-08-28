import { buildUrl, parseUrlInput } from '@/Components/Functions/UrlBuilderTools/logic';

describe('buildUrl', () => {
  it('builds a simple URL', () => {
    expect(buildUrl({ protocol: 'https', hostname: 'example.com' })).toBe('https://example.com/');
  });
  it('includes port', () => {
    expect(buildUrl({ protocol: 'http', hostname: 'localhost', port: '3000' })).toBe('http://localhost:3000/');
  });
  it('includes path', () => {
    expect(buildUrl({ protocol: 'https', hostname: 'api.example.com', pathname: '/v1/users' })).toBe('https://api.example.com/v1/users');
  });
  it('includes query params', () => {
    const url = buildUrl({ protocol: 'https', hostname: 'example.com', params: { q: 'hello', page: '1' } });
    expect(url).toContain('q=hello');
    expect(url).toContain('page=1');
  });
  it('encodes special chars in params', () => {
    const url = buildUrl({ protocol: 'https', hostname: 'example.com', params: { q: 'hello world' } });
    expect(url).toContain('hello%20world');
  });
  it('includes hash', () => {
    expect(buildUrl({ protocol: 'https', hostname: 'example.com', hash: 'section-1' })).toContain('#section-1');
  });
  it('throws when hostname is missing', () => {
    expect(() => buildUrl({ protocol: 'https', hostname: '' })).toThrow();
  });
});

describe('parseUrlInput', () => {
  it('parses protocol and host', () => {
    const r = parseUrlInput('protocol: https\nhost: example.com');
    expect(r).toBe('https://example.com/');
  });
  it('parses with path and params', () => {
    const r = parseUrlInput('host: api.example.com\npath: /search\nparam: q=test');
    expect(r).toContain('/search');
    expect(r).toContain('q=test');
  });
});
