import {
  CONTENT_TYPE_MAP,
  buildContentType,
  parseContentTypeHeader,
  searchContentTypes,
} from '../Components/Functions/ContentTypeBuilderTools/logic';

describe('CONTENT_TYPE_MAP', () => {
  it('contains at least 100 entries', () => {
    // Count total keys across all entries
    let totalKeys = 0;
    for (const e of CONTENT_TYPE_MAP) {
      totalKeys += e.keys.length;
    }
    expect(totalKeys).toBeGreaterThanOrEqual(100);
  });

  it('each entry has mediaType and notes', () => {
    for (const e of CONTENT_TYPE_MAP) {
      expect(e.mediaType).toBeTruthy();
      expect(e.notes).toBeTruthy();
      expect(e.keys.length).toBeGreaterThan(0);
    }
  });
});

describe('buildContentType', () => {
  it('builds JSON content type', () => {
    const result = buildContentType('json');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('application/json');
    expect(result!.charset).toBe('utf-8');
    expect(result!.fullHeader).toBe('application/json; charset=utf-8');
  });

  it('builds HTML content type', () => {
    const result = buildContentType('html');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('text/html');
    expect(result!.fullHeader).toContain('charset=utf-8');
  });

  it('builds PNG content type without charset', () => {
    const result = buildContentType('png');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('image/png');
    expect(result!.charset).toBeUndefined();
    expect(result!.fullHeader).toBe('image/png');
  });

  it('builds multipart/form-data with boundary', () => {
    const result = buildContentType('multipart');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('multipart/form-data');
    expect(result!.boundary).toBeDefined();
    expect(result!.fullHeader).toContain('boundary=');
  });

  it('builds form-urlencoded', () => {
    const result = buildContentType('form');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('application/x-www-form-urlencoded');
  });

  it('returns null for unknown type', () => {
    expect(buildContentType('xyznotatype')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(buildContentType('')).toBeNull();
  });

  it('handles htm alias', () => {
    const result = buildContentType('htm');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('text/html');
  });

  it('handles jpeg alias', () => {
    const result = buildContentType('jpeg');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('image/jpeg');
  });
});

describe('parseContentTypeHeader', () => {
  it('parses simple JSON header', () => {
    const result = parseContentTypeHeader('application/json');
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe('application/json');
    expect(result!.subtype).toBe('json');
  });

  it('parses charset', () => {
    const result = parseContentTypeHeader('text/html; charset=utf-8');
    expect(result).not.toBeNull();
    expect(result!.charset).toBe('utf-8');
  });

  it('parses boundary', () => {
    const result = parseContentTypeHeader('multipart/form-data; boundary=----WebKitFormBoundaryABC123');
    expect(result).not.toBeNull();
    expect(result!.boundary).toBe('----WebKitFormBoundaryABC123');
  });

  it('parses quoted charset', () => {
    const result = parseContentTypeHeader('text/plain; charset="utf-8"');
    expect(result).not.toBeNull();
    expect(result!.charset).toBe('utf-8');
  });

  it('returns null for empty input', () => {
    expect(parseContentTypeHeader('')).toBeNull();
  });

  it('returns null for invalid header (no slash)', () => {
    expect(parseContentTypeHeader('notype')).toBeNull();
  });

  it('handles multiple parameters', () => {
    const result = parseContentTypeHeader('multipart/mixed; boundary=xyz; charset=utf-8');
    expect(result).not.toBeNull();
    expect(result!.boundary).toBe('xyz');
    expect(result!.charset).toBe('utf-8');
  });
});

describe('searchContentTypes', () => {
  it('returns up to 20 results for empty query', () => {
    const results = searchContentTypes('');
    expect(results.length).toBeLessThanOrEqual(20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds JSON by key', () => {
    const results = searchContentTypes('json');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(e => e.keys.includes('json'))).toBe(true);
  });

  it('finds by media type', () => {
    const results = searchContentTypes('image/png');
    expect(results.some(e => e.mediaType === 'image/png')).toBe(true);
  });

  it('finds by description', () => {
    const results = searchContentTypes('PDF');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no matches', () => {
    expect(searchContentTypes('xyznonexistenttype99999')).toHaveLength(0);
  });
});
