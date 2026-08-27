'use client';

import React, { useState, useRef } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { mergePdfs, countPages } from './logic';
import { downloadBlob } from '../PdfShared/pdfjs';

interface MergeFile {
  id: number;
  name: string;
  bytes: Uint8Array;
  pages: number | null;
}

let nextId = 0;

export const PdfMerge = () => {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList) => {
    setError('');
    const incoming = Array.from(list).filter(f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
    if (incoming.length === 0) {
      setError('Drop one or more PDF files.');
      return;
    }
    const loaded: MergeFile[] = [];
    for (const file of incoming) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let pages: number | null = null;
        try {
          pages = await countPages(bytes);
        } catch {
          pages = null;
        }
        loaded.push({ id: nextId++, name: file.name, bytes, pages });
      } catch {
        setError(`Could not read "${file.name}".`);
      }
    }
    setFiles(prev => [...prev, ...loaded]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const move = (index: number, delta: number) => {
    setFiles(prev => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: number) => setFiles(prev => prev.filter(f => f.id !== id));
  const clear = () => {
    setFiles([]);
    setError('');
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const out = await mergePdfs(files.map(f => ({ name: f.name, bytes: f.bytes })));
      downloadBlob(new Blob([out as BlobPart], { type: 'application/pdf' }), 'merged.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge the PDFs.');
    } finally {
      setBusy(false);
    }
  };

  const totalPages = files.reduce((sum, f) => sum + (f.pages ?? 0), 0);

  return (
    <Panel
      backColor="red"
      title="Merge PDFs"
      description="Combine multiple PDF files into a single document. Add files, drag the order with the [1↑ ↓2] buttons, and download one merged PDF. All processing happens in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:border-white/30 transition-colors"
          >
            <p className="text-gray-400 text-sm">
              Drop PDFs here or <span className="text-gray-700 underline">click to browse</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {files.length} file{files.length === 1 ? '' : 's'}
                  {totalPages > 0 && ` · ${totalPages} page${totalPages === 1 ? '' : 's'} total`}
                </p>
                <button
                  onClick={clear}
                  className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 hover:text-gray-700 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-col gap-1 border border-gray-200 p-2">
                {files.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="text-gray-400 font-mono text-xs w-5">{i + 1}</span>
                    <span className="font-mono flex-1 truncate" title={f.name}>
                      {f.name}
                    </span>
                    {f.pages != null && (
                      <span className="text-xs text-gray-400">{f.pages}p</span>
                    )}
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="border border-gray-200 px-2 py-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1}
                      className="border border-gray-200 px-2 py-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => remove(f.id)}
                      className="border border-gray-200 px-2 py-0.5 text-gray-500 hover:text-red-500"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleMerge}
                disabled={busy || files.length === 0}
                className="bg-gray-900 text-white border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
              >
                {busy ? 'Merging…' : `Merge ${files.length} file${files.length === 1 ? '' : 's'}`}
              </button>
            </>
          )}

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
        </div>
      }
    />
  );
};
