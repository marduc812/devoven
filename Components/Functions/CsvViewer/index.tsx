'use client';

import React, { useEffect, useRef, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';

const DEFAULT_COLUMN_WIDTH = 220;
const MIN_COLUMN_WIDTH = 100;
const PAGE_SIZES = [25, 50, 100];

type WorkerReply =
  | { type: 'progress'; rows: number; bytes: number; size: number }
  | { type: 'complete'; rows: number }
  | { type: 'rows'; start: number; rows: string[][]; rowNumbers: number[]; requestId: number; queryId?: number }
  | { type: 'queryProgress'; queryId: number; scanned: number; total: number }
  | { type: 'queryComplete'; queryId: number; count: number }
  | { type: 'error'; message: string };

type LoadedPage = { start: number; rows: string[][]; rowNumbers: number[]; queryId?: number };
type SelectedCell = { row: number; column: string; value: string };

export default function CsvViewer() {
  const worker = useRef<Worker | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const queryId = useRef(0);
  const resizing = useRef<{ index: number; x: number; width: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [indexedRecords, setIndexedRecords] = useState(0);
  const [available, setAvailable] = useState(0);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [pageDraft, setPageDraft] = useState('1');
  const [loadedPage, setLoadedPage] = useState<LoadedPage | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [wholeSearch, setWholeSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState(0);
  const [columnSearch, setColumnSearch] = useState('');
  const [emptyFilter, setEmptyFilter] = useState<'any' | 'empty' | 'nonempty'>('any');
  const [sortColumn, setSortColumn] = useState(-1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [queryCount, setQueryCount] = useState<number | null>(null);
  const [queryProgress, setQueryProgress] = useState(0);

  useEffect(() => {
    const instance = new Worker(new URL('./csv.worker.ts', import.meta.url));
    worker.current = instance;
    instance.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.type === 'error') setError(reply.message);
      if (reply.type === 'progress' || reply.type === 'complete') {
        setIndexedRecords(reply.rows);
        setAvailable(Math.max(0, reply.rows - 1));
        setProgress(reply.type === 'complete' ? 100 : reply.size ? Math.round(reply.bytes / reply.size * 100) : 100);
        if (reply.type === 'complete') setDone(true);
      }
      if (reply.type === 'rows') {
        if (reply.start === 0 && reply.requestId === 0) setHeaders(reply.rows[0] ?? []);
        else if (reply.requestId === requestId.current && (reply.queryId === undefined || reply.queryId === queryId.current)) setLoadedPage({ start: reply.queryId === undefined ? reply.start - 1 : reply.start, rows: reply.rows, rowNumbers: reply.rowNumbers, queryId: reply.queryId });
      }
      if (reply.type === 'queryProgress' && reply.queryId === queryId.current) setQueryProgress(reply.total ? Math.round(reply.scanned / reply.total * 100) : 100);
      if (reply.type === 'queryComplete' && reply.queryId === queryId.current) { setQueryCount(reply.count); setQueryProgress(100); }
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

  const hasQuery = wholeSearch.trim() !== '' || columnSearch.trim() !== '' || emptyFilter !== 'any' || sortColumn >= 0;
  useEffect(() => {
    const id = ++queryId.current;
    requestId.current++;
    setQueryCount(null);
    setQueryProgress(0);
    setLoadedPage(null);
    setPage(0);
    setPageDraft('1');
    setSelectedCell(null);
    if (scroller.current) scroller.current.scrollTop = 0;
    if (!file || !done || !hasQuery) return;
    const timer = setTimeout(() => worker.current?.postMessage({
      type: 'query', queryId: id,
      query: { all: wholeSearch.trim(), column: filterColumn, contains: columnSearch.trim(), empty: emptyFilter, sortColumn, sortDirection },
    }), 300);
    return () => clearTimeout(timer);
  }, [file, done, hasQuery, wholeSearch, filterColumn, columnSearch, emptyFilter, sortColumn, sortDirection]);

  const total = hasQuery ? queryCount ?? 0 : available;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = page * pageSize;
  const end = Math.min(first + pageSize, total);

  useEffect(() => {
    if (!file || end <= first || (hasQuery && queryCount === null)) return;
    const id = ++requestId.current;
    worker.current?.postMessage(hasQuery
      ? { type: 'queryRows', start: first, end, requestId: id, queryId: queryId.current }
      : { type: 'rows', start: first + 1, end: end + 1, requestId: id });
  }, [file, first, end, hasQuery, queryCount]);

  const rows = loadedPage?.start === first && (hasQuery ? loadedPage.queryId === queryId.current : loadedPage.queryId === undefined) ? loadedPage.rows.slice(0, end - first) : [];
  const columnCount = Math.max(headers.length, ...rows.map(row => row.length), 1);
  const widths = Array.from({ length: columnCount }, (_, index) => columnWidths[index] ?? DEFAULT_COLUMN_WIDTH);
  const tableWidth = widths.reduce((sum, width) => sum + width, 64);

  function changePage(next: number) {
    const target = Math.max(0, Math.min(next, pageCount - 1));
    setPage(target);
    setPageDraft(String(target + 1));
    setLoadedPage(null);
    setSelectedCell(null);
    if (scroller.current) scroller.current.scrollTop = 0;
  }

  function openFile(next: File | undefined) {
    if (!next) return;
    requestId.current++;
    queryId.current++;
    setFile(next);
    setHeaders([]);
    setIndexedRecords(0);
    setAvailable(0);
    setDone(false);
    setProgress(0);
    setPage(0);
    setPageDraft('1');
    setLoadedPage(null);
    setColumnWidths({});
    setSelectedCell(null);
    setError('');
    setWholeSearch('');
    setColumnSearch('');
    setFilterColumn(0);
    setEmptyFilter('any');
    setSortColumn(-1);
    setSortDirection('asc');
    setQueryCount(null);
    if (scroller.current) { scroller.current.scrollTop = 0; scroller.current.scrollLeft = 0; }
  }

  function resizeMove(event: React.PointerEvent<HTMLSpanElement>) {
    const current = resizing.current;
    if (!current) return;
    const width = Math.max(MIN_COLUMN_WIDTH, current.width + event.clientX - current.x);
    setColumnWidths(previous => ({ ...previous, [current.index]: width }));
  }

  function pageControls(position: 'top' | 'bottom') {
    return <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
      <button type="button" disabled={page === 0} onClick={() => changePage(0)} className="border border-gray-300 px-2 py-1.5 disabled:opacity-40">First</button>
      <button type="button" disabled={page === 0} onClick={() => changePage(page - 1)} className="border border-gray-300 px-2 py-1.5 disabled:opacity-40">Previous</button>
      <form onSubmit={event => { event.preventDefault(); const value = Number(pageDraft); if (Number.isFinite(value)) changePage(value - 1); }} className="flex items-center gap-1">
        <label htmlFor={`csv-page-${position}`}>Page</label>
        <input id={`csv-page-${position}`} type="number" min="1" max={pageCount} value={pageDraft} onChange={event => setPageDraft(event.target.value)} className="w-20 border border-gray-300 px-2 py-1.5 text-center" />
        <span>of {pageCount.toLocaleString()}</span>
        <button type="submit" className="border border-gray-300 px-2 py-1.5">Go</button>
      </form>
      <button type="button" disabled={page >= pageCount - 1} onClick={() => changePage(page + 1)} className="border border-gray-300 px-2 py-1.5 disabled:opacity-40">Next</button>
      <button type="button" disabled={page >= pageCount - 1} onClick={() => changePage(pageCount - 1)} className="border border-gray-300 px-2 py-1.5 disabled:opacity-40">Last</button>
      <label className="ml-auto flex items-center gap-2">Rows per page
        <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); changePage(0); }} className="border border-gray-300 bg-white px-2 py-1.5">
          {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
    </div>;
  }

  return <Panel
    title="CSV Viewer"
    backColor="cyan"
    description="Open a CSV file as a table. Large files are indexed in chunks, and only one page of rows is loaded at a time. Your file stays on your device."
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
        <div className="grid gap-3 border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Search entire file
            <input type="search" value={wholeSearch} onChange={event => setWholeSearch(event.target.value)} disabled={!done} placeholder="Text in any column" className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Filter column
            <select value={filterColumn} onChange={event => setFilterColumn(Number(event.target.value))} disabled={!done} className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900">
              {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Column contains
            <input type="search" value={columnSearch} onChange={event => setColumnSearch(event.target.value)} disabled={!done} placeholder="Text in selected column" className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Selected column cells
            <select value={emptyFilter} onChange={event => setEmptyFilter(event.target.value as 'any' | 'empty' | 'nonempty')} disabled={!done} className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900">
              <option value="any">All rows</option><option value="nonempty">Not empty</option><option value="empty">Empty</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Sort by
            <select value={sortColumn} onChange={event => setSortColumn(Number(event.target.value))} disabled={!done} className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900">
              <option value={-1}>File order</option>{headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">Sort direction
            <select value={sortDirection} onChange={event => setSortDirection(event.target.value as 'asc' | 'desc')} disabled={!done || sortColumn < 0} className="w-full border border-gray-300 bg-white px-2 py-2 font-normal text-gray-900">
              <option value="asc">Ascending</option><option value="desc">Descending</option>
            </select>
          </label>
          <div className="flex items-end"><button type="button" disabled={!hasQuery} onClick={() => { setWholeSearch(''); setColumnSearch(''); setEmptyFilter('any'); setSortColumn(-1); setSortDirection('asc'); }} className="border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-40">Clear search, filters, and sort</button></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span>{!done ? `Indexing file: ${progress}% · ${available.toLocaleString()} data rows found` : hasQuery ? queryCount === null ? `Searching file: ${queryProgress}%` : `${queryCount.toLocaleString()} matching rows of ${available.toLocaleString()}` : `${available.toLocaleString()} data rows`}</span>
          <span>{total && (!hasQuery || queryCount !== null) ? `Rows ${Math.min(first + 1, total).toLocaleString()} to ${end.toLocaleString()}` : hasQuery && queryCount === 0 ? 'No matching rows' : 'Reading rows'}</span>
        </div>
        {!done && <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1 bg-gray-100"><div className="h-1 bg-indigo-500" style={{ width: `${progress}%` }} /></div>}
        {pageControls('top')}
        <div ref={scroller} className="max-h-[600px] overflow-auto border border-gray-200">
          <table className="table-fixed border-collapse text-left text-sm" style={{ width: tableWidth }}>
            <colgroup><col style={{ width: 64 }} />{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold uppercase tracking-wide text-gray-700">
              <tr><th scope="col" className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-100 px-3 py-2">#</th>{widths.map((_, index) => <th scope="col" key={index} className="relative border-b border-r border-gray-200 px-3 py-2">
                <span title={headers[index] || `Column ${index + 1}`} className="block overflow-hidden text-ellipsis whitespace-nowrap pr-3">{headers[index] || `Column ${index + 1}`}</span>
                <span role="separator" aria-label={`Resize ${headers[index] || `column ${index + 1}`}`} aria-orientation="vertical" onPointerDown={event => { event.preventDefault(); resizing.current = { index, x: event.clientX, width: widths[index] }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={resizeMove} onPointerUp={event => { resizing.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { resizing.current = null; }} className="absolute inset-y-0 right-0 w-3 cursor-col-resize touch-none border-r-2 border-transparent hover:border-indigo-500" />
              </th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => <tr key={first + index} className="even:bg-gray-50">
                <th scope="row" className="sticky left-0 border-b border-r border-gray-200 bg-inherit px-3 py-2 align-top font-mono text-xs font-normal text-gray-500">{(loadedPage?.rowNumbers[index] ?? first + index + 1).toLocaleString()}</th>
                {widths.map((_, column) => <td key={column} className="border-b border-r border-gray-200 p-0 align-top font-mono text-xs text-gray-800">
                  <button type="button" onClick={() => setSelectedCell({ row: loadedPage?.rowNumbers[index] ?? first + index + 1, column: headers[column] || `Column ${column + 1}`, value: row[column] ?? '' })} className="block max-h-48 w-full overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-left hover:bg-indigo-50 focus:bg-indigo-50">{row[column] ?? ''}</button>
                </td>)}
              </tr>)}
            </tbody>
          </table>
          {total > 0 && rows.length === 0 && <p className="p-4 text-sm text-gray-500">Loading page...</p>}
          {hasQuery && queryCount === 0 && <p className="p-4 text-sm text-gray-500">No rows match these filters.</p>}
        </div>
        {selectedCell && <div className="border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-600"><span>Row {selectedCell.row.toLocaleString()} · {selectedCell.column}</span><button type="button" onClick={() => setSelectedCell(null)} className="font-bold">Close</button></div>
          <textarea readOnly value={selectedCell.value} aria-label="Full cell value" className="h-48 w-full resize-y border border-gray-300 bg-white p-3 font-mono text-xs text-gray-900" />
        </div>}
        {pageControls('bottom')}
      </>}
    </div>}
  />;
}
