'use client';

import React, { useState, useRef, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { imagesToPdf, PageSizing, ImageInput } from './logic';
import { downloadBlob } from '../PdfShared/pdfjs';

interface ImageItem {
  id: number;
  name: string;
  type: string;
  bytes: Uint8Array;
  url: string;
}

let nextId = 0;

export const ImagesToPdf = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [sizing, setSizing] = useState<PageSizing>('image');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid leaks.
  const itemsRef = useRef<ImageItem[]>([]);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach(i => URL.revokeObjectURL(i.url)), []);

  const addFiles = async (list: FileList) => {
    setError('');
    const incoming = Array.from(list).filter(f => /^image\//i.test(f.type) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name));
    if (incoming.length === 0) {
      setError('Drop one or more image files (PNG, JPG, WebP…).');
      return;
    }
    const loaded: ImageItem[] = [];
    for (const file of incoming) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = new Blob([bytes as BlobPart], { type: file.type || 'image/png' });
      loaded.push({
        id: nextId++,
        name: file.name,
        type: file.type,
        bytes,
        url: URL.createObjectURL(blob),
      });
    }
    setItems(prev => [...prev, ...loaded]);
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
    setItems(prev => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: number) => {
    setItems(prev => {
      const found = prev.find(i => i.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const clear = () => {
    items.forEach(i => URL.revokeObjectURL(i.url));
    setItems([]);
    setError('');
  };

  const handleBuild = async () => {
    if (items.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const inputs: ImageInput[] = items.map(i => ({ name: i.name, type: i.type, bytes: i.bytes }));
      const out = await imagesToPdf(inputs, sizing);
      downloadBlob(new Blob([out as BlobPart], { type: 'application/pdf' }), 'images.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      backColor="red"
      title="Images to PDF"
      description="Combine [1JPG2], [1PNG2], and other images into a single PDF — one image per page. Reorder the images, pick a page size, and download. All processing happens in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:border-white/30 transition-colors"
          >
            <p className="text-gray-400 text-sm">
              Drop images here or <span className="text-gray-700 underline">click to browse</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {items.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Page size
                  <select
                    value={sizing}
                    onChange={e => setSizing(e.target.value as PageSizing)}
                    className="border border-gray-200 px-2 py-1 text-sm bg-white"
                  >
                    <option value="image">Fit page to image</option>
                    <option value="a4">A4 portrait</option>
                    <option value="a4-landscape">A4 landscape</option>
                  </select>
                </label>
                <button
                  onClick={clear}
                  className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 hover:text-gray-700 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item, i) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="relative border border-gray-200 bg-gray-50 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-32 object-contain bg-white"
                      />
                      <span className="absolute top-1 left-1 text-xs font-mono bg-gray-900 text-white px-1.5 py-0.5">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
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
                        disabled={i === items.length - 1}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        aria-label="Move later"
                      >
                        →
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:text-red-500 ml-auto"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBuild}
                disabled={busy}
                className="bg-gray-900 text-white border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
              >
                {busy ? 'Building…' : `Create PDF (${items.length} image${items.length === 1 ? '' : 's'})`}
              </button>
            </>
          )}

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
        </div>
      }
    />
  );
};
