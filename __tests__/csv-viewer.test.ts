import { parseCsvRecord } from '../Components/Functions/CsvViewer/parse';

describe('CSV viewer records', () => {
  it('parses quoted commas, newlines, escaped quotes, and empty cells', () => {
    expect(parseCsvRecord('one,"two, three","line 1\nline 2","a""b",')).toEqual([
      'one', 'two, three', 'line 1\nline 2', 'a"b', '',
    ]);
  });
});

describe('CSV viewer worker', () => {
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
});
