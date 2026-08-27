import {
  parseHeaders,
  parseUrl,
  buildRawRequest,
  buildRequestFromText,
  HttpMethod,
} from '@/Components/Functions/HttpRequestBuilderTools/logic';

describe('parseHeaders', () => {
  it('parses single header', () => {
    const result = parseHeaders('Content-Type: application/json');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Content-Type', value: 'application/json' });
  });

  it('parses multiple headers', () => {
    const result = parseHeaders('Accept: */*\nAuthorization: Bearer token');
    expect(result).toHaveLength(2);
  });

  it('skips comment lines', () => {
    const result = parseHeaders('# comment\nContent-Type: text/plain');
    expect(result).toHaveLength(1);
  });

  it('skips lines without colon', () => {
    const result = parseHeaders('invalidheader\nValid: ok');
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(parseHeaders('')).toHaveLength(0);
    expect(parseHeaders('   ')).toHaveLength(0);
  });
});

describe('parseUrl', () => {
  it('parses full URL', () => {
    const result = parseUrl('https://api.example.com/v1/users?id=1');
    expect(result.protocol).toBe('HTTPS');
    expect(result.host).toBe('api.example.com');
    expect(result.path).toBe('/v1/users');
    expect(result.query).toBe('?id=1');
  });

  it('adds default protocol for bare host', () => {
    const result = parseUrl('example.com/path');
    expect(result.host).toBe('example.com');
    expect(result.path).toBe('/path');
  });

  it('handles path-only URL', () => {
    const result = parseUrl('http://example.com');
    expect(result.path).toBe('/');
  });

  it('returns empty result for empty input', () => {
    const result = parseUrl('');
    expect(result.host).toBe('');
  });
});

describe('buildRawRequest', () => {
  it('builds a GET request', () => {
    const output = buildRawRequest({
      method: 'GET',
      url: 'https://api.example.com/users',
      headersRaw: 'Accept: application/json',
      body: '',
      httpVersion: '1.1',
    });
    expect(output.rawRequest).toContain('GET /users HTTP/1.1');
    expect(output.rawRequest).toContain('Host: api.example.com');
    expect(output.rawRequest).toContain('Accept: application/json');
  });

  it('builds a POST request with body', () => {
    const output = buildRawRequest({
      method: 'POST',
      url: 'https://example.com/api',
      headersRaw: 'Content-Type: application/json',
      body: '{"key":"value"}',
      httpVersion: '1.1',
    });
    expect(output.rawRequest).toContain('POST');
    expect(output.rawRequest).toContain('Content-Length:');
    expect(output.rawRequest).toContain('{"key":"value"}');
  });

  it('generates curl command', () => {
    const output = buildRawRequest({
      method: 'POST',
      url: 'https://example.com/api',
      headersRaw: '',
      body: 'data',
      httpVersion: '1.1',
    });
    expect(output.curlCommand).toContain('curl');
    expect(output.curlCommand).toContain('-X POST');
    expect(output.curlCommand).toContain('https://example.com/api');
  });

  it('generates fetch code', () => {
    const output = buildRawRequest({
      method: 'GET',
      url: 'https://api.example.com',
      headersRaw: '',
      body: '',
      httpVersion: '1.1',
    });
    expect(output.fetchCode).toContain('fetch(');
    expect(output.fetchCode).toContain('https://api.example.com');
  });
});

describe('buildRequestFromText', () => {
  it('returns empty string for empty URL', () => {
    const result = buildRequestFromText({ method: 'GET', url: '', headersRaw: '', body: '', httpVersion: '1.1' });
    expect(result).toBe('');
  });

  it('returns full output with three sections', () => {
    const result = buildRequestFromText({
      method: 'GET',
      url: 'https://api.example.com',
      headersRaw: '',
      body: '',
      httpVersion: '1.1',
    });
    expect(result).toContain('=== Raw HTTP Request ===');
    expect(result).toContain('=== curl Command ===');
    expect(result).toContain('=== JavaScript fetch() ===');
  });
});
