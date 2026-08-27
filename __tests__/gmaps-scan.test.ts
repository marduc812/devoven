import { POST } from '@/app/api/gmaps-scan/route';
import { NextRequest } from 'next/server';

const VALID_KEY = 'AIzaSyEXAMPLE_KEY_FOR_TESTS_ONLY_000000';

function makeRequest(apiKey: string) {
  return new NextRequest('http://localhost/api/gmaps-scan', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetchJson(body: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status,
    headers: { get: (_: string) => 'application/json' },
    json: async () => body,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /api/gmaps-scan – input validation', () => {
  it('rejects missing API key', async () => {
    const res = await POST(new NextRequest('http://localhost/api/gmaps-scan', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it('rejects key with wrong format', async () => {
    const res = await POST(makeRequest('BADKEY123'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid google api key format/i);
  });

  it('rejects key that is too short (38 chars)', async () => {
    const res = await POST(makeRequest(VALID_KEY.slice(0, -1)));
    expect(res.status).toBe(400);
  });

  it('rejects key that is too long (40 chars)', async () => {
    const res = await POST(makeRequest(VALID_KEY + 'k'));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/gmaps-scan – detail is always a string', () => {
  it('returns string detail when API error field is an object (Roads API format)', async () => {
    // Roads API returns error as an object: { code, message, status }
    // This was the crash cause — React cannot render objects as children
    mockFetchJson({ error: { code: 403, message: 'API not authorized', status: 'PERMISSION_DENIED' } }, false, 403);

    const res = await POST(makeRequest(VALID_KEY));
    expect(res.status).toBe(200);
    const results = await res.json();

    for (const result of results) {
      expect(typeof result.detail).toBe('string');
      expect(['vulnerable', 'restricted', 'error']).toContain(result.status);
    }
  });

  it('returns string detail when API error field is a plain string (Maps API format)', async () => {
    mockFetchJson({ error_message: 'This API key is not authorized.' }, false, 403);

    const res = await POST(makeRequest(VALID_KEY));
    expect(res.status).toBe(200);
    const results = await res.json();

    for (const result of results) {
      expect(typeof result.detail).toBe('string');
    }
  });

  it('returns string detail when API returns no error field (vulnerable)', async () => {
    mockFetchJson({ results: [], status: 'OK' }, true, 200);

    const res = await POST(makeRequest(VALID_KEY));
    expect(res.status).toBe(200);
    const results = await res.json();

    for (const result of results) {
      expect(typeof result.detail).toBe('string');
    }
  });

  it('returns string detail when fetch throws a network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    const res = await POST(makeRequest(VALID_KEY));
    expect(res.status).toBe(200);
    const results = await res.json();

    for (const result of results) {
      expect(typeof result.detail).toBe('string');
      expect(result.status).toBe('error');
    }
  });
});

describe('POST /api/gmaps-scan – result structure', () => {
  it('returns an array of 19 results', async () => {
    mockFetchJson({ error_message: 'Restricted' }, false, 403);

    const res = await POST(makeRequest(VALID_KEY));
    const results = await res.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(19);
  });

  it('every result has name, status, and string detail', async () => {
    mockFetchJson({ error_message: 'Restricted' }, false, 403);

    const res = await POST(makeRequest(VALID_KEY));
    const results = await res.json();

    for (const result of results) {
      expect(typeof result.name).toBe('string');
      expect(typeof result.detail).toBe('string');
      expect(['vulnerable', 'restricted', 'error']).toContain(result.status);
    }
  });
});
