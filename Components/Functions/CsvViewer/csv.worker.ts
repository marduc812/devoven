import { parseCsvRecord } from './parse';

type Input =
  | { type: 'open'; file: File }
  | { type: 'rows'; start: number; end: number; requestId: number };

const CHUNK_SIZE = 1024 * 1024;
let file: File | null = null;
let starts: number[] = [0];
let complete = false;
let generation = 0;
const decoder = new TextDecoder('utf-8');

async function readRows(start: number, end: number, requestId: number) {
  if (!file || start < 0 || end > starts.length - 1 || start >= end) return;
  const currentFile = file;
  const currentGeneration = generation;
  const bytes = await currentFile.slice(starts[start], starts[end]).arrayBuffer();
  if (currentGeneration !== generation) return;
  const records: string[][] = [];
  const view = new Uint8Array(bytes);
  for (let row = start; row < end; row++) {
    const from = starts[row] - starts[start];
    let to = starts[row + 1] - starts[start];
    while (to > from && (view[to - 1] === 10 || view[to - 1] === 13)) to--;
    let record = decoder.decode(view.subarray(from, to));
    if (row === 0 && record.charCodeAt(0) === 0xfeff) record = record.slice(1);
    records.push(parseCsvRecord(record));
  }
  self.postMessage({ type: 'rows', start, rows: records, requestId });
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
    file = message.file;
    starts = [0];
    complete = false;
    void indexFile(file, generation);
  } else if (message.type === 'rows' && (complete || message.end <= starts.length - 1)) {
    void readRows(message.start, message.end, message.requestId);
  }
};
