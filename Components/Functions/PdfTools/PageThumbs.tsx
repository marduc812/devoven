'use client';

/**
 * Lazily-rendered PDF page thumbnails.
 *
 * `usePdfThumbs` owns one pdf.js document per loaded file and paints canvases
 * only once they scroll into view, so dropping a 400-page PDF costs nothing
 * until the user actually looks at page 300. Renders are serialised through a
 * promise chain — pdf.js is happier with one page at a time, and the visible
 * rows still fill top-to-bottom.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PdfRasterizer } from '../PdfToImagesTools/render';

const THUMB_WIDTH = 150;

export interface PdfThumbs {
    /** Attach a canvas for a 1-based page; `onPainted` fires once it has ink. */
    register: (canvas: HTMLCanvasElement, page: number, onPainted: () => void) => void;
    unregister: (canvas: HTMLCanvasElement) => void;
}

interface ThumbEntry {
    page: number;
    onPainted: () => void;
    /** The document generation this canvas was last painted for, if any. */
    paintedFor: number | null;
}

export function usePdfThumbs(bytes: Uint8Array | null): PdfThumbs {
    const rasterRef = useRef<PdfRasterizer | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const entries = useRef(new Map<HTMLCanvasElement, ThumbEntry>());
    const queue = useRef<Promise<void>>(Promise.resolve());
    // Bumped per loaded document, so a canvas React reuses across files or
    // layouts repaints instead of keeping the previous document's ink.
    const generation = useRef(0);

    const paint = useCallback((canvas: HTMLCanvasElement) => {
        const entry = entries.current.get(canvas);
        const raster = rasterRef.current;
        const gen = generation.current;
        if (!entry || !raster || entry.paintedFor === gen) return;
        entry.paintedFor = gen;
        queue.current = queue.current.then(async () => {
            // The canvas may have been unmounted, or the file swapped, while
            // this render sat in the queue.
            if (entries.current.get(canvas) !== entry || rasterRef.current !== raster) return;
            try {
                await raster.renderThumb(canvas, entry.page, THUMB_WIDTH);
                entry.onPainted();
            } catch {
                entry.paintedFor = null;
            }
        });
    }, []);

    /** Created on demand so a thumbnail can register before any effect runs. */
    const getObserver = useCallback(() => {
        if (!observerRef.current) {
            observerRef.current = new IntersectionObserver(
                observed => observed.forEach(e => { if (e.isIntersecting) paint(e.target as HTMLCanvasElement); }),
                { rootMargin: '300px' },
            );
        }
        return observerRef.current;
    }, [paint]);

    useEffect(() => {
        let cancelled = false;
        rasterRef.current?.destroy();
        rasterRef.current = null;
        generation.current += 1;
        if (!bytes) return;

        PdfRasterizer.create(bytes)
            .then(raster => {
                if (cancelled) { raster.destroy(); return; }
                rasterRef.current = raster;
                // Re-observing replays the callback for whatever is on screen now.
                entries.current.forEach((_, canvas) => {
                    getObserver().unobserve(canvas);
                    getObserver().observe(canvas);
                });
            })
            .catch(() => { /* the tool already surfaces load errors */ });

        return () => { cancelled = true; };
    }, [bytes, getObserver]);

    useEffect(
        () => () => {
            rasterRef.current?.destroy();
            observerRef.current?.disconnect();
        },
        [],
    );

    return useMemo(
        () => ({
            register: (canvas, page, onPainted) => {
                const existing = entries.current.get(canvas);
                entries.current.set(canvas, {
                    page,
                    onPainted,
                    // Reused DOM node showing a different page: repaint it.
                    paintedFor: existing && existing.page === page ? existing.paintedFor : null,
                });
                getObserver().observe(canvas);
            },
            unregister: canvas => {
                entries.current.delete(canvas);
                observerRef.current?.unobserve(canvas);
            },
        }),
        [getObserver],
    );
}

interface PageThumbProps {
    thumbs: PdfThumbs;
    /** 1-based page number. */
    page: number;
    label?: string;
    selected?: boolean;
    /** Dim the page — used for pages the current options leave out. */
    muted?: boolean;
    /** `lg` matches the height of an image preview in a media pane. */
    size?: 'sm' | 'lg';
    onClick?: (event: React.MouseEvent) => void;
}

export const PageThumb = ({ thumbs, page, label, selected, muted, size, onClick }: PageThumbProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        thumbs.register(canvas, page, () => setReady(true));
        return () => thumbs.unregister(canvas);
    }, [thumbs, page]);

    const frame = selected
        ? 'border-gray-900 bg-white'
        : muted
          ? 'border-gray-200 bg-gray-50 opacity-40'
          : 'border-gray-300 bg-gray-50';

    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            {...(onClick
                ? { type: 'button' as const, onClick, 'aria-pressed': !!selected, 'aria-label': `Page ${page}` }
                : {})}
            className={`group relative flex items-center justify-center p-1.5 border transition-all ${
                size === 'lg' ? 'h-40' : 'h-28'
            } ${frame} ${onClick ? 'cursor-pointer hover:border-gray-900' : ''}`}
        >
            {!ready && <span className="absolute inset-3 bg-gray-200 animate-pulse" aria-hidden />}
            <canvas
                ref={canvasRef}
                className={`relative max-w-full max-h-full block shadow-sm transition-opacity ${
                    ready ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <span
                className={`absolute bottom-0 left-0 px-1 py-px font-mono text-[10px] leading-tight ${
                    selected ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                }`}
            >
                {label ?? page}
            </span>
            {selected && (
                <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] leading-none px-1 py-0.5">
                    ✓
                </span>
            )}
        </Tag>
    );
};

/** Scrollable, responsive frame shared by every thumbnail grid. */
export const ThumbScroller = ({ children }: { children: React.ReactNode }) => (
    <div className="max-h-[26rem] overflow-y-auto border border-gray-300 bg-white p-3">{children}</div>
);

export const ThumbGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">{children}</div>
);
