export type MockOutputFormat = 'mock-data' | 'json-server' | 'msw';

interface RandomState {
  seed: number;
}

function nextRandom(state: RandomState): number {
  // LCG random number generator (deterministic)
  state.seed = (state.seed * 1664525 + 1013904223) & 0x7fffffff;
  return state.seed / 0x7fffffff;
}

function randomInt(state: RandomState, min: number, max: number): number {
  return Math.floor(nextRandom(state) * (max - min + 1)) + min;
}

function randomChoice<T>(state: RandomState, arr: T[]): T {
  return arr[Math.floor(nextRandom(state) * arr.length)];
}

const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
const LAST_NAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts'];
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do'];
const TLDS = ['com', 'net', 'org', 'io', 'dev'];
const CITIES = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Toronto', 'Seoul', 'Mumbai', 'Dubai'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'magenta', 'black'];
const STATUS_VALUES = ['active', 'inactive', 'pending', 'archived'];

function mockValueForType(state: RandomState, type: string, format: string | undefined, key: string): unknown {
  // Detect by key name first
  const keyLower = key.toLowerCase();
  if (keyLower.includes('id') && !keyLower.includes('valid')) return randomInt(state, 1, 9999);
  if (keyLower === 'name' || keyLower.includes('fullname')) {
    return `${randomChoice(state, FIRST_NAMES)} ${randomChoice(state, LAST_NAMES)}`;
  }
  if (keyLower.includes('first') && keyLower.includes('name')) return randomChoice(state, FIRST_NAMES);
  if (keyLower.includes('last') && keyLower.includes('name')) return randomChoice(state, LAST_NAMES);
  if (keyLower.includes('email')) {
    return `${randomChoice(state, FIRST_NAMES).toLowerCase()}${randomInt(state, 1, 99)}@${randomChoice(state, WORDS)}${randomChoice(state, ['.com', '.net', '.org'])}`;
  }
  if (keyLower.includes('phone')) return `+1${randomInt(state, 200, 999)}${randomInt(state, 1000000, 9999999)}`;
  if (keyLower.includes('url') || keyLower.includes('website')) {
    return `https://${randomChoice(state, WORDS)}.${randomChoice(state, TLDS)}`;
  }
  if (keyLower.includes('city')) return randomChoice(state, CITIES);
  if (keyLower.includes('color') || keyLower.includes('colour')) return randomChoice(state, COLORS);
  if (keyLower.includes('status')) return randomChoice(state, STATUS_VALUES);
  if (keyLower.includes('age')) return randomInt(state, 18, 80);
  if (keyLower.includes('price') || keyLower.includes('amount') || keyLower.includes('cost')) {
    return Math.round(nextRandom(state) * 9900 + 100) / 100;
  }
  if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('at')) {
    const y = randomInt(state, 2020, 2025);
    const m = String(randomInt(state, 1, 12)).padStart(2, '0');
    const d = String(randomInt(state, 1, 28)).padStart(2, '0');
    return `${y}-${m}-${d}T${String(randomInt(state, 0, 23)).padStart(2, '0')}:${String(randomInt(state, 0, 59)).padStart(2, '0')}:00Z`;
  }
  if (keyLower.includes('description') || keyLower.includes('bio') || keyLower.includes('note')) {
    const wordCount = randomInt(state, 5, 12);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) words.push(randomChoice(state, WORDS));
    return words.join(' ');
  }
  if (keyLower.includes('count') || keyLower.includes('total') || keyLower.includes('num')) {
    return randomInt(state, 0, 1000);
  }
  if (keyLower.includes('active') || keyLower.includes('enabled') || keyLower.includes('verified')) {
    return nextRandom(state) > 0.5;
  }

  // Fall back to type
  switch (type) {
    case 'string':
      if (format === 'email') return `user${randomInt(state, 1, 999)}@example.com`;
      if (format === 'date') {
        const y = randomInt(state, 2020, 2025);
        const m = String(randomInt(state, 1, 12)).padStart(2, '0');
        const d = String(randomInt(state, 1, 28)).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      if (format === 'date-time') {
        const y = randomInt(state, 2020, 2025);
        const m = String(randomInt(state, 1, 12)).padStart(2, '0');
        const d = String(randomInt(state, 1, 28)).padStart(2, '0');
        return `${y}-${m}-${d}T00:00:00Z`;
      }
      if (format === 'uri' || format === 'url') return `https://example.com/${randomChoice(state, WORDS)}`;
      if (format === 'uuid') {
        const hex = () => randomInt(state, 0, 15).toString(16);
        const s4 = () => hex() + hex() + hex() + hex();
        return `${s4()}${s4()}-${s4()}-4${hex()}${hex()}${hex()}-${hex()}${hex()}${hex()}${hex()}-${s4()}${s4()}${s4()}`;
      }
      return randomChoice(state, WORDS);
    case 'number':
    case 'integer':
      return randomInt(state, 1, 1000);
    case 'boolean':
      return nextRandom(state) > 0.5;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'null':
      return null;
    default:
      return randomChoice(state, WORDS);
  }
}

function generateFromSchema(state: RandomState, schema: Record<string, unknown>, resourceName: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!props) {
    // Try to generate from example type
    return { id: randomInt(state, 1, 9999), name: `${randomChoice(state, FIRST_NAMES)} ${randomChoice(state, LAST_NAMES)}` };
  }
  for (const [key, propSchema] of Object.entries(props)) {
    if (propSchema.type === 'array') {
      const items = propSchema.items as Record<string, unknown> | undefined;
      if (items && items.type === 'object') {
        obj[key] = [generateFromSchema(state, items, key)];
      } else {
        const itemType = (items && items.type as string) || 'string';
        obj[key] = [mockValueForType(state, itemType, items && (items.format as string), key)];
      }
    } else if (propSchema.type === 'object') {
      obj[key] = generateFromSchema(state, propSchema, key);
    } else {
      const enumVals = propSchema.enum as unknown[] | undefined;
      if (enumVals && enumVals.length > 0) {
        obj[key] = randomChoice(state, enumVals);
      } else {
        obj[key] = mockValueForType(state, propSchema.type as string || 'string', propSchema.format as string | undefined, key);
      }
    }
  }
  return obj;
}

function generateFromExample(state: RandomState, example: Record<string, unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(example)) {
    const type = typeof value;
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        obj[key] = [generateFromExample(state, value[0] as Record<string, unknown>)];
      } else {
        const itemType = value.length > 0 ? typeof value[0] : 'string';
        obj[key] = [mockValueForType(state, itemType, undefined, key)];
      }
    } else if (type === 'object' && value !== null) {
      obj[key] = generateFromExample(state, value as Record<string, unknown>);
    } else {
      obj[key] = mockValueForType(state, type, undefined, key);
    }
  }
  return obj;
}

export function detectResourceName(input: string): string {
  try {
    const parsed = JSON.parse(input);
    if (parsed.title) return (parsed.title as string).toLowerCase().replace(/\s+/g, '_');
    if (parsed.$id) return (parsed.$id as string).split('/').pop() || 'items';
  } catch (_e) {
    // ignore
  }
  return 'items';
}

export function generateMockData(
  input: string,
  count: number,
  format: MockOutputFormat
): string {
  if (!input.trim()) throw new Error('Input is empty');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input);
  } catch (_e) {
    throw new Error('Input must be valid JSON (a JSON Schema or example object)');
  }

  if (count < 1 || count > 100) throw new Error('Count must be between 1 and 100');

  const resourceName = detectResourceName(input);
  const state: RandomState = { seed: 42 };

  const isSchema = typeof parsed.type !== 'undefined' || typeof parsed.properties !== 'undefined' || typeof parsed.$schema !== 'undefined';
  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    state.seed = (state.seed + i * 137) & 0x7fffffff;
    let record: Record<string, unknown>;
    if (isSchema) {
      const schemaToUse = (parsed.type === 'array' && parsed.items)
        ? (parsed.items as Record<string, unknown>)
        : parsed;
      record = generateFromSchema(state, schemaToUse, resourceName);
    } else {
      record = generateFromExample(state, parsed);
    }
    // Ensure there's always an id
    if (!('id' in record)) {
      record = { id: i + 1, ...record };
    } else {
      record.id = i + 1;
    }
    records.push(record);
  }

  if (format === 'mock-data') {
    return JSON.stringify(records, null, 2);
  }

  if (format === 'json-server') {
    const db: Record<string, unknown[]> = {};
    db[resourceName] = records;
    return JSON.stringify(db, null, 2);
  }

  // MSW handler
  const singleRecord = records[0];
  const allRecordsJson = JSON.stringify(records, null, 4).split('\n').map(l => '    ' + l).join('\n');
  const singleJson = JSON.stringify(singleRecord, null, 4).split('\n').map(l => '    ' + l).join('\n');
  return `// Mock Service Worker (MSW) handler
// npm install msw --save-dev
import { http, HttpResponse } from 'msw';

export const ${resourceName}Handlers = [
  // GET all ${resourceName}
  http.get('/api/${resourceName}', () => {
    return HttpResponse.json(
${allRecordsJson}
    );
  }),

  // GET single ${resourceName}
  http.get('/api/${resourceName}/:id', ({ params }) => {
    return HttpResponse.json(
${singleJson}
    );
  }),

  // POST create ${resourceName}
  http.post('/api/${resourceName}', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: ${count + 1}, ...body }, { status: 201 });
  }),

  // PUT update ${resourceName}
  http.put('/api/${resourceName}/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  // DELETE ${resourceName}
  http.delete('/api/${resourceName}/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];`;
}
