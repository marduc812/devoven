'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { DEFAULT_CSV_OPTIONS } from './parse';
import type { ColumnFilter, CsvOptions } from './types';

const DEFAULT_COLUMN_WIDTH = 220;
const MIN_COLUMN_WIDTH = 100;
const PAGE_SIZES = [25, 50, 100];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type WorkerReply =
  | { type: 'progress'; rows: number; bytes: number; size: number }
  | { type: 'complete'; rows: number }
  | { type: 'rows'; start: number; rows: string[][]; rowNumbers: number[]; requestId: number; queryId?: number }
  | { type: 'queryProgress'; queryId: number; scanned: number; total: number }
  | { type: 'queryComplete'; queryId: number; count: number }
  | { type: 'facetComplete'; facetId: number; values: string[]; hasMore: boolean }
  | { type: 'error'; message: string };

type LoadedPage = { start: number; rows: string[][]; rowNumbers: number[]; queryId?: number };
type SelectedCell = { row: number; column: string; value: string };
type FilterDraft = { kind: 'all' | 'empty' | 'nonempty' | 'contains' | 'values'; text: string; values: string[]; excluded: boolean };

function draftFromFilter(filter?: ColumnFilter): FilterDraft {
  if (!filter) return { kind: 'all', text: '', values: [], excluded: true };
  if (filter.mode === 'contains') return { kind: 'contains', text: filter.text, values: [], excluded: true };
  if (filter.mode === 'selected' || filter.mode === 'excluded') return { kind: 'values', text: '', values: filter.values, excluded: filter.mode === 'excluded' };
  return { kind: filter.mode, text: '', values: [], excluded: true };
}

export default function CsvViewer() {
  const worker = useRef<Worker | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const queryId = useRef(0);
  const facetId = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const resizing = useRef<{ index: number; x: number; width: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState<CsvOptions['separator']>(DEFAULT_CSV_OPTIONS.separator);
  const [quotedFields, setQuotedFields] = useState(DEFAULT_CSV_OPTIONS.quotedFields);
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
  const [filters, setFilters] = useState<Record<number, ColumnFilter>>({});
  const [sortColumn, setSortColumn] = useState(-1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [queryCount, setQueryCount] = useState<number | null>(null);
  const [queryProgress, setQueryProgress] = useState(0);
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromFilter());
  const [facetSearch, setFacetSearch] = useState('');
  const [facetValues, setFacetValues] = useState<string[]>([]);
  const [facetHasMore, setFacetHasMore] = useState(false);
  const [facetLoading, setFacetLoading] = useState(false);

  useEffect(() => {
    resetPreview();
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
      if (reply.type === 'facetComplete' && reply.facetId === facetId.current) { setFacetValues(reply.values); setFacetHasMore(reply.hasMore); setFacetLoading(false); }
    };
    instance.onerror = () => setError('Could not load the CSV reader.');
    if (file) instance.postMessage({ type: 'open', file, options: { separator, quotedFields } });
    return () => { instance.terminate(); worker.current = null; };
  }, [file, separator, quotedFields]);

  useEffect(() => {
    if (file && indexedRecords > 0 && headers.length === 0) {
      worker.current?.postMessage({ type: 'rows', start: 0, end: 1, requestId: 0 });
    }
  }, [file, indexedRecords, headers.length]);

  const hasQuery = wholeSearch.trim() !== '' || Object.keys(filters).length > 0 || sortColumn >= 0;
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
      query: { all: wholeSearch.trim(), filters: Object.values(filters), sortColumn, sortDirection },
    }), 300);
    return () => clearTimeout(timer);
  }, [file, done, hasQuery, wholeSearch, filters, sortColumn, sortDirection]);

  useEffect(() => {
    if (openColumn === null || !done) return;
    const id = ++facetId.current;
    setFacetLoading(true);
    setFacetValues([]);
    const timer = setTimeout(() => worker.current?.postMessage({
      type: 'facet', facetId: id, column: openColumn, search: facetSearch,
      query: { all: wholeSearch.trim(), filters: Object.values(filters), sortColumn, sortDirection },
    }), 250);
    return () => clearTimeout(timer);
  }, [openColumn, facetSearch, done, filters, wholeSearch, sortColumn, sortDirection]);

  useEffect(() => {
    if (openColumn === null) return;
    function closeOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenColumn(null);
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenColumn(null);
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [openColumn]);

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
    setFile(next);
  }

  function resetPreview() {
    requestId.current++;
    queryId.current++;
    facetId.current++;
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
    setFilters({});
    setOpenColumn(null);
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

  function openFilterMenu(index: number, button: HTMLButtonElement) {
    if (openColumn === index) { setOpenColumn(null); return; }
    const rect = button.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: rect.bottom + 4 <= window.innerHeight - 220 ? rect.bottom + 4 : Math.max(8, rect.top - 440),
    });
    setDraft(draftFromFilter(filters[index]));
    setFacetSearch('');
    setFacetValues([]);
    setOpenColumn(index);
  }

  function applyFilter() {
    if (openColumn === null) return;
    const column = openColumn;
    setFilters(previous => {
      const next = { ...previous };
      if (draft.kind === 'all' || (draft.kind === 'contains' && !draft.text.trim()) || (draft.kind === 'values' && draft.excluded && draft.values.length === 0)) delete next[column];
      else if (draft.kind === 'contains') next[column] = { column, mode: 'contains', text: draft.text.trim() };
      else if (draft.kind === 'values') next[column] = { column, mode: draft.excluded ? 'excluded' : 'selected', values: draft.values };
      else next[column] = { column, mode: draft.kind };
      return next;
    });
    setOpenColumn(null);
  }

  function toggleValue(value: string) {
    setDraft(previous => {
      const values = previous.values.includes(value) ? previous.values.filter(item => item !== value) : [...previous.values, value];
      return { ...previous, kind: 'values', values };
    });
  }

  function filterMenu() {
    if (openColumn === null) return null;
    const name = headers[openColumn] || `Column ${openColumn + 1}`;
    return createPortal(<div ref={menuRef} role="dialog" aria-label={`Filter ${name}`} style={{ left: menuPosition.left, top: menuPosition.top, width: Math.min(320, typeof window === 'undefined' ? 320 : window.innerWidth - 16), maxHeight: `min(440px, calc(100vh - ${menuPosition.top + 8}px))` }} className="fixed z-50 overflow-y-auto border border-gray-300 bg-white p-3 text-sm font-normal normal-case tracking-normal text-gray-900 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2"><strong className="min-w-0 truncate">{name}</strong><button type="button" onClick={() => setOpenColumn(null)} aria-label="Close filter menu" className="px-1 text-lg leading-none">×</button></div>
      <div className="grid grid-cols-2 gap-1 border-b border-gray-200 pb-3">
        <button type="button" onClick={() => { setSortColumn(openColumn); setSortDirection('asc'); setOpenColumn(null); }} className="border border-gray-300 px-2 py-1.5 text-left hover:bg-gray-100">Sort A to Z</button>
        <button type="button" onClick={() => { setSortColumn(openColumn); setSortDirection('desc'); setOpenColumn(null); }} className="border border-gray-300 px-2 py-1.5 text-left hover:bg-gray-100">Sort Z to A</button>
        {sortColumn === openColumn && <button type="button" onClick={() => { setSortColumn(-1); setOpenColumn(null); }} className="col-span-2 text-left text-xs text-gray-600 underline">Restore file order</button>}
      </div>
      <fieldset className="space-y-1 py-3">
        <legend className="mb-1 text-xs font-semibold text-gray-600">Show rows where this column is</legend>
        {([['all', 'Any value'], ['nonempty', 'Not empty'], ['empty', 'Empty'], ['contains', 'Text contains'], ['values', 'Selected values']] as const).map(([kind, label]) => <label key={kind} className="flex cursor-pointer items-center gap-2 py-0.5"><input type="radio" name="csv-filter-kind" checked={draft.kind === kind} onChange={() => setDraft(previous => ({ ...previous, kind }))} />{label}</label>)}
      </fieldset>
      {draft.kind === 'contains' && <input autoFocus type="search" aria-label={`Text to find in ${name}`} value={draft.text} onChange={event => setDraft(previous => ({ ...previous, text: event.target.value }))} placeholder="Type text" className="mb-3 w-full border border-gray-300 px-2 py-1.5" />}
      {draft.kind === 'values' && <div className="border-t border-gray-200 pt-3">
        <input type="search" aria-label={`Find values in ${name}`} value={facetSearch} onChange={event => setFacetSearch(event.target.value)} placeholder="Search values in this column" className="mb-2 w-full border border-gray-300 px-2 py-1.5" />
        <div className="mb-2 flex gap-3 text-xs"><button type="button" onClick={() => setDraft(previous => ({ ...previous, excluded: true, values: [] }))} className="underline">Select all</button><button type="button" onClick={() => setDraft(previous => ({ ...previous, excluded: false, values: [] }))} className="underline">Select none</button></div>
        <p className="mb-1 truncate text-xs text-gray-600" title={draft.values.join(', ')}>{draft.values.length ? `${draft.values.length} ${draft.excluded ? 'excluded' : 'selected'}: ${draft.values.slice(0, 3).map(value => value || '(Blank)').join(', ')}${draft.values.length > 3 ? '...' : ''}` : draft.excluded ? 'All values selected' : 'No values selected'}</p>
        <div className="max-h-36 overflow-y-auto border border-gray-200 p-1">
          {facetLoading ? <p className="p-2 text-xs text-gray-500">Finding values...</p> : facetValues.length ? facetValues.map(value => <label key={value} className="flex cursor-pointer items-start gap-2 px-1 py-1 hover:bg-gray-50"><input type="checkbox" checked={draft.excluded ? !draft.values.includes(value) : draft.values.includes(value)} onChange={() => toggleValue(value)} className="mt-0.5" /><span className="min-w-0 break-all" title={value}>{value === '' ? <em>(Blank)</em> : value}</span></label>) : <p className="p-2 text-xs text-gray-500">No values found.</p>}
        </div>
        {facetHasMore && <p className="mt-1 text-xs text-gray-500">Showing the first 100 values. Search to find others.</p>}
      </div>}
      <div className="sticky bottom-0 mt-3 flex items-center justify-between gap-2 border-t border-gray-200 bg-white pt-3"><button type="button" onClick={() => { setFilters(previous => { const next = { ...previous }; delete next[openColumn]; return next; }); setOpenColumn(null); }} className="text-xs text-gray-600 underline">Clear this filter</button><div className="flex gap-2"><button type="button" onClick={() => setOpenColumn(null)} className="border border-gray-300 px-3 py-1.5">Cancel</button><button type="button" onClick={applyFilter} className="border border-gray-900 bg-gray-900 px-3 py-1.5 text-white">Apply</button></div></div>
    </div>, document.body);
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
            <p className="mt-1 text-xs text-gray-500">{file ? formatFileSize(file.size) : 'Or choose a file from your device.'}</p>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-white hover:text-gray-900">
            {file ? 'Choose another file' : 'Choose CSV file'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        <label className="flex items-center gap-2">Separator
          <select value={separator} onChange={event => setSeparator(event.target.value as CsvOptions['separator'])} className="border border-gray-300 bg-white px-2 py-1.5">
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe (|)</option>
            <option value=":">Colon (:)</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={quotedFields} onChange={event => setQuotedFields(event.target.checked)} />
          Use double quotes as text qualifiers
        </label>
        <p className="w-full text-xs text-gray-500">When enabled, double quotes keep separators and line breaks inside a cell. Two double quotes inside a quoted field represent one quote. Changing these options reloads the preview and clears filters and sorting.</p>
      </div>

      {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {file && !error && <>
        <div className="flex flex-wrap items-end gap-3 border border-gray-200 bg-gray-50 p-3">
          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs font-medium text-gray-700">Search entire file
            <input type="search" value={wholeSearch} onChange={event => setWholeSearch(event.target.value)} disabled={!done} placeholder="Search any column" className="w-full border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900" />
          </label>
          <button type="button" disabled={!hasQuery} onClick={() => { setWholeSearch(''); setFilters({}); setSortColumn(-1); setSortDirection('asc'); }} className="border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 disabled:opacity-40">Clear all filters and sort</button>
          <p className="w-full text-xs text-gray-500">Use the menu on a column header to sort or filter its values.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span>{!done ? `Indexing file: ${progress}% · ${available.toLocaleString()} data rows found` : hasQuery ? queryCount === null ? `Searching file: ${queryProgress}%` : `${queryCount.toLocaleString()} matching rows of ${available.toLocaleString()}` : `${available.toLocaleString()} data rows`}</span>
          <span>{total && (!hasQuery || queryCount !== null) ? `Rows ${Math.min(first + 1, total).toLocaleString()} to ${end.toLocaleString()}` : hasQuery && queryCount === 0 ? 'No matching rows' : 'Reading rows'}</span>
        </div>
        {!done && <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1 bg-gray-100"><div className="h-1 bg-indigo-500" style={{ width: `${progress}%` }} /></div>}
        {pageControls('top')}
        <div ref={scroller} onScroll={() => setOpenColumn(null)} className="max-h-[600px] overflow-auto border border-gray-200">
          <table className="table-fixed border-collapse text-left text-sm" style={{ width: tableWidth }}>
            <colgroup><col style={{ width: 64 }} />{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold uppercase tracking-wide text-gray-700">
              <tr><th scope="col" className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-100 px-3 py-2">#</th>{widths.map((_, index) => <th scope="col" key={index} className="relative border-b border-r border-gray-200 px-3 py-2">
                <div className="flex items-center gap-1 pr-3"><span title={headers[index] || `Column ${index + 1}`} className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{headers[index] || `Column ${index + 1}`}</span><button type="button" disabled={!done} aria-label={`Filter ${headers[index] || `Column ${index + 1}`}`} aria-expanded={openColumn === index} onClick={event => openFilterMenu(index, event.currentTarget)} className={`shrink-0 border px-1 py-0.5 text-[10px] leading-none disabled:opacity-40 ${filters[index] || sortColumn === index ? 'border-indigo-500 bg-indigo-100 text-indigo-800' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-200'}`}>{sortColumn === index ? sortDirection === 'asc' ? '▲' : '▼' : filters[index] ? '●' : '▾'}</button></div>
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
        {filterMenu()}
      </>}
    </div>}
  />;
}
