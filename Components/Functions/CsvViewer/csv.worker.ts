import { parseCsvRecord } from './parse';

type Query = {
  all: string;
  column: number;
  contains: string;
  empty: 'any' | 'empty' | 'nonempty';
  sortColumn: number;
  sortDirection: 'asc' | 'desc';
};
type Input =
  | { type: 'open'; file: File }
  | { type: 'rows'; start: number; end: number; requestId: number }
  | { type: 'query'; query: Query; queryId: number }
  | { type: 'queryRows'; start: number; end: number; requestId: number; queryId: number };

const CHUNK_SIZE = 1024 * 1024;
let file: File | null = null;
let starts: number[] = [0];
let complete = false;
let generation = 0;
let activeQueryId = 0;
let matchedRows: number[] = [];
const decoder = new TextDecoder('utf-8');

function parseRecord(view: Uint8Array, from: number, to: number, row: number): string[] {
  while (to > from && (view[to - 1] === 10 || view[to - 1] === 13)) to--;
  let record = decoder.decode(view.subarray(from, to));
  if (row === 0 && record.charCodeAt(0) === 0xfeff) record = record.slice(1);
  return parseCsvRecord(record);
}

async function readRows(start: number, end: number, requestId: number, queryId?: number) {
  if (!file || start < 0 || start >= end) return;
  const currentFile = file;
  const currentGeneration = generation;
  const indices = queryId === undefined ? Array.from({ length: end - start }, (_, i) => start + i) : matchedRows.slice(start, end);
  if (queryId === undefined && end > starts.length - 1) return;
  if (queryId !== undefined && (queryId !== activeQueryId || end > matchedRows.length)) return;
  const records: string[][] = [];
  for (let i = 0; i < indices.length;) {
    let lowest = indices[i];
    let highest = indices[i];
    let last = i + 1;
    while (last < indices.length) {
      const nextLowest = Math.min(lowest, indices[last]);
      const nextHighest = Math.max(highest, indices[last]);
      if (starts[nextHighest + 1] - starts[nextLowest] > CHUNK_SIZE) break;
      lowest = nextLowest;
      highest = nextHighest;
      last++;
    }
    const bytes = new Uint8Array(await currentFile.slice(starts[lowest], starts[highest + 1]).arrayBuffer());
    if (currentGeneration !== generation || (queryId !== undefined && queryId !== activeQueryId)) return;
    for (let j = i; j < last; j++) {
      const row = indices[j];
      records.push(parseRecord(bytes, starts[row] - starts[lowest], starts[row + 1] - starts[lowest], row));
    }
    i = last;
  }
  self.postMessage({ type: 'rows', start, rows: records, rowNumbers: indices, requestId, queryId });
}

async function runQuery(query: Query, queryId: number) {
  if (!file || !complete) return;
  const currentFile = file;
  const currentGeneration = generation;
  const matches: number[] = [];
  const sortKeys: string[] = [];
  const all = query.all.toLocaleLowerCase();
  const contains = query.contains.toLocaleLowerCase();
  const recordCount = starts.length - 1;
  try {
    for (let row = 1; row < recordCount;) {
      const first = row;
      while (row < recordCount && starts[row + 1] - starts[first] <= CHUNK_SIZE) row++;
      if (row === first) row++;
      const bytes = new Uint8Array(await currentFile.slice(starts[first], starts[row]).arrayBuffer());
      if (currentGeneration !== generation || queryId !== activeQueryId) return;
      for (let index = first; index < row; index++) {
        const cells = parseRecord(bytes, starts[index] - starts[first], starts[index + 1] - starts[first], index);
        const value = cells[query.column] ?? '';
        if (all && !cells.some(cell => cell.toLocaleLowerCase().includes(all))) continue;
        if (contains && !value.toLocaleLowerCase().includes(contains)) continue;
        if (query.empty === 'empty' && value.trim() !== '') continue;
        if (query.empty === 'nonempty' && value.trim() === '') continue;
        matches.push(index);
        if (query.sortColumn >= 0) sortKeys[index] = cells[query.sortColumn] ?? '';
      }
      self.postMessage({ type: 'queryProgress', queryId, scanned: row - 1, total: recordCount - 1 });
    }
    if (query.sortColumn >= 0) {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      const direction = query.sortDirection === 'asc' ? 1 : -1;
      matches.sort((a, b) => direction * collator.compare(sortKeys[a], sortKeys[b]) || a - b);
    }
    if (currentGeneration !== generation || queryId !== activeQueryId) return;
    matchedRows = matches;
    self.postMessage({ type: 'queryComplete', queryId, count: matches.length });
  } catch (error) {
    if (currentGeneration === generation && queryId === activeQueryId) self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Could not search the CSV file.' });
  }
}

async function indexFile(input: File, currentGeneration: number) {
  let quoted = false;
  let atFieldStart = true;
  let justClosedQuote = false;
  let pendingCr = false;
  let next = 0;
  try {
    for (let offset = 0; offset < input.size; offset += CHUNK_SIZE) {
      const bytes = new Uint8Array(await input.slice(offset, offset + CHUNK_SIZE).arrayBuffer());
      if (currentGeneration !== generation) return;
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        const position = offset + i;
        if (position < 3 && input.size >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) continue;
        if (pendingCr) {
          pendingCr = false;
          starts.push(byte === 10 ? position + 1 : position);
          atFieldStart = true;
          justClosedQuote = false;
          if (byte === 10) continue;
        }
        if (byte === 34) {
          if (quoted) {
            quoted = false;
            justClosedQuote = true;
          } else if (atFieldStart || justClosedQuote) {
            quoted = true;
            justClosedQuote = false;
          }
          atFieldStart = false;
        } else if (!quoted && byte === 13) {
          pendingCr = true;
          justClosedQuote = false;
        } else if (!quoted && byte === 10) {
          starts.push(position + 1);
          atFieldStart = true;
          justClosedQuote = false;
        } else if (!quoted && byte === 44) {
          atFieldStart = true;
          justClosedQuote = false;
        } else {
          atFieldStart = false;
          justClosedQuote = false;
        }
      }
      if (starts.length - 1 > next || offset + bytes.length === input.size) {
        next = starts.length - 1;
        self.postMessage({ type: 'progress', rows: next, bytes: offset + bytes.length, size: input.size });
      }
    }
    if (pendingCr) starts.push(input.size);
    if (quoted) throw new Error('The CSV has an unclosed quoted field.');
    if (starts[starts.length - 1] !== input.size) starts.push(input.size);
    if (input.size === 0) starts = [0];
    complete = true;
    self.postMessage({ type: 'complete', rows: Math.max(0, starts.length - 1) });
  } catch (error) {
    if (currentGeneration === generation) self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Could not read the CSV file.' });
  }
}

self.onmessage = (event: MessageEvent<Input>) => {
  const message = event.data;
  if (message.type === 'open') {
    generation++;
    activeQueryId++;
    file = message.file;
    starts = [0];
    matchedRows = [];
    complete = false;
    void indexFile(file, generation);
  } else if (message.type === 'query') {
    activeQueryId = message.queryId;
    matchedRows = [];
    void runQuery(message.query, message.queryId);
  } else if (message.type === 'queryRows') {
    void readRows(message.start, message.end, message.requestId, message.queryId);
  } else if (message.type === 'rows' && (complete || message.end <= starts.length - 1)) {
    void readRows(message.start, message.end, message.requestId);
  }
};
