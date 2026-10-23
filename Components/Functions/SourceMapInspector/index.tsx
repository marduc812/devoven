'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import type { FindingKind, Inspection } from './logic';

const kinds: FindingKind[] = ['Secret', 'URL', 'Path'];

export function SourceMapInspector() {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<FindingKind | 'All'>('All');
  const [showDependencies, setShowDependencies] = useState(false);
  const [shown, setShown] = useState(200);
  const [result, setResult] = useState<{ inspection: Inspection | null; error: string } | null>(null);
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const jobId = useRef(0);

  useEffect(() => {
    if (!file && !input.trim()) return;
    const id = jobId.current;
    let worker: Worker | null = null;
    const timer = window.setTimeout(() => {
      try {
        worker = new Worker(new URL('./inspector.worker.ts', import.meta.url));
        worker.onmessage = (event: MessageEvent<{ inspection: Inspection | null; error: string }>) => {
          if (id !== jobId.current) return;
          setResult(event.data);
          setWorking(false);
          worker?.terminate();
        };
        worker.onerror = () => {
          if (id !== jobId.current) return;
          setResult({ inspection: null, error: 'Could not start the source map inspector.' });
          setWorking(false);
          worker?.terminate();
        };
        worker.postMessage(file ? { file } : { text: input });
      } catch {
        if (id === jobId.current) {
          setResult({ inspection: null, error: 'Could not start the source map inspector.' });
          setWorking(false);
        }
      }
    }, file ? 0 : 150);
    return () => {
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [file, input]);

  const changeText = (text: string) => {
    jobId.current += 1;
    setShown(200);
    setFile(null);
    setInput(text);
    setResult(null);
    setWorking(Boolean(text.trim()));
  };

  const changeFile = (nextFile: File) => {
    jobId.current += 1;
    setShown(200);
    setFile(nextFile);
    setInput('');
    setResult(null);
    setWorking(true);
  };

  const dropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) changeFile(dropped);
  };

  const allFindings = result?.inspection?.findings ?? [];
  const findings = allFindings.filter((finding) => showDependencies || !finding.dependency || finding.kind === 'Secret');
  const visible = filter === 'All' ? findings : findings.filter((finding) => finding.kind === filter);

  return (
    <Panel
      backColor="lime"
      title="Source Map Inspector"
      description="Paste a JavaScript source map to find source paths, URLs, and possible secrets. Pattern matching runs in your browser. Results need manual review."
      extraElements={
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="source-map-input" className="text-xs font-bold uppercase tracking-widest text-gray-600">Source map JSON</label>
              <input ref={fileInput} type="file" accept=".map,.json,application/json,text/plain" className="hidden"
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  event.target.value = '';
                  if (chosen) changeFile(chosen);
                }} />
              <button type="button" onClick={() => fileInput.current?.click()}
                className="border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-900">Select .map file</button>
            </div>
            {file && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <span className="break-all font-mono">{file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                <button type="button" onClick={() => changeText('')} className="text-xs font-semibold underline">Remove file</button>
              </div>
            )}
            <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)} onDrop={dropFile}
              className={dragging ? 'outline outline-2 outline-gray-900' : ''}>
              <textarea
                id="source-map-input"
                className="w-full resize-y border border-gray-300 bg-white p-3 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                rows={10}
                value={input}
                onChange={(event) => changeText(event.target.value)}
                placeholder={file ? 'Type or paste here to replace the selected file' : 'Paste a source map with "sources" and "sourcesContent" here, or drop a .map file'}
                spellCheck={false}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">The map stays in this tab. The tool does not fetch URLs or test credentials.</p>
          </div>

          {working && <p role="status" className="flex items-center gap-2 text-sm text-gray-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" aria-hidden="true" />Inspecting source map. Large files may take a moment.</p>}

          {result?.error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}

          {result?.inspection && (
            <section aria-label="Inspection results" className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-gray-200 pb-3">
                <h2 className="text-lg font-bold text-gray-900">{findings.length} findings</h2>
                <span className="text-sm text-gray-500">{result.inspection.applicationSources.length} application sources, {result.inspection.dependencySourceCount} dependencies, {result.inspection.contentCount} with embedded content</span>
              </div>
              <p className="text-xs text-gray-500">Source file names are listed below, not counted as findings. Dependency paths and URLs are hidden by default; possible secrets remain visible.</p>
              {allFindings.some((finding) => finding.dependency && finding.kind !== 'Secret') && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={showDependencies} onChange={(event) => { setShowDependencies(event.target.checked); setShown(200); }} />
                  Include dependency paths and URLs
                </label>
              )}
              {result.inspection.contentCount < result.inspection.sourceCount && (
                <p className="text-sm text-amber-800">Some sources have no embedded content, so their code could not be checked.</p>
              )}
              {result.inspection.applicationSources.length > 0 && (
                <details className="border border-gray-200 p-3 text-sm text-gray-700">
                  <summary className="cursor-pointer font-semibold">Application source files ({result.inspection.applicationSources.length})</summary>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-xs">
                    {result.inspection.applicationSources.map((source, index) => <li key={`${source}-${index}`} className="break-all">{source}</li>)}
                  </ul>
                </details>
              )}
              {findings.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Filter findings">
                  {(['All', ...kinds] as const).map((kind) => (
                    <button key={kind} type="button" onClick={() => { setFilter(kind); setShown(200); }}
                      aria-pressed={filter === kind}
                      className={`border px-3 py-1 text-xs font-semibold ${filter === kind ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'}`}>
                      {kind} ({kind === 'All' ? findings.length : findings.filter((finding) => finding.kind === kind).length})
                    </button>
                  ))}
                </div>
              )}
              {findings.length === 0 ? (
                <p className="text-sm text-gray-600">No matching paths, URLs, or secrets found.</p>
              ) : (
                <div className="max-h-[36rem] overflow-auto border border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {visible.slice(0, shown).map((finding, index) => (
                      <li key={`${finding.kind}-${finding.source}-${finding.line}-${finding.value}-${index}`} className="p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`border px-1.5 py-0.5 font-bold ${finding.kind === 'Secret' ? 'border-red-200 bg-red-50 text-red-700' : finding.kind === 'URL' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>{finding.kind}</span>
                          <span className="text-gray-600">{finding.label}</span>
                          <span className="break-all font-mono text-gray-500">{finding.source}{finding.line !== null ? `:${finding.line}` : ''}</span>
                        </div>
                        <code className="mt-2 block break-all text-sm text-gray-900">{finding.value}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {visible.length > shown && (
                <button type="button" onClick={() => setShown(shown + 200)}
                  className="border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-gray-900">
                  Show 200 more of {visible.length} findings
                </button>
              )}
            </section>
          )}
        </div>
      }
    />
  );
}
