'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';

const ROW_HEIGHT = 36;
const VIEW_HEIGHT = 560;
const OVERSCAN = 8;

type WorkerReply =
  | { type: 'progress'; rows: number; bytes: number; size: number }
  | { type: 'complete'; rows: number }
  | { type: 'rows'; start: number; rows: string[][]; requestId: number }
  | { type: 'error'; message: string };

export default function CsvViewer() {
  const worker = useRef<Worker | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [indexedRecords, setIndexedRecords] = useState(0);
  const [available, setAvailable] = useState(0);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [windowRows, setWindowRows] = useState<{ start: number; rows: string[][] }>({ start: 0, rows: [] });
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const instance = new Worker(new URL('./csv.worker.ts', import.meta.url));
    worker.current = instance;
    instance.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.type === 'error') setError(reply.message);
      if (reply.type === 'progress') {
        setIndexedRecords(reply.rows);
        setAvailable(Math.max(0, reply.rows - 1));
        setProgress(reply.size ? Math.round(reply.bytes / reply.size * 100) : 100);
      }
      if (reply.type === 'complete') {
        setIndexedRecords(reply.rows);
        setAvailable(Math.max(0, reply.rows - 1));
        setDone(true);
        setProgress(100);
      }
      if (reply.type === 'rows') {
        if (reply.start === 0 && reply.requestId === 0) setHeaders(reply.rows[0] ?? []);
        else if (reply.requestId === requestId.current) setWindowRows({ start: reply.start - 1, rows: reply.rows });
      }
    };
    instance.onerror = () => setError('Could not load the CSV reader.');
    return () => { instance.terminate(); worker.current = null; };
  }, []);

  useEffect(() => {
    if (file) worker.current?.postMessage({ type: 'open', file });
  }, [file]);

  useEffect(() => {
    if (file && indexedRecords > 0 && headers.length === 0) {
      worker.current?.postMessage({ type: 'rows', start: 0, end: 1, requestId: 0 });
    }
  }, [file, indexedRecords, headers.length]);

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(available, Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN);

  useEffect(() => {
    if (!file || end <= first) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      worker.current?.postMessage({ type: 'rows', start: first + 1, end: end + 1, requestId: id });
    }, 35);
    return () => window.clearTimeout(timer);
  }, [file, first, end]);

  const shownRows = useMemo(() => {
    if (windowRows.start !== first) return [];
    return windowRows.rows.slice(0, end - first);
  }, [windowRows, first, end]);
  const columnCount = Math.max(headers.length, ...shownRows.map(row => row.length), 1);

  function openFile(next: File | undefined) {
    if (!next) return;
    requestId.current++;
    setFile(next);
    setHeaders([]);
    setIndexedRecords(0);
    setAvailable(0);
    setDone(false);
    setProgress(0);
    setScrollTop(0);
    setWindowRows({ start: 0, rows: [] });
    setError('');
    if (scroller.current) scroller.current.scrollTop = 0;
  }

  return <Panel
    title="CSV Viewer"
    backColor="cyan"
    description="Open a CSV file as a table. Large files are read in chunks in your browser, and the table loads only the rows you are viewing. Your file stays on your device."
    extraElements={<div className="space-y-5">
      <input ref={input} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={event => openFile(event.target.files?.[0])} />
      <div
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); openFile(event.dataTransfer.files?.[0]); }}
        className={`border border-dashed p-6 ${dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{file ? file.name : 'Drop a CSV file here'}</p>
            <p className="mt-1 text-xs text-gray-500">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Or choose a file from your device.'}</p>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-white hover:text-gray-900">
            {file ? 'Choose another file' : 'Choose CSV file'}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {file && !error && <>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span>{done ? `${available.toLocaleString()} data rows` : `Indexing file: ${progress}% · ${available.toLocaleString()} data rows found`}</span>
          <span>{available ? `Showing rows ${Math.min(first + 1, available).toLocaleString()}–${Math.min(end, available).toLocaleString()}` : 'Reading rows'}</span>
        </div>
        {!done && <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1 bg-gray-100"><div className="h-1 bg-indigo-500" style={{ width: `${progress}%` }} /></div>}
        <div ref={scroller} onScroll={event => setScrollTop(event.currentTarget.scrollTop)} className="overflow-auto border border-gray-200" style={{ height: VIEW_HEIGHT }}>
          <table className="w-full border-collapse text-left text-sm" style={{ minWidth: columnCount * 180 + 64 }}>
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold uppercase tracking-wide text-gray-700">
              <tr><th scope="col" className="sticky left-0 z-20 w-16 border-b border-r border-gray-200 bg-gray-100 px-3 py-2">#</th>{Array.from({ length: columnCount }, (_, i) => <th scope="col" key={i} className="min-w-44 border-b border-r border-gray-200 px-3 py-2">{headers[i] || `Column ${i + 1}`}</th>)}</tr>
            </thead>
            <tbody>
              {first > 0 && <tr aria-hidden="true"><td colSpan={columnCount + 1} style={{ height: first * ROW_HEIGHT, padding: 0 }} /></tr>}
              {shownRows.map((row, index) => <tr key={first + index} className="h-9 even:bg-gray-50">
                <th scope="row" className="sticky left-0 w-16 border-b border-r border-gray-200 bg-inherit px-3 font-mono text-xs font-normal text-gray-500">{(first + index + 1).toLocaleString()}</th>
                {Array.from({ length: columnCount }, (_, i) => <td key={i} title={row[i] ?? ''} className="max-w-64 truncate border-b border-r border-gray-200 px-3 font-mono text-xs text-gray-800">{row[i] ?? ''}</td>)}
              </tr>)}
              {end < available && <tr aria-hidden="true"><td colSpan={columnCount + 1} style={{ height: (available - end) * ROW_HEIGHT, padding: 0 }} /></tr>}
            </tbody>
          </table>
        </div>
      </>}
    </div>}
  />;
}
