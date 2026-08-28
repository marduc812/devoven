import {
  generateMockData,
  detectResourceName,
} from '@/Components/Functions/ApiMockTools/logic';

const SCHEMA = JSON.stringify({
  type: 'object',
  title: 'User',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer' },
    active: { type: 'boolean' },
    role: { type: 'string', enum: ['admin', 'user', 'moderator'] },
  },
});

const EXAMPLE = JSON.stringify({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  active: true,
});

describe('detectResourceName', () => {
  it('extracts title from schema', () => {
    expect(detectResourceName(SCHEMA)).toBe('user');
  });

  it('returns fallback for plain object', () => {
    expect(detectResourceName(EXAMPLE)).toBe('items');
  });
});

describe('generateMockData - mock-data format', () => {
  it('generates correct number of records', () => {
    const output = generateMockData(SCHEMA, 5, 'mock-data');
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(5);
  });

  it('each record has an id', () => {
    const output = generateMockData(SCHEMA, 3, 'mock-data');
    const parsed = JSON.parse(output);
    parsed.forEach((r: Record<string, unknown>) => {
      expect(r.id).toBeDefined();
    });
  });

  it('ids are sequential', () => {
    const output = generateMockData(SCHEMA, 3, 'mock-data');
    const parsed = JSON.parse(output);
    expect(parsed[0].id).toBe(1);
    expect(parsed[1].id).toBe(2);
    expect(parsed[2].id).toBe(3);
  });

  it('email field contains @', () => {
    const output = generateMockData(SCHEMA, 3, 'mock-data');
    const parsed = JSON.parse(output);
    parsed.forEach((r: Record<string, unknown>) => {
      expect((r.email as string)).toContain('@');
    });
  });

  it('role field uses enum values', () => {
    const validRoles = ['admin', 'user', 'moderator'];
    const output = generateMockData(SCHEMA, 10, 'mock-data');
    const parsed = JSON.parse(output);
    parsed.forEach((r: Record<string, unknown>) => {
      expect(validRoles).toContain(r.role);
    });
  });

  it('works from example object', () => {
    const output = generateMockData(EXAMPLE, 3, 'mock-data');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(3);
  });
});

describe('generateMockData - json-server format', () => {
  it('wraps records in resource name key', () => {
    const output = generateMockData(SCHEMA, 2, 'json-server');
    const parsed = JSON.parse(output);
    expect(typeof parsed).toBe('object');
    const keys = Object.keys(parsed);
    expect(keys).toHaveLength(1);
    expect(Array.isArray(parsed[keys[0]])).toBe(true);
    expect(parsed[keys[0]]).toHaveLength(2);
  });
});

describe('generateMockData - msw format', () => {
  it('generates MSW handler code', () => {
    const output = generateMockData(SCHEMA, 2, 'msw');
    expect(output).toContain('http.get');
    expect(output).toContain('http.post');
    expect(output).toContain('http.put');
    expect(output).toContain('http.delete');
    expect(output).toContain('HttpResponse');
  });
});

describe('generateMockData - validation', () => {
  it('throws on invalid JSON', () => {
    expect(() => generateMockData('not json', 1, 'mock-data')).toThrow();
  });

  it('throws on count 0', () => {
    expect(() => generateMockData(SCHEMA, 0, 'mock-data')).toThrow();
  });

  it('throws on count over 100', () => {
    expect(() => generateMockData(SCHEMA, 101, 'mock-data')).toThrow();
  });

  it('throws on empty input', () => {
    expect(() => generateMockData('', 1, 'mock-data')).toThrow();
  });
});
