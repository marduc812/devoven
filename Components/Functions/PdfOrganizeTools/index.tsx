'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { organizePdf } from './logic';
import { PdfRasterizer } from '../PdfToImagesTools/render';
import { downloadBlob } from '../PdfShared/pdfjs';

const THUMB_WIDTH = 180;

interface PageItem {
  key: number;
  srcIndex: number;
  rotation: number;
  removed: boolean;
}

export const PdfOrganize = () => {
  const [fileName, setFileName] = useState('');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rasterRef = useRef<PdfRasterizer | null>(null);
  // Keep the original bytes for pdf-lib export (the rasterizer keeps its own copy).
  const bytesRef = useRef<Uint8Array | null>(null);
  // Canvases keyed by original page index, so reordering never repaints them.
  const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => () => rasterRef.current?.destroy(), []);

  const renderThumbs = useCallback(async (count: number) => {
    const raster = rasterRef.current;
    if (!raster) return;
    for (let i = 1; i <= count; i++) {
      const canvas = thumbRefs.current[i - 1];
      if (canvas) {
        try {
          await raster.renderThumb(canvas, i, THUMB_WIDTH);
        } catch {
          /* skip */
        }
      }
    }
  }, []);

  const loadFile = async (file: File) => {
    rasterRef.current?.destroy();
    rasterRef.current = null;
    setError('');
    setPages([]);
    setPageCount(0);
    setFileName(file.name);
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      bytesRef.current = bytes;
      const raster = await PdfRasterizer.create(bytes);
      rasterRef.current = raster;
      thumbRefs.current = new Array(raster.pageCount).fill(null);
      setPages(
        Array.from({ length: raster.pageCount }, (_, i) => ({
          key: i,
          srcIndex: i,
          rotation: 0,
          removed: false,
        })),
      );
      setPageCount(raster.pageCount);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        /encrypt|password/i.test(msg)
          ? 'This PDF is encrypted/password-protected and cannot be read.'
          : 'Could not read this file. Make sure it is a valid PDF.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageCount > 0) renderThumbs(pageCount);
  }, [pageCount, renderThumbs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const rotate = (key: number, delta: number) =>
    setPages(prev =>
      prev.map(p =>
        p.key === key ? { ...p, rotation: (((p.rotation + delta) % 360) + 360) % 360 } : p,
      ),
    );

  const toggleRemove = (key: number) =>
    setPages(prev => prev.map(p => (p.key === key ? { ...p, removed: !p.removed } : p)));

  const move = (index: number, delta: number) =>
    setPages(prev => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const keptCount = pages.filter(p => !p.removed).length;

  const handleExport = async () => {
    const bytes = bytesRef.current;
    if (!bytes) return;
    const kept = pages.filter(p => !p.removed);
    if (kept.length === 0) {
      setError('Keep at least one page.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const out = await organizePdf(
        bytes,
        kept.map(p => ({ srcIndex: p.srcIndex, rotation: p.rotation })),
      );
      downloadBlob(
        new Blob([out as BlobPart], { type: 'application/pdf' }),
        fileName.replace(/\.pdf$/i, '') + '-organized.pdf',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      backColor="red"
      title="Rotate & Organize PDF"
      description="Reorder, rotate, and delete pages, then export a new PDF. Use [1↻2] to rotate, the arrows to reorder, and [1✕2] to remove a page. All processing happens in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:border-white/30 transition-colors"
          >
            <p className="text-gray-400 text-sm">
              Drop a PDF here or <span className="text-gray-700 underline">click to browse</span>
            </p>
            {fileName && <p className="text-gray-300 text-sm mt-2 font-mono">{fileName}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {loading && <p className="text-gray-500 text-sm font-mono">Reading PDF…</p>}

          {pages.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {keptCount} of {pages.length} page{pages.length === 1 ? '' : 's'} kept
                </p>
                <button
                  onClick={handleExport}
                  disabled={busy || keptCount === 0}
                  className="bg-gray-900 text-white border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? 'Building…' : 'Export PDF'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((p, i) => (
                  <div
                    key={p.key}
                    className={`flex flex-col gap-1 ${p.removed ? 'opacity-40' : ''}`}
                  >
                    <div className="relative border border-gray-200 bg-gray-50 p-2 overflow-hidden flex items-center justify-center h-44">
                      <canvas
                        ref={el => {
                          thumbRefs.current[p.srcIndex] = el;
                        }}
                        className="max-w-full max-h-full block bg-white shadow-sm transition-transform"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                      <span className="absolute top-1 left-1 text-xs font-mono bg-gray-900 text-white px-1.5 py-0.5">
                        {i + 1}
                      </span>
                      {p.removed && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-red-500 bg-white/60">
                          Removed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotate(p.key, -90)}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
                        aria-label="Rotate left"
                      >
                        ↺
                      </button>
                      <button
                        onClick={() => rotate(p.key, 90)}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
                        aria-label="Rotate right"
                      >
                        ↻
                      </button>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === pages.length - 1}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        aria-label="Move later"
                      >
                        →
                      </button>
                      <button
                        onClick={() => toggleRemove(p.key)}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-red-500 ml-auto"
                        aria-label={p.removed ? 'Restore' : 'Remove'}
                      >
                        {p.removed ? '↶' : '✕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
        </div>
      }
    />
  );
};
