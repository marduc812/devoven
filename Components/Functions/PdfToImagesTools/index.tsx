'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { PdfRasterizer, ImageFormat } from './render';
import { downloadBlob } from '../PdfShared/pdfjs';

const THUMB_WIDTH = 200;

export const PdfToImages = () => {
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [scale, setScale] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyAll, setBusyAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rasterRef = useRef<PdfRasterizer | null>(null);
  const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => () => rasterRef.current?.destroy(), []);

  const baseName = () => fileName.replace(/\.pdf$/i, '') || 'page';

  const renderThumbs = useCallback(async (count: number) => {
    const raster = rasterRef.current;
    if (!raster) return;
    for (let i = 1; i <= count; i++) {
      const canvas = thumbRefs.current[i - 1];
      if (canvas) {
        try {
          await raster.renderThumb(canvas, i, THUMB_WIDTH);
        } catch {
          /* skip a page that fails to render */
        }
      }
    }
  }, []);

  const loadFile = async (file: File) => {
    rasterRef.current?.destroy();
    rasterRef.current = null;
    setError('');
    setPageCount(0);
    setFileName(file.name);
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const raster = await PdfRasterizer.create(bytes);
      rasterRef.current = raster;
      thumbRefs.current = new Array(raster.pageCount).fill(null);
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

  // Draw thumbnails once the canvases for the new page count have mounted.
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

  const downloadPage = async (pageNum: number) => {
    const raster = rasterRef.current;
    if (!raster) return;
    try {
      const blob = await raster.renderToBlob(pageNum, scale, format);
      downloadBlob(blob, `${baseName()}-${pageNum}.${format === 'jpeg' ? 'jpg' : 'png'}`);
    } catch {
      setError(`Could not export page ${pageNum}.`);
    }
  };

  const downloadAll = async () => {
    const raster = rasterRef.current;
    if (!raster) return;
    setBusyAll(true);
    setError('');
    try {
      for (let i = 1; i <= raster.pageCount; i++) {
        const blob = await raster.renderToBlob(i, scale, format);
        downloadBlob(blob, `${baseName()}-${i}.${format === 'jpeg' ? 'jpg' : 'png'}`);
        // Small gap so the browser doesn't drop rapid sequential downloads.
        await new Promise(r => setTimeout(r, 150));
      }
    } catch {
      setError('Could not export every page.');
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <Panel
      backColor="red"
      title="PDF to Images"
      description="Convert each page of a PDF to a [1PNG2] or [1JPG2] image. Choose a resolution, preview the pages, and download them individually or all at once. All processing happens in your browser."
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
            {fileName && <p className="text-gray-700 text-sm mt-2 font-mono">{fileName}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {loading && <p className="text-gray-500 text-sm font-mono">Reading PDF…</p>}

          {pageCount > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Format
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as ImageFormat)}
                    className="border border-gray-200 px-2 py-1 text-sm bg-white"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Resolution
                  <select
                    value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="border border-gray-200 px-2 py-1 text-sm bg-white"
                  >
                    <option value={1}>1× (screen)</option>
                    <option value={2}>2× (high)</option>
                    <option value={3}>3× (print)</option>
                  </select>
                </label>
                <button
                  onClick={downloadAll}
                  disabled={busyAll}
                  className="bg-gray-900 text-white border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busyAll ? 'Exporting…' : `Download all ${pageCount} page${pageCount === 1 ? '' : 's'}`}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
                  <div key={pageNum} className="flex flex-col gap-1">
                    <div className="border border-gray-200 bg-gray-50 p-1">
                      <canvas
                        ref={el => {
                          thumbRefs.current[pageNum - 1] = el;
                        }}
                        className="w-full h-auto block bg-white shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => downloadPage(pageNum)}
                      className="text-xs border border-gray-200 text-gray-500 px-2 py-1 hover:text-gray-700 transition-colors"
                    >
                      Page {pageNum} ↓
                    </button>
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
