import {
  MAX_TRACKED,
  ToolUsage,
  parseUsage,
  recordUsage,
  sortUsage,
} from '@/lib/recentTools';

const tool = (link: string, count: number, lastUsed: number): ToolUsage => ({
  link,
  name: link,
  category: 'encode',
  count,
  lastUsed,
});

describe('parseUsage', () => {
  it('returns an empty list for missing or broken storage values', () => {
    expect(parseUsage(null)).toEqual([]);
    expect(parseUsage('')).toEqual([]);
    expect(parseUsage('not json')).toEqual([]);
    expect(parseUsage('{"link":"/a"}')).toEqual([]);
  });

  it('drops entries that do not have the full shape', () => {
    const raw = JSON.stringify([
      tool('/encoding/base64-encode', 3, 100),
      { link: '/encoding/rot13' },
      null,
      { ...tool('/encoding/md5', 1, 5), count: 'many' },
    ]);
    expect(parseUsage(raw)).toEqual([tool('/encoding/base64-encode', 3, 100)]);
  });
});

describe('sortUsage', () => {
  it('orders by count, then by most recent', () => {
    const sorted = sortUsage([
      tool('/a', 1, 10),
      tool('/b', 5, 1),
      tool('/c', 1, 99),
    ]);
    expect(sorted.map((entry) => entry.link)).toEqual(['/b', '/c', '/a']);
  });

  it('does not mutate the input', () => {
    const entries = [tool('/a', 1, 1), tool('/b', 2, 2)];
    sortUsage(entries);
    expect(entries.map((entry) => entry.link)).toEqual(['/a', '/b']);
  });
});

describe('recordUsage', () => {
  const visit = { link: '/encoding/base64-encode', name: 'Base64 Encode', category: 'encode' };

  it('adds a first-time tool with a count of one', () => {
    expect(recordUsage([], visit, 500)).toEqual([
      { ...visit, count: 1, lastUsed: 500 },
    ]);
  });

  it('increments an existing tool and restamps it', () => {
    const existing = [{ ...visit, count: 4, lastUsed: 100 }];
    expect(recordUsage(existing, visit, 700)).toEqual([
      { ...visit, count: 5, lastUsed: 700 },
    ]);
  });

  it('keeps one entry per tool', () => {
    const twice = recordUsage(recordUsage([], visit, 1), visit, 2);
    expect(twice).toHaveLength(1);
    expect(twice[0].count).toBe(2);
  });

  it('refreshes the name and category if the menu entry changed', () => {
    const existing = [{ ...visit, name: 'Old Name', category: 'text', count: 2, lastUsed: 1 }];
    const [updated] = recordUsage(existing, visit, 3);
    expect(updated.name).toBe('Base64 Encode');
    expect(updated.category).toBe('encode');
  });

  it('drops the least used tool once the cap is reached', () => {
    const full = Array.from({ length: MAX_TRACKED }, (_, i) =>
      tool(`/tool-${i}`, MAX_TRACKED - i, i)
    );
    const next = recordUsage(full, visit, 1000);
    expect(next).toHaveLength(MAX_TRACKED);
    expect(next.map((entry) => entry.link)).toContain(visit.link);
    expect(next.map((entry) => entry.link)).not.toContain(`/tool-${MAX_TRACKED - 1}`);
  });
});
