import { parseCsvRecord } from '../Components/Functions/CsvViewer/parse';

describe('CSV viewer records', () => {
  it('parses quoted commas, newlines, escaped quotes, and empty cells', () => {
    expect(parseCsvRecord('one,"two, three","line 1\nline 2","a""b",')).toEqual([
      'one', 'two, three', 'line 1\nline 2', 'a"b', '',
    ]);
  });
});

describe('CSV viewer worker', () => {
  it('searches a 10 MB file without returning the whole file to the page', async () => {
    const messages: Array<Record<string, unknown>> = [];
    const scope = { postMessage: (message: Record<string, unknown>) => messages.push(message), onmessage: null as null | ((event: { data: unknown }) => void) };
    Object.defineProperty(globalThis, 'self', { value: scope, configurable: true });
    try {
      jest.isolateModules(() => { require('../Components/Functions/CsvViewer/csv.worker'); });
      const body = Array.from({ length: 500000 }, (_, i) => `${i},sample text ${i % 1000}`).join('\n');
      const csv = `id,note\n${body}`;
      expect(new Blob([csv]).size).toBeGreaterThan(10 * 1024 * 1024);
      scope.onmessage!({ data: { type: 'open', file: new File([csv], '10mb.csv') } });
      for (let i = 0; i < 200 && !messages.some(m => m.type === 'complete'); i++) await new Promise(resolve => setTimeout(resolve, 20));
      expect(messages.find(m => m.type === 'complete')).toMatchObject({ rows: 500001 });
      scope.onmessage!({ data: { type: 'query', queryId: 1, query: { all: '', filters: [{ column: 1, mode: 'contains', text: 'sample text 999' }, { column: 1, mode: 'nonempty' }], sortColumn: 0, sortDirection: 'desc' } } });
      for (let i = 0; i < 200 && !messages.some(m => m.type === 'queryComplete'); i++) await new Promise(resolve => setTimeout(resolve, 20));
      expect(messages.find(m => m.type === 'queryComplete')).toMatchObject({ count: 500 });
      scope.onmessage!({ data: { type: 'queryRows', start: 0, end: 25, requestId: 1, queryId: 1 } });
      for (let i = 0; i < 200 && !messages.some(m => m.type === 'rows'); i++) await new Promise(resolve => setTimeout(resolve, 20));
      const page = messages.find(m => m.type === 'rows');
      expect(page?.rows).toHaveLength(25);
      expect((page?.rows as string[][])[0]).toEqual(['499999', 'sample text 999']);
    } finally {
      delete (globalThis as { self?: unknown }).self;
    }
  }, 30000);

  it('filters and sorts the whole file while returning only the requested page', async () => {
    const messages: Array<Record<string, unknown>> = [];
    const scope = { postMessage: (message: Record<string, unknown>) => messages.push(message), onmessage: null as null | ((event: { data: unknown }) => void) };
    Object.defineProperty(globalThis, 'self', { value: scope, configurable: true });
    const waitFor = async (type: string, id?: number) => {
      for (let i = 0; i < 100; i++) {
        const found = messages.find(m => m.type === type && (id === undefined || m.queryId === id));
        if (found) return found;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error(`Timed out waiting for ${type}`);
    };
    try {
      jest.isolateModules(() => { require('../Components/Functions/CsvViewer/csv.worker'); });
      const csv = 'name,note\nZoe,needle\nAmy,\nBob,"needle, quoted"\nCam,   \nDan,needle';
      scope.onmessage!({ data: { type: 'open', file: new File([csv], 'filters.csv') } });
      await waitFor('complete');
      scope.onmessage!({ data: { type: 'query', queryId: 1, query: { all: 'needle', filters: [{ column: 1, mode: 'nonempty' }], sortColumn: 0, sortDirection: 'desc' } } });
      expect(await waitFor('queryComplete', 1)).toMatchObject({ count: 3 });
      scope.onmessage!({ data: { type: 'queryRows', start: 0, end: 3, requestId: 7, queryId: 1 } });
      const firstPage = await waitFor('rows', 1);
      expect(firstPage).toMatchObject({ rowNumbers: [1, 5, 3], rows: [['Zoe', 'needle'], ['Dan', 'needle'], ['Bob', 'needle, quoted']] });
      scope.onmessage!({ data: { type: 'query', queryId: 2, query: { all: '', filters: [{ column: 1, mode: 'empty' }], sortColumn: -1, sortDirection: 'asc' } } });
      expect(await waitFor('queryComplete', 2)).toMatchObject({ count: 2 });
      scope.onmessage!({ data: { type: 'queryRows', start: 0, end: 2, requestId: 8, queryId: 2 } });
      expect(await waitFor('rows', 2)).toMatchObject({ rowNumbers: [2, 4], rows: [['Amy', ''], ['Cam', '   ']] });
      scope.onmessage!({ data: { type: 'query', queryId: 3, query: { all: '', filters: [{ column: 1, mode: 'contains', text: 'QUOTED' }], sortColumn: -1, sortDirection: 'asc' } } });
      expect(await waitFor('queryComplete', 3)).toMatchObject({ count: 1 });
      scope.onmessage!({ data: { type: 'query', queryId: 4, query: { all: '', filters: [{ column: 0, mode: 'selected', values: ['Amy', 'Dan'] }, { column: 1, mode: 'nonempty' }], sortColumn: -1, sortDirection: 'asc' } } });
      expect(await waitFor('queryComplete', 4)).toMatchObject({ count: 1 });
      scope.onmessage!({ data: { type: 'query', queryId: 5, query: { all: '', filters: [{ column: 0, mode: 'excluded', values: ['Amy', 'Dan'] }], sortColumn: -1, sortDirection: 'asc' } } });
      expect(await waitFor('queryComplete', 5)).toMatchObject({ count: 3 });
      scope.onmessage!({ data: { type: 'facet', facetId: 1, column: 0, search: 'a', query: { all: '', filters: [{ column: 1, mode: 'nonempty' }], sortColumn: -1, sortDirection: 'asc' } } });
      for (let i = 0; i < 100 && !messages.some(m => m.type === 'facetComplete'); i++) await new Promise(resolve => setTimeout(resolve, 10));
      expect(messages.find(m => m.type === 'facetComplete')).toMatchObject({ values: ['Dan'], hasMore: false });
    } finally {
      delete (globalThis as { self?: unknown }).self;
    }
  });

  it('indexes chunk boundaries and reads only requested rows', async () => {
    const messages: Array<Record<string, unknown>> = [];
    const scope = { postMessage: (message: Record<string, unknown>) => messages.push(message), onmessage: null as null | ((event: { data: unknown }) => void) };
    Object.defineProperty(globalThis, 'self', { value: scope, configurable: true });
    try {
      jest.isolateModules(() => { require('../Components/Functions/CsvViewer/csv.worker'); });
      const padding = 'x'.repeat(1024 * 1024 - 9);
      const csv = `\ufeff"name",value\r\n"${padding}\r\ninside",1\r\nlast "quoted" value,2`;
      scope.onmessage!({ data: { type: 'open', file: new File([csv], 'large.csv') } });
      for (let i = 0; i < 50 && !messages.some(m => m.type === 'complete'); i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(messages.find(m => m.type === 'complete')).toMatchObject({ rows: 3 });
      scope.onmessage!({ data: { type: 'rows', start: 2, end: 3, requestId: 1 } });
      for (let i = 0; i < 50 && !messages.some(m => m.type === 'rows'); i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(messages.find(m => m.type === 'rows')).toMatchObject({ start: 2, rows: [['last "quoted" value', '2']] });
    } finally {
      delete (globalThis as { self?: unknown }).self;
    }
  });

  it('reads a page from a file with thousands of rows', async () => {
    const messages: Array<Record<string, unknown>> = [];
    const scope = { postMessage: (message: Record<string, unknown>) => messages.push(message), onmessage: null as null | ((event: { data: unknown }) => void) };
    Object.defineProperty(globalThis, 'self', { value: scope, configurable: true });
    try {
      jest.isolateModules(() => { require('../Components/Functions/CsvViewer/csv.worker'); });
      const csv = 'id,value\n' + Array.from({ length: 10000 }, (_, i) => `${i},row ${i}`).join('\n');
      expect(csv.length).toBeGreaterThan(100000);
      scope.onmessage!({ data: { type: 'open', file: new File([csv], 'rows.csv') } });
      for (let i = 0; i < 50 && !messages.some(m => m.type === 'complete'); i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(messages.find(m => m.type === 'complete')).toMatchObject({ rows: 10001 });
      scope.onmessage!({ data: { type: 'rows', start: 4951, end: 5001, requestId: 2 } });
      for (let i = 0; i < 50 && !messages.some(m => m.type === 'rows'); i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      const page = messages.find(m => m.type === 'rows');
      expect(page).toMatchObject({ start: 4951, requestId: 2 });
      expect(page?.rows).toHaveLength(50);
      expect((page?.rows as string[][])[0]).toEqual(['4950', 'row 4950']);
      expect((page?.rows as string[][])[49]).toEqual(['4999', 'row 4999']);
    } finally {
      delete (globalThis as { self?: unknown }).self;
    }
  });
});
